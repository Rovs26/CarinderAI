# Known Issues

- **Workspace subfolder**: App is in `carinderai/` because the Cursor workspace root contains non-app folders (`mcps/`, etc.).
- **npm in sandbox**: Agent shell may not write `node_modules` in workspace; run `npm install` locally.
- **Send to supplier**: Intentionally disabled until backend exists.
- **Extraction**: Mock only — button fills `sampleExtractedText` / `sampleExtractedOrder`.
- **No auth / DB**: All state is client-side and resets on refresh (except file preview URLs).
- **Forecast**: Rule-based frontend logic; weather is a manual select, not live API.
