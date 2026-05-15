# CarinderAI

AI-powered ordering and operations assistant for Philippine carinderia owners. Mobile-first Next.js 15 MVP.

## Local development

```bash
cd carinderai
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Main demo: **Capture Order** (`/capture-order`).

Use **Use demo order** on the capture page if camera or API is unavailable during a live presentation.

## Environment variables

Copy the example file and add your key only on your machine (never commit `.env.local`):

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Optional for demos | Server-side key for real handwriting extraction via `/api/extract-order` |

- **With key:** uploaded photos are parsed by OpenAI Vision.
- **Without key:** extraction falls back to a demo order automatically — judges can still test the full confirm flow.

Do not use `NEXT_PUBLIC_OPENAI_API_KEY`. The key must never reach the browser.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production build locally |

## Deploy to Vercel

1. Push the repo and import the project in [Vercel](https://vercel.com).
2. Set **Root Directory** to `carinderai` (if the repo contains other folders).
3. Framework preset: **Next.js** (default).
4. Add environment variable:
   - `OPENAI_API_KEY` — your OpenAI API key (Production + Preview recommended).
5. Deploy. Mock fallback still works if the variable is omitted.

### PWA on device

After deploy, open the site on a phone and use the browser **Add to Home Screen** option. `manifest.json` and theme color are included; no service worker in this MVP.

## Demo tips

1. **Home** → **Capture order** → photo or **Use demo order** → **Extract** → edit → **Confirm**.
2. **Dashboard** (`/owner`) for today’s metrics and next action.
3. **Finance** / **Forecast** for daily profit and prep planning.

## Security notes

- **Secrets:** `OPENAI_API_KEY` is read only in `app/api/extract-order/route.ts` (server). Never commit `.env.local` or use `NEXT_PUBLIC_` for API keys.
- **Uploads:** `POST /api/extract-order` only; images required; max 5MB; allowed types JPEG/PNG/WebP/GIF (and HEIC where reported by the browser).
- **Errors:** API responses are generic JSON messages — no stack traces or internal details leaked to clients.
- **Rate limit:** In-memory limit of 5 requests per IP per 15 minutes on `/api/extract-order` (fine for hackathon/demo). For production, use Vercel middleware with [Upstash](https://upstash.com/), Vercel KV, or similar — in-memory limits reset on cold starts and do not work across multiple instances.
- **Before deploy:** Run `npm run build` and scan the repo for accidental keys (see commands below).

```bash
grep -R "sk-" . --exclude-dir=node_modules --exclude-dir=.next || true
grep -R "NEXT_PUBLIC_OPENAI_API_KEY" . --exclude-dir=node_modules --exclude-dir=.next || true
```
