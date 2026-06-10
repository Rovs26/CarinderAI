import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI, OpenAIConfigError } from '@/lib/openai';
import { TrayResult } from '@/lib/schemas';

// POST /api/tray
//
// Accepts a multipart/form-data body with an `image` field, base64-encodes
// the image, sends it to OpenAI GPT-4o vision with `response_format: { type:
// 'json_object' }`, and returns a parsed/validated `TrayResult`. The vision
// prompt is constrained to the 6 dishes in `lib/tray-menu.ts` so the model
// cannot hallucinate items outside the menu.
//
// Mirrors the error-handling shape of `app/api/scan/route.ts`:
//   - 400 if the `image` field is missing
//   - 500 if `OPENAI_API_KEY` is not set
//   - 200 `{ items: [] }` on parse / zod failure (silent fallback)
//   - 200 with the validated `TrayResult` on success
//
// See: lib/tray-menu.ts (the canonical menu) and design.md §Scan_API
// Detailed Design (analogous error matrix).
const SYSTEM_PROMPT =
  "You are a vision assistant for a Filipino carinderia point-of-sale system. Look at this photo of a customer's food tray and identify which dishes are present from the following menu ONLY:\n\n" +
  "- adobo: Soy-vinegar braised pork or chicken, dark brown\n" +
  "- sinigang: Sour tamarind soup with meat and vegetables, clear broth\n" +
  "- kare-kare: Peanut-sauce oxtail stew, thick orange-brown sauce\n" +
  "- pinakbet: Mixed vegetables (eggplant, okra, squash) sautéed\n" +
  "- lechon-kawali: Deep-fried crispy pork belly, golden-brown crackling skin\n" +
  "- rice: Plain white steamed rice\n\n" +
  "Return ONLY valid JSON matching: {items: [{dishId: 'adobo'|'sinigang'|'kare-kare'|'pinakbet'|'lechon-kawali'|'rice', quantity: number}]}. Quantity is how many servings of that dish are on the tray (usually 1). Only include dishes you actually see. If you cannot identify any dish from the menu, return {items: []}. Do not invent dishes outside this list.";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const form = await req.formData();
    const file = form.get('image');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Missing image field' },
        { status: 400 },
      );
    }

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

    const buf = Buffer.from(await file.arrayBuffer());
    const mime = file.type || 'image/jpeg';
    const dataUrl = `data:${mime};base64,${buf.toString('base64')}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Identify the dishes on this tray.' },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '{"items":[]}';

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ items: [] });
    }

    const result = TrayResult.safeParse(parsed);
    return NextResponse.json(result.success ? result.data : { items: [] });
  } catch (err) {
    console.error('[POST /api/tray] Internal error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
