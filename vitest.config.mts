import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Single smoke test runner config for `/api/scan`.
// See: .kiro/specs/carinderai/design.md §Smoke Test Design
// Requirements: 18.1, 18.2, 18.3
//
// Note: this file uses the `.mts` extension because Vitest 4.x is
// ESM-only and the project's `package.json` does not declare
// `"type": "module"` — `.mts` forces Node to load this config as ESM
// without requiring a wider package-level change.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      // Mirror the `@/*` path alias from tsconfig.json so that
      // `vi.mock('@/lib/openai', ...)` and `import('@/app/api/scan/route')`
      // resolve identically under Vitest as they do under Next.js.
      '@': path.resolve(__dirname, '.'),
    },
  },
});
