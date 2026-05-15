import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { checkExtractRateLimit, getClientIp } from "@/lib/extract-rate-limit";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

type ExtractedItem = {
  item: string;
  quantity: number;
  unit: string;
  notes: string;
};

type ExtractionResult = {
  extractedText: string;
  items: ExtractedItem[];
  confidence: "high" | "medium" | "low";
  warnings: string[];
};

function isConfidence(value: unknown): value is ExtractionResult["confidence"] {
  return value === "high" || value === "medium" || value === "low";
}

function parseExtractionPayload(raw: string): ExtractionResult | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;
  if (typeof record.extractedText !== "string") return null;
  if (!isConfidence(record.confidence)) return null;
  if (!Array.isArray(record.items) || record.items.length === 0) return null;

  const warnings = Array.isArray(record.warnings)
    ? record.warnings
        .filter((w): w is string => typeof w === "string")
        .slice(0, 20)
    : [];

  const items: ExtractedItem[] = [];
  for (const entry of record.items.slice(0, 50)) {
    if (!entry || typeof entry !== "object") return null;
    const row = entry as Record<string, unknown>;
    if (typeof row.item !== "string" || row.item.trim() === "") return null;
    if (typeof row.unit !== "string") return null;
    const quantity = typeof row.quantity === "number" ? row.quantity : Number(row.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) return null;
    items.push({
      item: row.item.trim().slice(0, 200),
      quantity,
      unit: row.unit.trim().slice(0, 50) || "pcs",
      notes: typeof row.notes === "string" ? row.notes.trim().slice(0, 500) : "",
    });
  }

  return {
    extractedText: record.extractedText.trim().slice(0, 2000),
    items,
    confidence: record.confidence,
    warnings,
  };
}

function methodNotAllowed() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export function GET() {
  return methodNotAllowed();
}

export function PUT() {
  return methodNotAllowed();
}

export function PATCH() {
  return methodNotAllowed();
}

export function DELETE() {
  return methodNotAllowed();
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip")
  );

  const rate = checkExtractRateLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: rate.retryAfterSec
          ? { "Retry-After": String(rate.retryAfterSec) }
          : undefined,
      }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key is not configured" },
      { status: 500 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const image = formData.get("image");

  if (image === null || image === undefined) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }

  if (typeof image === "string") {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }

  if (!(image instanceof Blob)) {
    return NextResponse.json({ error: "Invalid image upload" }, { status: 400 });
  }

  if (image.size === 0) {
    return NextResponse.json({ error: "Image file is empty" }, { status: 400 });
  }

  if (image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image exceeds 5MB limit" }, { status: 400 });
  }

  const mimeType = image.type || "";
  if (!mimeType.startsWith("image/") || !ALLOWED_IMAGE_TYPES.has(mimeType)) {
    return NextResponse.json(
      { error: "File must be a supported image (JPEG, PNG, WebP, or GIF)" },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await image.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You read handwritten supplier order lists for Philippine carinderia (small eateries).
Extract every line item into strict JSON only. No markdown.
Schema:
{
  "extractedText": "single-line summary of the list as written",
  "items": [{ "item": "product name", "quantity": number, "unit": "kg|liters|trays|pcs|etc", "notes": "usage or blank" }],
  "confidence": "high"|"medium"|"low",
  "warnings": ["optional issues like unclear handwriting"]
}
Rules: quantity must be a positive number; notes may be ""; use warnings for ambiguity.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract this handwritten carinderia supplier order list.",
            },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty model response");
    }

    const parsed = parseExtractionPayload(content);
    if (!parsed) {
      throw new Error("Invalid extraction JSON");
    }

    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "Failed to extract order", fallbackAvailable: true },
      { status: 500 }
    );
  }
}
