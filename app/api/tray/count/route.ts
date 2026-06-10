import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI, OpenAIConfigError } from '@/lib/openai';
import { CounterFrame } from '@/lib/schemas';

/**
 * POST /api/tray/count — single Counter Session frame.
 *
 * Mirrors `/api/tray`'s error-handling contract:
 *   - 400 if the `image` field is missing
 *   - 500 if `OPENAI_API_KEY` is not set
 *   - 200 with all-zeros on parse / zod failure (fail soft so the live
 *     session loop doesn't break on a single flaky model response)
 *   - 200 with the validated `CounterFrame` on success
 *
 * The system prompt asks GPT-4o vision to COUNT visible servings of each
 * of the 6 known dishes — different from the per-tray identification
 * task in `/api/tray`. The model must emit every dish key (set to 0
 * when absent) so the client can diff consecutive frames without
 * branching on missing keys.
 */
const SYSTEM_PROMPT =
  "You are a vision assistant for a Filipino carinderia point-of-sale. Look at this photo of a food counter. Count the visible TRAYS or SERVINGS of each dish from this menu ONLY:\n\n" +
  "- adobo: Soy-vinegar braised pork or chicken, dark brown\n" +
  "- sinigang: Sour tamarind soup with meat and vegetables, clear broth\n" +
  "- kare-kare: Peanut-sauce oxtail stew, thick orange-brown sauce\n" +
  "- pinakbet: Mixed vegetables (eggplant, okra, squash) sautéed\n" +
  "- lechon-kawali: Deep-fried crispy pork belly, golden-brown crackling skin\n" +
  "- rice: Plain white steamed rice (count individual cups or scoops)\n\n" +
  "Return ONLY valid JSON matching: {counts: {adobo: number, sinigang: number, 'kare-kare': number, pinakbet: number, 'lechon-kawali': number, rice: number}}. Every dish key MUST be present, set to 0 if not visible. Count individual visible portions (e.g., 5 cups of rice = 5). If the photo is unclear or contains no recognizable counter, return all zeros. Do not invent dishes outside this list.";

const ZERO_COUNTS = {
  counts: {
    adobo: 0,
    sinigang: 0,
    'kare-kare': 0,
    pinakbet: 0,
    'lechon-kawali': 0,
    rice: 0,
  },
};

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
            { type: 'text', text: 'Count the dishes visible on this counter.' },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? JSON.stringify(ZERO_COUNTS);

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(ZERO_COUNTS);
    }

    const result = CounterFrame.safeParse(parsed);
    return NextResponse.json(result.success ? result.data : ZERO_COUNTS);
  } catch (err) {
    console.error('[POST /api/tray/count] Internal error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
