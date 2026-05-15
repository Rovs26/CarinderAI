# Agent Handoff

## Location
`carinderai/` under workspace — open this folder as project root for Vercel/deploy.

## Commands
```bash
cd carinderai
npm install
npm run dev    # http://localhost:3000
npm run build
```

## Architecture
| Path | Role |
|------|------|
| `lib/mock-data.ts` | All mock entities + `computeForecast()` |
| `lib/utils.ts` | `formatPeso`, `formatPercent` |
| `app/capture-order/CaptureOrderWorkflow.tsx` | Main demo (client) |
| `app/page.tsx` | Landing (standalone nav, no AppShell) |
| `components/AppShell.tsx` | Nav + layout wrapper for app routes |

## Demo flow
1. `/` → **Capture Order**
2. Upload image → **Extract order** → edit rows → **Confirm order**
3. `/owner` → Finance / Forecast

## Phase 2 checklist
1. `POST /api/extract-order` — OpenAI vision, `OPENAI_API_KEY` in Vercel env only
2. Supabase tables: `orders`, `order_items`, `daily_finance`
3. Clerk middleware on `/owner`, `/capture-order`, `/finance`, `/forecast`
4. Enable **Send to supplier** when messaging integration exists

## Build note
Build verified externally; run `npm install && npm run build` in `carinderai/` on your machine before deploy.
