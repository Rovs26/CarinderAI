# Implementation Plan: CarinderAI

Convert the feature design into a series of prompts for a code-generation LLM that will implement each step with incremental progress. Make sure that each prompt builds on the previous prompts, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step. Focus ONLY on tasks that involve writing, modifying, or testing code.

## Overview

CarinderAI ships in strict tier order (Req 20): Foundation → Seed → Tier 1 (Logistics, Accounting, OCR) → Tier 2 (Dashboard, Customer Browse) → Tier 3 (Insights, Tray Tally) → Polish. Tier 1 must be fully functional end-to-end before any Tier 2 work; Tier 2 before Tier 3; Tier 3 before final polish. Per Req 18, the codebase ships exactly one automated test (the `/api/scan` smoke test) — no other tests are added. All currency rendering goes through `formatPhp` (Req 16); Tailwind tokens use `primary #F58220` and `cream #FFF4E6` (Req 1.7).

## Tasks

- [x] 1. Foundation — Next.js 14 + TypeScript strict + Tailwind + Prisma + SQLite
  - [x] 1.1 Scaffold the Next.js 14 App Router project
    - Run `create-next-app` with App Router, TypeScript, Tailwind, ESLint (Next default config)
    - Enable `"strict": true` in `tsconfig.json`
    - Confirm initial `app/layout.tsx`, `app/page.tsx`, `app/globals.css` exist
    - Add `.gitignore` entries for `prisma/dev.db` and `.env`
    - _Requirements: 19.5, 20.1_
    - _Design: §Architecture, §Directory Layout_

  - [x] 1.2 Install runtime dependencies and configure Tailwind theme
    - Add deps: `prisma`, `@prisma/client`, `zod`, `zustand`, `fuse.js`, `react-hot-toast`, `recharts`, `date-fns`, `openai`, `lucide-react`
    - Add dev deps: `vitest`, `@types/node`
    - Write `tailwind.config.ts` with `primary: '#F58220'`, `cream: '#FFF4E6'`, `ink`, `muted`, `success`, `danger`, `boxShadow.scan`, `boxShadow.card`, font family `Inter, system-ui, sans-serif`
    - _Requirements: 1.7, 16.1, 19.4_
    - _Design: §Styling System_

  - [x] 1.3 Define Prisma schema with all 7 models and run initial migration
    - Create `prisma/schema.prisma` with `provider = "sqlite"` and `url = env("DATABASE_URL")`
    - Define `enum Unit { kg pc L pack }` and `enum JournalEntryType { REVENUE EXPENSE }`
    - Define models: `Supplier`, `Product` (with `@@index([category])`, `@@index([supplierId])`), `Order`, `OrderItem` (with FKs and cascade), `JournalEntry` (optional `sourceOrderId` FK), `Carinderia`, `MenuItem`
    - `OrderItem.quantity` is `Float`; `Product.imageUrl` stores a single emoji glyph (Req 14.2)
    - Add `DATABASE_URL="file:./dev.db"` to `.env`; create `.env.example` placeholder for `OPENAI_API_KEY=` (deferred to 15.12 for full content)
    - Run `prisma migrate dev --name init`
    - _Requirements: 14.1–14.13, 7.9_
    - _Design: §Data Models, §Prisma Schema_

- [x] 2. Seed data
  - [x] 2.1 Implement `prisma/seed.ts`
    - Create exactly 6 Suppliers per the table in Design §Seed Plan: Magnolia Meats (Meat), Dizon Farms (Vegetables), **Bounty Fresh (Poultry & Fish)**, NutriAsia (Condiments), Pure Foods (Meat (processed)), **Farm Fresh (Produce & Grains)**
    - Create 28 Products spanning categories `Meat & Eggs`, `Fish`, `Vegetables`, `Condiments`, `Rice/Grains` with unit ∈ `{kg, pc, L, pack}` and emoji-glyph `imageUrl` (per Design §Seed Plan table)
    - Create exactly 4 Carinderia records with realistic Makati names: Aling Nena's Carinderia (Poblacion), Tita Beth's Lutong Bahay (Bel-Air), Mang Pedro's Turo-Turo (Guadalupe Nuevo), Lola Cora's Kitchen (San Antonio)
    - Create ≥3 MenuItems per Carinderia per Design §Seed Plan
    - Create JournalEntries spanning the last 7 calendar days with a mix of `REVENUE` (Sales) and `EXPENSE` (Supplies, Palengke, Utilities, LPG) so Finance list and 7-day chart are non-empty on first launch
    - For "today", create at least one EXPENSE attached to a seeded `Order` with `sourceOrderId` set so the auto-journaling invariant has a concrete row
    - _Requirements: 15.1–15.8_
    - _Design: §Seed Plan_

  - [x] 2.2 Wire `prisma db seed` and verify counts
    - Add `"prisma": { "seed": "tsx prisma/seed.ts" }` to `package.json` (install `tsx` as dev dep)
    - Run `prisma db seed`
    - Verify counts: 6 Suppliers, 28 Products, 4 Carinderias, ≥12 MenuItems, ≥7 JournalEntries spread across the last 7 days
    - _Requirements: 15.1, 15.8_
    - _Design: §Seed Plan_

- [ ] 3. Checkpoint — Foundation and seed verified
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Tier 1 — Logistics: Market, Cart, Checkout
  - [x] 4.1 Implement `lib/prisma.ts` singleton and `lib/currency.ts` `formatPhp`
    - `lib/prisma.ts`: PrismaClient singleton guarded against hot-reload duplication
    - `lib/currency.ts`: `formatPhp(amount: number)` returning `'₱X,XXX.XX'` via `Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`
    - _Requirements: 16.1, 16.2_
    - _Design: §Styling System (currency), §Architecture_

  - [x] 4.2 Implement Zustand cart store with persist
    - Create `lib/cart-store.ts` exporting `useCart` with state `{ lines: CartLine[], unmatched: UnmatchedLine[] }`
    - Actions: `addProduct(line, qty=1)`, `setQuantity(productId, qty)` enforcing `Math.max(0.01, qty)`, `removeProduct`, `clear`, `prefillFromScan(matched, unmatched)`, `totalPhp()` (matched lines only — unmatched excluded from total)
    - Wrap with `persist` middleware and `name: 'carinderai.cart'` (localStorage)
    - _Requirements: 3.1, 3.2, 3.3, 8.2, 8.3_
    - _Design: §Cart State Design (Zustand)_

  - [x] 4.3 Add `CreateOrderInput` zod schema to `lib/schemas.ts`
    - Create `lib/schemas.ts` and export `CreateOrderInput = z.object({ lines: z.array(z.object({ productId: z.string().min(1), quantity: z.number().positive().min(0.01) })).min(1) })`
    - _Requirements: 3.4, 3.5, 3.6_
    - _Design: §Server Actions / API Routes Catalog (Input zod)_

  - [x] 4.4 Build `CategoryChipRow` component
    - Horizontal scrolling chips with labels: All, Meat & Eggs, Fish, Vegetables, Condiments, Rice/Grains
    - Active chip uses `primary` color; inactive uses `cream` background
    - Props: `categories: string[]`, `active: string`, `onSelect(category: string)`
    - _Requirements: 2.7_
    - _Design: §UI Component Inventory_

  - [x] 4.5 Build `ProductCard` component
    - Renders emoji glyph (`product.imageUrl`), name, unit, `formatPhp(pricePhp)`, stock, "Add to cart" button
    - Calls `useCart().addProduct(...)` on tap
    - _Requirements: 2.4, 3.1, 16.1_
    - _Design: §UI Component Inventory_

  - [x] 4.6 Build `EmptyState` component
    - Props: `title`, `body`, optional `cta`
    - Centered, friendly Filipino copy slot, used by every empty list view
    - _Requirements: 2.6, 4.8, 6.7, 17.1_
    - _Design: §UI Component Inventory_

  - [x] 4.7 Build `/market` page with Supplier filter + CategoryChipRow + ProductCard grid
    - RSC reads Suppliers and Products via `lib/prisma.ts`
    - Client island handles category chip and supplier filter state (Zustand-free, local `useState`)
    - Renders `EmptyState` when filtered list is empty (Req 2.6)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
    - _Design: §Routing Map, §UI Component Inventory_

  - [x] 4.8 Build `CartLine` component
    - Renders emoji + name + qty stepper (`+`/`-` and direct input enforcing ≥ 0.01) + `formatPhp(line total)`
    - Calls `useCart().setQuantity` and `removeProduct`
    - _Requirements: 3.2, 3.3, 16.1_
    - _Design: §UI Component Inventory_

  - [x] 4.9 Build `/market/cart` page with checkout
    - Client component using `useCart()`; renders `CartLine` per line + a separate "unmatched" list (excluded from total per Req 8.3)
    - Cart total via `useCart().totalPhp()` rendered with `formatPhp`
    - "Bayaran na" (cta_checkout) button POSTs `{ lines: [{productId, quantity}] }` to `/api/orders`; disabled when `lines.length === 0` or in flight; shows `Spinner` while in flight
    - On success: toast `"Naitala na!"`, call `useCart().clear()`
    - Renders `EmptyState` with `empty_cart` copy when cart is empty
    - _Requirements: 3.3, 3.4, 3.8, 3.9, 3.10, 17.1, 17.3, 17.4_
    - _Design: §Cart State Design, §UI Component Inventory_

  - [x] 4.10 Implement `POST /api/orders` route handler with transactional Order + JournalEntry pairing
    - Parse and validate body with `CreateOrderInput`
    - Look up Products by id; return 404 `{ error: 'Product not found', productId }` if any missing
    - Compute `totalPhp` server-side from looked-up `pricePhp × quantity`
    - In a single `prisma.$transaction`: create `Order { status: 'PLACED', totalPhp }`, create `OrderItem` per line with `unitPriceSnapshot = product.pricePhp`, create `JournalEntry { type: 'EXPENSE', category: 'Supplies', amountPhp: totalPhp, date: order.createdAt, sourceOrderId: order.id, note: 'Order ${order.id}' }`
    - Return `{ orderId, totalPhp, journalEntryId }`
    - Map zod errors → 400; db failures → 500
    - _Requirements: 3.4, 3.5, 3.6, 3.7_
    - _Design: §POST /api/orders, §Error Handling Matrix_

- [x] 5. Tier 1 — Accounting: Finance list, KPIs, 7-day chart, manual entry
  - [x] 5.1 Add `CreateJournalInput` zod schema to `lib/schemas.ts`
    - Append `CreateJournalInput = z.object({ date: z.coerce.date(), type: z.enum(['REVENUE','EXPENSE']), category: z.string().min(1), amountPhp: z.number().positive(), note: z.string().optional() })`
    - _Requirements: 4.4, 4.5, 4.6_
    - _Design: §POST /api/journal (Input zod)_

  - [x] 5.2 Implement `lib/finance.ts` helpers
    - `getJournalEntries()` returning `JournalEntry[]` ordered by `date` desc (Req 4.1)
    - `getTodayKpis()` returning `{ salesPhp, expensesPhp, netPhp, topProduct }` per Req 5.1–5.4 and 5.6 (placeholder string when no items)
    - `getLast7DaysChartData()` returning length-7 array `{ dayLabel: 'Mon'|...|'Sun', revenue, expense }` for the 7 most recent calendar days ending today (Req 5.5)
    - Use `date-fns` `startOfDay`, `endOfDay`, `subDays`, `format(d, 'EEE')`
    - _Requirements: 4.1, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
    - _Design: §Finance Computations_

  - [x] 5.3 Build `KpiCard` component
    - Props: `label: string`, `value: string` (already `formatPhp`-ed by caller) or `valuePhp: number`
    - Used on `/finance` and `/` (Dashboard_Tab)
    - _Requirements: 5.1, 5.7, 9.2, 16.1_
    - _Design: §UI Component Inventory_

  - [x] 5.4 Build `JournalRow` component
    - Renders date · type pill (REVENUE/EXPENSE) · category · `formatPhp(amountPhp)` · note
    - _Requirements: 4.2, 16.1_
    - _Design: §UI Component Inventory_

  - [x] 5.5 Build `BarChart7d` recharts wrapper
    - Renders a recharts `BarChart` with two `Bar` series (`revenue`, `expense`)
    - X-axis labels: day-of-week (Mon, Tue, Wed, Thu, Fri, Sat, Sun); Y-axis: peso amounts
    - Props: `data: { dayLabel, revenue, expense }[]`
    - _Requirements: 5.5_
    - _Design: §UI Component Inventory, §Finance Computations_

  - [x] 5.6 Build `/finance` page
    - RSC reads via `getTodayKpis`, `getLast7DaysChartData`, `getJournalEntries`
    - Renders summary card (4 `KpiCard`s: today sales, today expenses, today net, top product), `BarChart7d`, then a list of `JournalRow`
    - Renders `EmptyState` with `empty_journal` copy when no entries
    - _Requirements: 4.1, 4.2, 4.8, 5.1, 5.5, 5.6, 5.7, 17.1_
    - _Design: §Routing Map, §UI Component Inventory_

  - [x] 5.7 Build `/finance/new` manual entry form
    - Client form with fields: date (default today), type (REVENUE/EXPENSE radio), category (text), amountPhp (number), note (textarea)
    - Submits to `POST /api/journal`; on success: `toast.success(t('entry_success_toast'))` (Tagalog: "Tapos na!"), navigate to `/finance`
    - Inline field error mapping for 400 responses (zod issue paths) — covers non-positive amount and missing required fields
    - Accept optional `?type=REVENUE` query param to preselect type (used by Dashboard_Tab Log Sale quick action — see 9.2)
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.7, 9.6, 17.4_
    - _Design: §Routing Map, §POST /api/journal_

  - [x] 5.8 Implement `POST /api/journal` route handler
    - Parse and validate body with `CreateJournalInput`
    - Create `JournalEntry { ...input, sourceOrderId: null }`
    - Return `{ id }`; map zod errors → 400 with issues; db failures → 500
    - _Requirements: 4.4, 4.5, 4.6, 8.4_
    - _Design: §POST /api/journal, §Error Handling Matrix_

- [ ] 6. Checkpoint — Logistics + Accounting end-to-end
  - Ensure all tests pass, ask the user if questions arise. Verify: market browsing, cart math, checkout produces paired `Order` + `JournalEntry { type: 'EXPENSE', category: 'Supplies' }`, manual journal entry rejects non-positive amounts.

- [ ] 7. Tier 1 — OCR: Scan UI, /api/scan, Marketplace_Matcher, Match/Log routing
  - [x] 7.1 Add `OcrItem` and `OcrResult` zod schemas to `lib/schemas.ts`
    - `OcrItem = z.object({ name: z.string(), quantity: z.number(), unit: z.enum(['kg','pc','L','pack','bundle']), note: z.string().optional(), translated: z.string().optional() })`
    - `OcrResult = z.object({ items: z.array(OcrItem) })`
    - _Requirements: 7.5, 7.6_
    - _Design: §Scan_API Detailed Design_

  - [x] 7.2 Implement `lib/openai.ts` client factory
    - Export `getOpenAI()` that lazily constructs `new OpenAI({ apiKey: process.env.OPENAI_API_KEY })`
    - Throw a typed error if `OPENAI_API_KEY` is missing (consumed by `/api/scan` to return 500)
    - _Requirements: 7.4, 7.8_
    - _Design: §Scan_API Detailed Design_

  - [x] 7.3 Implement `POST /api/scan` route handler
    - Read multipart form via `req.formData()`; reject 400 `{error}` if `image` field is missing
    - Return 500 `{error}` if `OPENAI_API_KEY` is unset
    - Convert image to base64 data URL `data:${mime};base64,...`
    - Call OpenAI `chat.completions.create` with `model: 'gpt-4o'`, `response_format: { type: 'json_object' }`, system message **verbatim** from Req 7.3, user message containing the data URL
    - Parse JSON; safe-parse with `OcrResult`; on parse failure or zod failure return 200 `{ items: [] }`
    - Return 200 with parsed `OcrResult` on success
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.10_
    - _Design: §Scan_API Detailed Design, §Error Handling Matrix_

  - [x] 7.4 Implement `lib/matcher.ts` Marketplace_Matcher
    - Export `buildFuseIndex(products: Product[])` that returns `new Fuse(products, { keys: ['name'], threshold: 0.4, includeScore: true })`
    - Export `matchOcrItems(fuse, items)` returning `{ matched: MatchedLine[], unmatched: UnmatchedLine[] }`
    - For each item, query `fuse.search(item.translated ?? item.name)`; first hit becomes a matched line with `quantity = max(0.01, item.quantity)` and `confidence = 1 - (hit.score ?? 0)`; misses go to `unmatched`
    - _Requirements: 8.1, 8.3_
    - _Design: §Marketplace_Matcher Design_

  - [x] 7.5 Build `Spinner` component
    - Centered SVG/CSS spinner with optional label
    - Used by Scan, Cart, Finance forms
    - _Requirements: 17.2, 17.3_
    - _Design: §UI Component Inventory_

  - [ ] 7.6 Build `EditableItemList` component (under `app/scan/components/`)
    - Renders editable rows per OCR item: name (text), quantity (number, ≥ 0.01), unit (select), note (text)
    - Props: `items, onChange(items)`
    - _Requirements: 6.4, 6.5_
    - _Design: §Directory Layout_

  - [ ] 7.7 Build `/scan` page UI: camera capture + file upload + result list shell + action buttons
    - Camera capture control (`<input type="file" accept="image/*" capture="environment">`) and file upload control (`<input type="file" accept="image/*">`); both produce a `File`
    - On submit: `FormData` with `image` field, POST to `/api/scan`; show `Spinner` while in flight; disable controls
    - On success: render `EditableItemList` with returned items; if `items.length === 0`, render `EmptyState` with friendly Filipino copy + "Retake" CTA
    - On HTTP error: error toast, re-enable controls
    - Render two action buttons: "I-match sa Market" and "I-log bilang gastos" (handlers wired in 7.8 and 7.9)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 17.1, 17.2_
    - _Design: §Routing Map, §UI Component Inventory_

  - [ ] 7.8 Wire "Match to Marketplace" flow on `/scan` page
    - Fetch product list once on mount (RSC-loaded prop or client fetch); build Fuse index via `buildFuseIndex`
    - On "I-match sa Market" tap: run `matchOcrItems(fuse, items)`, call `useCart().prefillFromScan(matched, unmatched)`, navigate to `/market/cart`
    - Each matched cart line carries `productId`, `name`, `unit`, `pricePhp`, `imageUrl`, `quantity = max(0.01, item.quantity)`
    - _Requirements: 8.1, 8.2, 8.3_
    - _Design: §Marketplace_Matcher Design, §Cart State Design_

  - [ ] 7.9 Wire "Log as Expense" flow on `/scan` page
    - Show a small dialog/inline field for user to enter total `amountPhp` (must be > 0)
    - On submit: POST to `/api/journal` with `{ date: now, type: 'EXPENSE', category: 'Palengke', amountPhp, note: <summary of scanned items>, sourceOrderId: null }` (sourceOrderId is implicit null per `POST /api/journal` design)
    - On success: `toast.success(t('entry_success_toast'))` (Tagalog: "Tapos na!"), navigate to `/finance`
    - _Requirements: 8.4, 8.5, 17.4_
    - _Design: §Routing Map, §POST /api/journal_

  - [ ] 7.10 Write the single `/api/scan` smoke test
    - Create `tests/scan.smoke.test.ts` and `tests/fixtures/palengke-list.jpg`
    - Configure `vitest.config.ts` with `environment: 'node'`
    - Mock the OpenAI client at the module boundary with `vi.mock('@/lib/openai', ...)` (or whichever module path the route imports `getOpenAI` from) so that `getOpenAI()` returns a stub whose `chat.completions.create` resolves to a completion whose `choices[0].message.content` is the canned JSON string `'{"items":[{"name":"pork","quantity":1,"unit":"kg"}]}'`
    - In the test's setup, set `process.env.OPENAI_API_KEY = 'test'` so the route's env-check guard passes — the test MUST NOT require `OPENAI_API_KEY` to be set in the developer or CI environment in order to pass, and MUST make no real network call to OpenAI
    - Test: build a `Request` with multipart `FormData` containing `image`, call the route's `POST` directly, assert status 200, assert the response body parses successfully with the `OcrResult` zod schema, and assert the mocked `chat.completions.create` was invoked
    - This is the ONLY automated test in the codebase per Req 18.3 — do not add other tests (unit, integration, property)
    - _Requirements: 18.1, 18.2, 18.3_
    - _Design: §Smoke Test Design_

- [ ] 8. Checkpoint — Tier 1 complete and end-to-end
  - Ensure all tests pass, ask the user if questions arise. Verify: market → cart → checkout → finance auto-journal; manual entry; scan → OCR → match → cart prefill; scan → log as expense → finance.

- [ ] 9. Tier 2 — Dashboard (Home tab)
  - [x] 9.1 Implement `lib/greeting.ts`
    - `pickGreetingKey(date = new Date())` returning `'greeting_morning'` for hour ∈ [4,11], `'greeting_afternoon'` for [12,17], `'greeting_evening'` otherwise
    - _Requirements: 9.1_
    - _Design: §Architecture (lib/greeting.ts)_

  - [ ] 9.2 Build `/` (Home) Dashboard_Tab page
    - RSC reads `getTodayKpis()` and uses `pickGreetingKey()`
    - Render the greeting using a small **hardcoded Tagalog map keyed off the result of `pickGreetingKey()`** — i.e., `{ greeting_morning: 'Magandang umaga!', greeting_afternoon: 'Magandang hapon!', greeting_evening: 'Magandang gabi!' }[pickGreetingKey()]` — so this task does NOT depend on `LanguageProvider` or `useT` being wired
    - Add a `// TODO` comment beside the greeting noting that it should be refactored to `useT(pickGreetingKey())` in the polish phase (after task 15.2 ships `LanguageProvider`/`useT`)
    - Render 3 `KpiCard`s (today sales, today expenses, today net) + 3 quick-action buttons: Scan → `/scan`, Order → `/market`, Log Sale → `/finance/new?type=REVENUE`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
    - _Design: §Routing Map, §UI Component Inventory_

- [ ] 10. Tier 2 — Customer Browse
  - [ ] 10.1 Build `/customers` page (2-col grid of 4 Carinderia cards)
    - RSC reads Carinderias; render exactly the 4 seeded records as a 2-col grid of cards showing name, distanceKm, topDish, rating, priceRange
    - _Requirements: 10.1, 10.2_
    - _Design: §Routing Map_

  - [ ] 10.2 Build `/customers/[id]` detail page
    - RSC reads Carinderia by id including `menuItems`
    - Render full details + list of MenuItems with name and `formatPhp(pricePhp)`
    - Render a "Coming soon: delivery" badge
    - Do NOT expose any ordering controls
    - _Requirements: 10.3, 10.4, 10.5, 16.1, 19.3_
    - _Design: §Routing Map_

- [ ] 11. Checkpoint — Tier 2 complete
  - Ensure all tests pass, ask the user if questions arise. Tier 2 must be functional before any Tier 3 work begins (Req 20.4).

- [ ] 12. Tier 3 — Insights (mocked predictions)
  - [ ] 12.1 Build `/insights` page
    - Display hardcoded weather string `"Rainy, 26°C"`
    - Display current day-of-week derived from device local time
    - Display hardcoded recommendation card: `"Suggested menu today: sinigang, lugaw, mami. Expected foot traffic: -20% due to rain"`
    - Do NOT call any ML or external prediction service
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
    - _Design: §Routing Map_

- [ ] 13. Tier 3 — Tray Tally (mocked demo)
  - [x] 13.1 Add `public/tray-demo.jpg` placeholder asset
    - Place a single sample tray photograph at `public/tray-demo.jpg`
    - _Requirements: 12.1_
    - _Design: §Directory Layout_

  - [ ] 13.2 Build `/tray-tally` page
    - Render the preloaded `tray-demo.jpg` photograph
    - "Tally" button — on tap, reveal hardcoded receipt: `"adobo ₱40.00 + rice ₱15.00 = ₱55.00"` using `formatPhp` for the totals
    - Render a "Beta" label visible without scrolling
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 16.1_
    - _Design: §Routing Map_

- [ ] 14. Checkpoint — Tier 3 complete
  - Ensure all tests pass, ask the user if questions arise. Tier 3 must be functional before final polish (Req 20.5).

- [ ] 15. Polish — Strings, Language, Shell, PWA, EmptyState/peso audits
  - [ ] 15.1 Implement `lib/strings.ts`
    - Export `STRINGS = { en: {...}, tl: {...} }` with the full English set covering tab labels, headings, form labels, CTAs
    - Include the **11 verbatim Tagalog keys** from Req 21:
      - `order_success_toast`: "Naitala na!"
      - `entry_success_toast`: "Tapos na!"
      - `empty_cart`: "Wala pang laman ang basket mo. Mag-add ka na!"
      - `empty_journal`: "Wala pang record. Mag-scan o mag-log ka na!"
      - `greeting_morning`: "Magandang umaga!"
      - `greeting_afternoon`: "Magandang hapon!"
      - `greeting_evening`: "Magandang gabi!"
      - `cta_checkout`: "Bayaran na"
      - `cta_scan`: "I-scan ang listahan"
      - `cta_match`: "I-match sa Market"
      - `cta_log_expense`: "I-log bilang gastos"
    - Export `Lang` and `StringKey` types
    - _Requirements: 13.3, 21.1, 19.4_
    - _Design: §Strings System_

  - [ ] 15.2 Implement `lib/language-context.tsx`
    - `LanguageProvider` defaults to `'en'` (Req 13.4); on mount, hydrate from `localStorage['carinderai.lang']`
    - `setLang(l)` updates state and writes `localStorage['carinderai.lang']`
    - `useT()` hook returns a function `(key: StringKey) => STRINGS[lang][key] ?? STRINGS.en[key]` (Req 13.3 fallback)
    - Export `useLang()`
    - _Requirements: 13.2, 13.3, 13.4, 13.5_
    - _Design: §Strings System_

  - [ ] 15.3 Build `/settings` page (Settings_Module language toggle)
    - Renders a segmented toggle with options "English" and "Tagalog"
    - Selecting an option calls `setLang('en' | 'tl')`; visible text re-renders via `useT`
    - _Requirements: 13.1, 13.2_
    - _Design: §Routing Map_

  - [ ] 15.4 Build `PhoneFrame` component
    - Wraps children in a `max-w-[480px]` container, centered horizontally
    - Above 480px viewport width, applies a rounded border + shadow that visually frames the phone
    - _Requirements: 1.1, 1.2_
    - _Design: §UI Component Inventory_

  - [ ] 15.5 Build `SplashScreen` component
    - Cream background + CarinderAI logo
    - Conditionally rendered inside the root layout based on a `sessionStorage` flag `'carinderai.splashShown'`; on first render in a session, show the splash for ~1.2s, set the flag, and hide
    - No `/splash` route — this is purely an in-layout overlay
    - _Requirements: 1.8_
    - _Design: §UI Component Inventory_

  - [ ] 15.6 Build `MoreSheet` component
    - Bottom sheet listing entries: Customer Browse → `/customers`, Insights → `/insights`, Tray Tally → `/tray-tally`, Settings → `/settings`
    - Props: `open: boolean`, `onClose()`
    - No `/more` route — sheet visibility controlled by parent
    - _Requirements: 1.5_
    - _Design: §UI Component Inventory, §Routing Map_

  - [ ] 15.7 Build `BottomNav` component
    - CSS Grid with 5 cells: Home, Market, Scan, Finance, More
    - Middle cell hosts a raised circular button: 64px diameter, `position: absolute; bottom: 12px; border-radius: 9999px; background: #F58220; box-shadow: 0 8px 24px rgba(0,0,0,0.25)` (Tailwind `bg-primary shadow-scan`)
    - "More" tab toggles `MoreSheet` visibility via local React `useState` (no navigation, no `/more` route)
    - Each tab navigates within 300ms of tap
    - _Requirements: 1.3, 1.4, 1.5, 1.6_
    - _Design: §UI Component Inventory, §Routing Map_

  - [ ] 15.8 Build `Toaster` wrapper and wire success toasts
    - `components/Toaster.tsx` wraps `react-hot-toast`'s `<Toaster>` with brand-tinted styling (cream background, primary accent)
    - Wire `toast.success(t('order_success_toast'))` (Tagalog: "Naitala na!") on Order checkout success in `/market/cart` (POST /api/orders)
    - Wire `toast.success(t('entry_success_toast'))` (Tagalog: "Tapos na!") on every JournalEntry creation — both the manual entry form (`/finance/new`, task 5.7) and the "Log as Expense" flow (`/scan`, task 7.9)
    - _Requirements: 3.8, 4.7, 8.5, 17.4, 17.5, 21.1_
    - _Design: §UI Component Inventory_

  - [ ] 15.9 Update root `app/layout.tsx` to compose the shell
    - Wrap with `LanguageProvider`
    - Render `PhoneFrame` containing: conditional `SplashScreen`, `{children}`, `BottomNav`
    - Render `Toaster` at the root
    - Apply cream background (`bg-cream`) at body level; use Inter font
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 1.8, 13.2, 17.4, 17.5_
    - _Design: §Directory Layout, §UI Component Inventory_

  - [ ] 15.10 Audit peso formatting across all surfaces
    - Grep the codebase for any peso glyph or numeric currency rendering not routed through `formatPhp`
    - Update any offending sites in Market, Finance, Scan, Dashboard, Customer Browse, Tray Tally to call `formatPhp(amount)`
    - _Requirements: 16.1, 16.2_
    - _Design: §Styling System (currency)_

  - [ ] 15.11 Audit empty states across all list views
    - Confirm `/market` (filtered list), `/market/cart`, `/finance`, `/scan` (zero-item OCR result), `/customers/[id]` (menu list) each render `EmptyState` with the corresponding Tagalog string when their list is empty
    - Wire the appropriate `STRINGS.tl` key (`empty_cart`, `empty_journal`, etc.) via `useT`
    - _Requirements: 2.6, 4.8, 6.7, 17.1, 21.1_
    - _Design: §UI Component Inventory, §Error Handling Matrix_

  - [ ] 15.12 Create `.env.example`
    - Add a `.env.example` file at the repo root documenting `OPENAI_API_KEY=` (per Req 7.9) and `DATABASE_URL=file:./dev.db`
    - Skip PWA manifest, app icons, and the layout `<head>` link — out of scope for this build
    - _Requirements: 7.9_
    - _Design: §Directory Layout_

- [ ] 16. Final checkpoint — full app verified
  - Ensure all tests pass, ask the user if questions arise. Verify the smoke test runs green and that the seeded app surfaces in tier order are non-empty: dashboard KPIs, market grid, finance list+chart, scan flow round-trip, customer browse cards, insights, tray tally, settings language toggle persistence.

## Notes

- This project ships exactly **one** automated test (the `/api/scan` smoke test, task 7.10) per Req 18.3. No unit, integration, or property-based tests are added — the design's Correctness Properties are documented as future scope only.
- Currency rendering is funneled through `formatPhp` everywhere (Req 16.2); the audit in 15.10 enforces that.
- Cart `quantity` is a positive float ≥ 0.01 throughout: `OrderItem.quantity` is `Float` in Prisma, `CreateOrderInput.lines[].quantity` uses `z.number().positive().min(0.01)`, and `setQuantity` clamps to `Math.max(0.01, q)`.
- Auto-journaling is a hard invariant: `POST /api/orders` writes the `Order`, `OrderItem`s, and the paired `JournalEntry { type: 'EXPENSE', category: 'Supplies', sourceOrderId }` inside a single `prisma.$transaction` (Req 3.7).
- Tier ordering is enforced by checkpoint tasks 6, 8, 11, 14: Tier 1 must be functional end-to-end before Tier 2 begins; Tier 2 before Tier 3; Tier 3 before final polish (Req 20.3–20.5).
- `Strings_File` ships the full English set plus the 11 verbatim Tagalog keys from Req 21; the language toggle persists under `localStorage['carinderai.lang']`.
- `SplashScreen` is rendered conditionally inside the root layout via a `sessionStorage` flag — there is no `/splash` route. The "More" tab in `BottomNav` toggles `MoreSheet` via local `useState` — there is no `/more` route.
- Non-goals (Req 19) are upheld: no auth, no real payments, no real delivery, no i18n library, no production deployment configuration.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["2.1"] },
    { "id": 4, "tasks": ["2.2"] },
    { "id": 5, "tasks": ["4.1", "4.6", "7.2", "7.5", "9.1", "13.1"] },
    { "id": 6, "tasks": ["4.2", "4.3", "4.4", "4.5", "4.8", "5.3", "5.4", "5.5"] },
    { "id": 7, "tasks": ["4.7", "4.10", "5.1", "5.2"] },
    { "id": 8, "tasks": ["4.9", "5.6", "5.7", "5.8", "7.1"] },
    { "id": 9, "tasks": ["7.3", "7.4", "7.6"] },
    { "id": 10, "tasks": ["7.7"] },
    { "id": 11, "tasks": ["7.8"] },
    { "id": 12, "tasks": ["7.9"] },
    { "id": 13, "tasks": ["7.10"] },
    { "id": 14, "tasks": ["9.2", "10.1", "10.2"] },
    { "id": 15, "tasks": ["12.1", "13.2"] },
    { "id": 16, "tasks": ["15.1", "15.4", "15.5", "15.6", "15.8", "15.12"] },
    { "id": 17, "tasks": ["15.2", "15.7"] },
    { "id": 18, "tasks": ["15.3", "15.9"] },
    { "id": 19, "tasks": ["15.10"] },
    { "id": 20, "tasks": ["15.11"] }
  ]
}
```
