import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI, OpenAIConfigError } from '@/lib/openai';
import { OcrResult } from '@/lib/schemas';

// POST /api/scan
//
// Accepts a multipart/form-data body with an `image` field, base64-encodes the
// image, sends it to OpenAI GPT-4o vision with `response_format: { type:
// 'json_object' }`, and returns a parsed/validated OcrResult. On any parse or
// schema failure, returns 200 `{ items: [] }` per Req 7.6.
//
// See: .kiro/specs/carinderai/design.md §Scan_API Detailed Design,
//      §Error Handling Matrix
// Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.10
//
// NOTE: `SYSTEM_PROMPT` below intentionally diverges from the verbatim text in
// Requirement 7.3. The user has explicitly authorized this override so the
// downstream Marketplace_Matcher can hit Tagalog product names regardless of
// the OCR'd source language (the original prompt only translated tl→en; this
// version also translates en→tl in the `translated` field with a small seed
// dictionary). Do not "fix" this back to the Req 7.3 wording without user
// sign-off.
const SYSTEM_PROMPT =
  "You are an OCR assistant for a Filipino carinderia palengke list. Extract items, quantities, and units. Return ONLY valid JSON matching: {items: [{name: string, quantity: number, unit: 'kg'|'pc'|'L'|'pack'|'bundle', note?: string}]}. If the item name is in Tagalog, put the English in 'translated'. If the item name is in English, put the Filipino/Tagalog equivalent in 'translated' (e.g., 'Onion' → 'Sibuyas', 'Garlic' → 'Bawang', 'Pork' → 'Baboy', 'Chicken' → 'Manok', 'Eggs' → 'Itlog', 'Tomato' → 'Kamatis', 'Cooking oil' → 'Mantika', 'Rice' → 'Bigas'). If unreadable, return {items: []}.";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const form = await req.formData();
    const file = form.get('image');

    // Req 7.7: missing `image` field → 400
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Missing image field' },
        { status: 400 },
      );
    }

    // Req 7.4 / 7.8: env-driven OpenAI client; missing key → 500
    let openai;
    try {
      openai = getOpenAI();
    } catch (err) {
      if (err instanceof OpenAIConfigError) {
        return NextResponse.json(
          { error: 'Server misconfiguration: OPENAI_API_KEY not set' },
          { status: 500 },
        );
      }
      throw err;
    }

    // Req 7.2: base64-encode the upload as a data URL
    const buf = Buffer.from(await file.arrayBuffer());
    const mime = file.type || 'image/jpeg';
    const dataUrl = `data:${mime};base64,${buf.toString('base64')}`;

    // Req 7.3 / 7.10: GPT-4o vision call with strict JSON response format
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract the items from this palengke list.' },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '{"items":[]}';

    // Req 7.6: safe JSON parse + zod validation; either failure → 200 {items:[]}
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ items: [] });
    }

    const result = OcrResult.safeParse(parsed);
    return NextResponse.json(result.success ? result.data : { items: [] });
  } catch (err) {
    console.error('[POST /api/scan] Internal error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
