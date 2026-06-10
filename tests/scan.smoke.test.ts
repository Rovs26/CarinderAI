/**
 * Single smoke test for `POST /api/scan`.
 *
 * This is the ONLY automated test in the codebase per Requirement 18.3 — do
 * not add other tests (unit, integration, property) here or anywhere else
 * in the repo without updating the spec first.
 *
 * Strategy:
 *   1. Mock `@/lib/openai` so `getOpenAI()` returns a stub whose
 *      `chat.completions.create` resolves to a canned JSON-string completion.
 *      This means the test makes no real network call and does not require a
 *      real `OPENAI_API_KEY` in the dev/CI environment (Req 18.1).
 *   2. Set `process.env.OPENAI_API_KEY = 'test'` before the route module is
 *      imported so the route's env-check guard (Req 7.8) passes regardless of
 *      the runner's ambient environment.
 *   3. Build a `Request` with multipart `FormData` containing a real (tiny)
 *      JPEG fixture, call the route's `POST` directly, assert status 200,
 *      validate the response body against the `OcrResult` zod schema, and
 *      confirm the mocked `chat.completions.create` was invoked (Req 18.2).
 *
 * See: .kiro/specs/carinderai/design.md §Smoke Test Design
 * Requirements: 18.1, 18.2, 18.3
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// A vi.fn() captured at module scope so the test body can assert it was
// invoked. The factory inside `vi.mock` references this via a hoisted
// `vi.hoisted(...)` block — this is the supported Vitest pattern for sharing
// state between a hoisted mock factory and the test file.
const { mockCreate } = vi.hoisted(() => {
  return {
    mockCreate: vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            // Canned JSON response per the task spec. The route JSON-parses
            // this and validates against the OcrResult schema.
            content: '{"items":[{"name":"pork","quantity":1,"unit":"kg"}]}',
          },
        },
      ],
    }),
  };
});

vi.mock('@/lib/openai', () => {
  // Mirror the real module shape so the route's `instanceof OpenAIConfigError`
  // check (Req 7.8 path) still typechecks; this mock never throws so the
  // happy path is exercised.
  class OpenAIConfigError extends Error {
    constructor(message = 'OPENAI_API_KEY is not set') {
      super(message);
      this.name = 'OpenAIConfigError';
    }
  }
  const getOpenAI = vi.fn(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
  return { getOpenAI, OpenAIConfigError };
});

beforeAll(() => {
  // Required so the route's env-guard (Req 7.8) does not 500 us out of the
  // 200-path before reaching the mocked OpenAI call. The value itself is
  // never sent anywhere — the OpenAI client is fully mocked above.
  process.env.OPENAI_API_KEY = 'test';
});

describe('POST /api/scan smoke', () => {
  it('returns 200 with OCR_Result-shaped JSON for a sample image and invokes the OpenAI client', async () => {
    // Resolve the fixture path relative to this test file. We use
    // `import.meta.url` because Vitest runs this as an ESM module and
    // `__dirname` is not defined in that context.
    const here = path.dirname(fileURLToPath(import.meta.url));
    const sample = fs.readFileSync(path.join(here, 'fixtures', 'palengke-list.jpg'));

    // Node 20 exposes `File`, `FormData`, and `Request` as Web-standard
    // globals — no polyfills needed.
    const file = new File([sample], 'palengke-list.jpg', { type: 'image/jpeg' });
    const form = new FormData();
    form.set('image', file);
    const req = new Request('http://localhost/api/scan', {
      method: 'POST',
      body: form,
    });

    // Lazy-import the route AFTER `vi.mock` has been registered. (Vitest
    // hoists `vi.mock` calls, so a static `import` at the top would also
    // work, but the dynamic import here makes the ordering explicit.)
    const { POST } = await import('@/app/api/scan/route');
    const { OcrResult } = await import('@/lib/schemas');

    // The route is typed against `NextRequest`; a plain `Request` works
    // because the implementation only touches Web-standard APIs
    // (`req.formData()`).
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(200);

    const body = await res.json();
    const parsed = OcrResult.safeParse(body);
    expect(parsed.success).toBe(true);

    // Sanity-check: the route really did call into the (mocked) OpenAI client.
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});
