# Production Progress

## Status: MVP complete — build verified

### Done
- [x] Next.js 15 App Router + TypeScript + Tailwind v4
- [x] `lib/mock-data.ts` — carinderias, dishes, suppliers, dashboard, extraction sample, finance, forecast logic
- [x] Components: AppShell, NavBar, MetricCard, SectionHeader, StatusBadge, DishCard, SupplierCard
- [x] `/` landing (hero, problem, solution, features, impact, CTAs)
- [x] `/owner` dashboard with metrics, alerts, prep suggestion, CTAs
- [x] `/capture-order` — 4-step workflow, mobile camera input, mock extract, editable table, confirm card
- [x] `/finance` — revenue/expense inputs, auto profit & margin
- [x] `/forecast` — rule-based demand, prep, budget, notes
- [x] `/discover` — carinderia list + dish cards
- [x] `/suppliers` — supplier cards (create order disabled)
- [x] `npm run build` passes (verified in `/tmp/carinderai-build` copy)

### Not started
- [ ] OpenAI `/api/extract-order`
- [ ] Supabase persistence
- [ ] Clerk auth
- [ ] Vercel production deploy

### Local run
```bash
cd carinderai
npm install
npm run dev
```
