import OpenAI from 'openai';

/**
 * Typed error thrown by `getOpenAI()` when `OPENAI_API_KEY` is not present in
 * the environment. The `/api/scan` route handler can `instanceof`-check this
 * to map the failure to a 500 response per Requirement 7.8.
 */
export class OpenAIConfigError extends Error {
  constructor(message = 'OPENAI_API_KEY is not set') {
    super(message);
    this.name = 'OpenAIConfigError';
  }
}

/**
 * Lazily construct a fresh OpenAI SDK client. Lazy construction lets this
 * module be imported safely even when `OPENAI_API_KEY` is unset — callers
 * (e.g. `/api/scan`) can short-circuit before invoking `getOpenAI()`.
 *
 * Returning a fresh instance per call keeps the export stub-friendly for the
 * `/api/scan` smoke test, which mocks this module via `vi.mock('@/lib/openai')`.
 *
 * @throws {OpenAIConfigError} when `OPENAI_API_KEY` is missing.
 */
export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new OpenAIConfigError();
  }
  return new OpenAI({ apiKey });
}
