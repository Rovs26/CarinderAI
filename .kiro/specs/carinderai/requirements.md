# Requirements Document

## Introduction

CarinderAI is a mobile-first Progressive Web App (PWA) for Filipino carinderia (turo-turo eatery) owners. It is a camera-first operations app organized around three pillars: (1) Logistics — ordering supplies from a B2B marketplace; (2) Accounting — auto-journaling of sales and expenses; (3) OCR — converting handwritten palengke (market) lists into structured orders via vision AI.

The application is delivered as a Next.js 14 (App Router) PWA written in TypeScript, styled with Tailwind, persisted with Prisma + SQLite, and using OpenAI GPT-4o vision for OCR. The UI is a phone-shaped, max-width 480px frame with a bottom navigation of 5 visible tabs (Home, Market, Scan, Finance, More) and a "More" sheet exposing three additional tabs (Customer Browse, Insights, Tray Tally) plus Settings.

Features are tiered by completeness:
- Tier 1 (fully functional, end-to-end): Logistics/Market, Finance/Journal, Scan (OCR).
- Tier 2 (real UI with seeded data, no live transactions): Dashboard (home tab), Customer Browse.
- Tier 3 (mocked, demo-only): Insights (Predictions), Tray Tally.

Out of scope: authentication/login, real payment integration, real delivery tracking, i18n libraries, tests beyond a single smoke test of `/api/scan`, and production deployment configuration.

## Glossary

- **CarinderAI_App**: The Next.js PWA front-end and its API routes; the overall product.
- **Market_Module**: The Tier 1 logistics surface where owners browse Suppliers, view Products, manage a Cart, and check out.
- **Cart**: A client-side collection of Products with quantities awaiting checkout.
- **Order**: A persisted purchase of one or more Products with a status, total in PHP, and OrderItems.
- **OrderItem**: A line on an Order capturing the Product, quantity, and snapshot unit price at time of purchase.
- **Finance_Module**: The Tier 1 accounting surface that lists JournalEntries, supports manual entry, and renders a dashboard summary and 7-day chart.
- **JournalEntry**: A persisted financial record with date, type (REVENUE or EXPENSE), category, amount in PHP, optional note, and optional source Order reference.
- **Scan_Module**: The Tier 1 OCR surface that captures or uploads a photo, calls `/api/scan`, displays an editable item list, and routes to either Market matching or expense logging.
- **Scan_API**: The server route at `/api/scan` that accepts an image and returns extracted items as strict JSON.
- **OCR_Result**: The JSON object `{items: [{name, quantity, unit, note?, translated?}]}` returned by Scan_API.
- **Marketplace_Matcher**: The fuzzy-matching component that maps OCR_Result items to seeded Products.
- **Dashboard_Tab**: The Tier 2 home tab with greeting, today's KPIs, and quick actions.
- **Customer_Browse**: The Tier 2 surface showing a static grid of seeded Carinderia cards and a detail page with MenuItems.
- **Carinderia**: A seeded eatery record displayed on Customer_Browse (name, address, distanceKm, rating, priceRange, topDish, imageUrl).
- **MenuItem**: A seeded menu line for a Carinderia (name, pricePhp).
- **Insights_Module**: The Tier 3 mocked screen displaying a hardcoded weather + day-of-week recommendation.
- **Tray_Tally**: The Tier 3 demo screen with one preloaded tray photo and a hardcoded receipt total.
- **Bottom_Nav**: The persistent bottom navigation bar with 5 visible tabs and a centered Scan button.
- **More_Sheet**: A sheet/panel opened from the More tab exposing Customer_Browse, Insights_Module, Tray_Tally, and Settings.
- **Settings_Module**: The settings surface with a language toggle wired to a `strings.ts` file.
- **Strings_File**: The `strings.ts` module containing UI string keys with English values and a stub Tagalog set.
- **Phone_Frame**: The desktop-only visual treatment that centers the app within a 480px-max phone-shaped border.
- **PHP**: Philippine peso currency, formatted as `₱X,XXX.XX`.
- **Supplier**: A seeded vendor record with id, name, logoUrl, and category.
- **Product**: A seeded sellable item with id, supplierId, name, category, unit (kg/pc/L/pack), pricePhp, stock, imageUrl.

## Requirements

### Requirement 1: Application Shell, Navigation, and Phone Frame

**User Story:** As a carinderia owner, I want a consistent mobile-shaped app shell with a clear bottom navigation, so that I can move between operational areas with one thumb.

#### Acceptance Criteria

1. THE CarinderAI_App SHALL render its content within a container of maximum width 480 pixels, centered horizontally on viewports wider than 480 pixels.
2. WHERE the viewport width exceeds 480 pixels, THE CarinderAI_App SHALL display the Phone_Frame visual border around the centered content.
3. THE CarinderAI_App SHALL render the Bottom_Nav with exactly 5 visible tabs in this order: Home, Market, Scan, Finance, More.
4. THE Bottom_Nav SHALL render the Scan tab as a centered circular button approximately 64px diameter, raised above the nav bar with a drop shadow.
5. WHEN a user taps the More tab, THE CarinderAI_App SHALL open the More_Sheet exposing entries for Customer_Browse, Insights_Module, Tray_Tally, and Settings_Module.
6. WHEN a user taps any Bottom_Nav tab, THE CarinderAI_App SHALL navigate to the corresponding route within 300 milliseconds of the tap event.
7. THE CarinderAI_App SHALL apply the orange/white palette using primary color `#F58220` and cream background `#FFF4E6`.
8. THE CarinderAI_App SHALL display a splash screen containing the CarinderAI logo on initial application load.

### Requirement 2: Tier 1 — Market (Logistics) Browsing

**User Story:** As a carinderia owner, I want to browse suppliers and products by category, so that I can find supplies I need to restock.

#### Acceptance Criteria

1. THE Market_Module SHALL list all seeded Suppliers with name, logoUrl, and category.
2. THE Market_Module SHALL group Products under the categories Meat, Fish, Vegetables, Condiments, and Rice/Grains.
3. WHEN a user selects a category, THE Market_Module SHALL display only Products whose `category` field matches the selected category.
4. THE Market_Module SHALL display each Product with its name, unit, pricePhp formatted as `₱X,XXX.XX`, stock, and imageUrl.
5. WHEN a user selects a Supplier, THE Market_Module SHALL display only Products whose `supplierId` matches that Supplier.
6. IF no Products match a selected filter, THEN THE Market_Module SHALL display an empty-state message with friendly Filipino copy.
7. THE Market_Module SHALL render a horizontal scrolling chip row of category filters with chips for 'All', 'Meat', 'Fish', 'Vegetables', 'Condiments', and 'Rice/Grains'.

### Requirement 3: Tier 1 — Cart and Checkout

**User Story:** As a carinderia owner, I want to add products to a cart and check out, so that I can record a supply purchase in one flow.

#### Acceptance Criteria

1. WHEN a user taps "Add to cart" on a Product, THE Market_Module SHALL add the Product to the Cart with a default quantity of 1.
2. WHEN a user adjusts a Cart line quantity, THE Market_Module SHALL update the Cart line's quantity to the entered integer value of 1 or greater.
3. THE Market_Module SHALL compute the Cart total as the sum of `pricePhp × quantity` across all Cart lines, formatted as `₱X,XXX.XX`.
4. WHEN a user taps "Checkout" with a non-empty Cart, THE Market_Module SHALL submit the Cart to the server.
5. WHEN a Cart is submitted, THE CarinderAI_App SHALL persist a new Order with `status = 'PLACED'`, `createdAt = current timestamp`, and `totalPhp` equal to the computed Cart total.
6. WHEN a Cart is submitted, THE CarinderAI_App SHALL persist one OrderItem per Cart line, each storing `productId`, `quantity`, and `unitPriceSnapshot` equal to the Product's `pricePhp` at submission time.
7. WHEN an Order is persisted, THE CarinderAI_App SHALL persist a JournalEntry with `type = 'EXPENSE'`, `amountPhp = Order.totalPhp`, `date = Order.createdAt`, `sourceOrderId = Order.id`, and `category = 'Supplies'`.
8. WHEN checkout completes successfully, THE CarinderAI_App SHALL display a toast with the message "Naitala na!" and clear the Cart.
9. WHILE a checkout request is in flight, THE Market_Module SHALL display a loading spinner and disable the Checkout button.
10. IF the Cart is empty, THEN THE Market_Module SHALL disable the Checkout button.

### Requirement 4: Tier 1 — Finance Journal List and Manual Entry

**User Story:** As a carinderia owner, I want to view all my income and expenses in one place and add entries manually, so that I have a complete daily ledger.

#### Acceptance Criteria

1. THE Finance_Module SHALL list all JournalEntries sorted by `date` descending.
2. THE Finance_Module SHALL display each JournalEntry with its date, type, category, amountPhp formatted as `₱X,XXX.XX`, and note.
3. THE Finance_Module SHALL provide a manual entry form with fields for date, type (REVENUE or EXPENSE), category, amountPhp, and note.
4. WHEN a user submits the manual entry form with all required fields populated, THE Finance_Module SHALL persist a new JournalEntry with the submitted values and `sourceOrderId = null`.
5. IF the manual entry form is submitted with `amountPhp` less than or equal to zero, THEN THE Finance_Module SHALL reject the submission and display an inline validation error.
6. IF the manual entry form is submitted with a missing required field, THEN THE Finance_Module SHALL reject the submission and display an inline validation error identifying the missing field.
7. WHEN a manual JournalEntry is persisted successfully, THE CarinderAI_App SHALL display a toast with the message "Naitala na!".
8. IF no JournalEntries exist, THEN THE Finance_Module SHALL display an empty-state message with friendly Filipino copy.

### Requirement 5: Tier 1 — Finance Dashboard Summary and 7-Day Chart

**User Story:** As a carinderia owner, I want a quick summary of today's numbers and a week-at-a-glance chart, so that I can see how the business is doing without reading the full ledger.

#### Acceptance Criteria

1. THE Finance_Module SHALL display a summary card containing today's total sales, today's total expenses, today's net (sales minus expenses), and the top product.
2. THE Finance_Module SHALL compute today's total sales as the sum of `amountPhp` for all JournalEntries where `type = 'REVENUE'` and `date` falls within the current calendar day in the device's local time zone.
3. THE Finance_Module SHALL compute today's total expenses as the sum of `amountPhp` for all JournalEntries where `type = 'EXPENSE'` and `date` falls within the current calendar day in the device's local time zone.
4. THE Finance_Module SHALL determine the top product as the Product with the highest total quantity across OrderItems whose parent Order's `createdAt` falls within the current calendar day.
5. THE Finance_Module SHALL render a bar chart using recharts displaying daily totals for REVENUE and EXPENSE for the most recent 7 calendar days including today, with day-of-week labels (Mon, Tue, Wed, Thu, Fri, Sat, Sun) on the x-axis and peso amounts on the y-axis.
6. IF no JournalEntries exist for the current day, THEN THE Finance_Module SHALL display today's sales, expenses, and net as `₱0.00` and the top product as a friendly placeholder string.
7. THE summary card SHALL format all currency values as `₱X,XXX.XX`.

### Requirement 6: Tier 1 — Scan UI (Camera and Upload)

**User Story:** As a carinderia owner, I want to snap or upload a photo of my handwritten palengke list, so that I can quickly turn it into something actionable.

#### Acceptance Criteria

1. THE Scan_Module SHALL provide a camera capture control and a file upload control, both of which produce an image file.
2. WHEN a user submits an image via either control, THE Scan_Module SHALL POST the image to Scan_API as `multipart/form-data` with field name `image`.
3. WHILE Scan_API is processing, THE Scan_Module SHALL display a loading spinner and disable the submission controls.
4. WHEN Scan_API responds successfully, THE Scan_Module SHALL render the OCR_Result `items` as an editable list with fields name, quantity, unit, and note.
5. WHEN a user edits any field on the editable list, THE Scan_Module SHALL update the in-memory list state to reflect the edit.
6. THE Scan_Module SHALL display two action buttons after a successful scan: "Match to Marketplace" and "Log as Expense".
7. IF Scan_API returns `{items: []}`, THEN THE Scan_Module SHALL display a friendly Filipino empty-state message and offer the user the option to retake the photo.
8. IF Scan_API returns an HTTP error, THEN THE Scan_Module SHALL display an error toast and re-enable the submission controls.

### Requirement 7: Tier 1 — Scan API Contract

**User Story:** As a developer integrating with CarinderAI, I want a strict, predictable Scan_API contract, so that the client and the model exchange data reliably.

#### Acceptance Criteria

1. THE Scan_API SHALL accept HTTP POST requests at the path `/api/scan` with a `multipart/form-data` body containing a field named `image`.
2. WHEN Scan_API receives a request, THE Scan_API SHALL convert the uploaded image to a base64-encoded string before forwarding it to the OpenAI GPT-4o vision endpoint.
3. THE Scan_API SHALL send the following system message to OpenAI GPT-4o vision: "You are an OCR assistant for a Filipino carinderia palengke list. Extract items, quantities, and units. Return ONLY valid JSON matching: {items: [{name: string, quantity: number, unit: 'kg'|'pc'|'L'|'pack'|'bundle', note?: string}]}. Translate Tagalog item names to English in a 'translated' field. If unreadable, return {items: []}."
4. THE Scan_API SHALL read the OpenAI API key from the environment variable `OPENAI_API_KEY`.
5. THE Scan_API SHALL respond with HTTP 200 and a JSON body conforming to the schema `{items: [{name: string, quantity: number, unit: 'kg'|'pc'|'L'|'pack'|'bundle', note?: string, translated?: string}]}`.
6. IF the image cannot be read or the model returns unparseable output, THEN THE Scan_API SHALL respond with HTTP 200 and a body of `{items: []}`.
7. IF the request body is missing the `image` field, THEN THE Scan_API SHALL respond with HTTP 400 and a JSON body containing an `error` field describing the missing input.
8. IF the environment variable `OPENAI_API_KEY` is not set, THEN THE Scan_API SHALL respond with HTTP 500 and a JSON body containing an `error` field indicating server misconfiguration.
9. THE CarinderAI_App SHALL include a `.env.example` file documenting the `OPENAI_API_KEY` variable.
10. THE Scan_API SHALL invoke OpenAI with `response_format` set to `{ type: 'json_object' }` to force JSON-only output.

### Requirement 8: Tier 1 — Match to Marketplace and Log as Expense Routing

**User Story:** As a carinderia owner, I want my scanned list to either become a prefilled cart or an expense entry, so that one photo turns into one decisive action.

#### Acceptance Criteria

1. WHEN a user taps "Match to Marketplace" after a successful scan, THE Marketplace_Matcher SHALL fuzzy-match each OCR_Result item to a seeded Product using Fuse.js with a threshold of 0.4, searching against the Product 'name' field.
2. WHEN matching completes, THE Scan_Module SHALL navigate to the Cart with each matched Product added at the OCR_Result item's quantity.
3. IF an OCR_Result item cannot be matched to any Product, THEN THE Scan_Module SHALL display the unmatched item in the Cart screen as an "unmatched" line with a friendly indicator and exclude it from the Cart total.
4. WHEN a user taps "Log as Expense" after a successful scan, THE Scan_Module SHALL persist a single new JournalEntry with `type = 'EXPENSE'`, `category = 'Palengke'`, `note` summarizing the scanned items, `amountPhp` equal to the user-entered total, and `sourceOrderId = null`.
5. WHEN the "Log as Expense" JournalEntry is persisted successfully, THE CarinderAI_App SHALL display a toast with the message "Naitala na!" and navigate to Finance_Module.

### Requirement 9: Tier 2 — Dashboard (Home Tab)

**User Story:** As a carinderia owner, I want a friendly home screen that summarizes today and gets me to common actions fast, so that I can start my day without hunting through tabs.

#### Acceptance Criteria

1. THE Dashboard_Tab SHALL display a greeting message with Tagalog flavor microcopy.
2. THE Dashboard_Tab SHALL display today's total sales, today's total expenses, and today's net using the same computations defined in Requirement 5.
3. THE Dashboard_Tab SHALL display three quick-action buttons labeled Scan, Order, and Log Sale.
4. WHEN a user taps the Scan quick action, THE CarinderAI_App SHALL navigate to the Scan_Module.
5. WHEN a user taps the Order quick action, THE CarinderAI_App SHALL navigate to the Market_Module.
6. WHEN a user taps the Log Sale quick action, THE CarinderAI_App SHALL navigate to the Finance_Module manual entry form with `type` preselected to `REVENUE`.

### Requirement 10: Tier 2 — Customer Browse (Static)

**User Story:** As a carinderia owner exploring the customer-facing side, I want to see how my carinderia could appear to nearby customers, so that I can imagine the future delivery feature.

#### Acceptance Criteria

1. THE Customer_Browse SHALL render a 2-column grid of exactly 4 seeded Carinderia cards.
2. THE Customer_Browse SHALL display each Carinderia card with name, distanceKm, topDish, rating, and priceRange.
3. WHEN a user taps a Carinderia card, THE Customer_Browse SHALL navigate to a detail page displaying the Carinderia's full details and a list of its seeded MenuItems with name and pricePhp formatted as `₱X,XXX.XX`.
4. THE Customer_Browse SHALL display a "Coming soon: delivery" badge on the detail page.
5. THE Customer_Browse SHALL NOT expose any ordering controls.

### Requirement 11: Tier 3 — Insights (Mocked Predictions)

**User Story:** As a carinderia owner, I want a glimpse of future smart suggestions, so that I can see where the product is headed.

#### Acceptance Criteria

1. THE Insights_Module SHALL display a hardcoded weather value of "Rainy, 26°C".
2. THE Insights_Module SHALL display the current day of the week derived from the device's local time zone.
3. THE Insights_Module SHALL display a hardcoded recommendation card with the text "Suggested menu today: sinigang, lugaw, mami. Expected foot traffic: -20% due to rain".
4. THE Insights_Module SHALL NOT execute any machine-learning inference or call any external prediction service.

### Requirement 12: Tier 3 — Tray Tally (Mocked Demo)

**User Story:** As a carinderia owner curious about computer vision tallying, I want a clearly-labeled beta demo, so that I can preview a future feature without being misled.

#### Acceptance Criteria

1. THE Tray_Tally SHALL display exactly one preloaded photograph of a Filipino food tray.
2. THE Tray_Tally SHALL display a button labeled "Tally".
3. WHEN a user taps the Tally button, THE Tray_Tally SHALL display a hardcoded receipt of "adobo ₱40.00 + rice ₱15.00 = ₱55.00".
4. THE Tray_Tally SHALL display a "Beta" label visible without scrolling on the screen.

### Requirement 13: Settings and Language Toggle

**User Story:** As a carinderia owner who reads English and Tagalog, I want to toggle the UI language, so that I can choose what feels natural.

#### Acceptance Criteria

1. THE Settings_Module SHALL display a language toggle with options "English" and "Tagalog".
2. WHEN a user selects a language option, THE CarinderAI_App SHALL update the active language in the Strings_File reference and re-render visible text from the corresponding key set.
3. THE Strings_File SHALL ship with a complete English string set and a stub Tagalog string set containing translations for at least 10 key strings.
4. WHEN the user has not previously selected a language, THE CarinderAI_App SHALL default the active language to English.
5. THE CarinderAI_App SHALL persist the selected language across sessions on the same device using localStorage under the key 'carinderai.lang'.

### Requirement 14: Data Model (Prisma + SQLite)

**User Story:** As a developer building CarinderAI, I want a Prisma schema that captures all entities the app uses, so that every feature has a stable persistence contract.

#### Acceptance Criteria

1. THE CarinderAI_App SHALL define a Prisma model `Supplier` with fields `id`, `name`, `logoUrl`, and `category`.
2. THE CarinderAI_App SHALL define a Prisma model `Product` with fields `id`, `supplierId`, `name`, `category`, `unit`, `pricePhp`, `stock`, and `imageUrl`, where `unit` is constrained to one of `kg`, `pc`, `L`, or `pack`. Product.imageUrl values shall be single emoji glyphs (e.g., '🍖', '🐟', '🥬') selected by category, not URLs.
3. THE CarinderAI_App SHALL define a Prisma model `Order` with fields `id`, `status`, `createdAt`, and `totalPhp`.
4. THE CarinderAI_App SHALL define a Prisma model `OrderItem` with fields `id`, `orderId`, `productId`, `quantity`, and `unitPriceSnapshot`.
5. THE CarinderAI_App SHALL define a Prisma model `JournalEntry` with fields `id`, `date`, `type`, `category`, `amountPhp`, `note`, and optional `sourceOrderId`, where `type` is constrained to `REVENUE` or `EXPENSE`.
6. THE CarinderAI_App SHALL define a Prisma model `Carinderia` with fields `id`, `name`, `address`, `distanceKm`, `rating`, `priceRange`, `topDish`, and `imageUrl`.
7. THE CarinderAI_App SHALL define a Prisma model `MenuItem` with fields `id`, `carinderiaId`, `name`, and `pricePhp`.
8. THE CarinderAI_App SHALL configure Prisma to use SQLite as its database provider.
9. THE Product.supplierId field SHALL reference Supplier.id with a foreign-key relation.
10. THE OrderItem.orderId field SHALL reference Order.id with a foreign-key relation.
11. THE OrderItem.productId field SHALL reference Product.id with a foreign-key relation.
12. THE MenuItem.carinderiaId field SHALL reference Carinderia.id with a foreign-key relation.
13. THE JournalEntry.sourceOrderId field SHALL reference Order.id with an optional foreign-key relation.

### Requirement 15: Seed Data

**User Story:** As a developer running the app for the first time, I want realistic seed data, so that every screen looks alive on launch.

#### Acceptance Criteria

1. THE CarinderAI_App SHALL provide a `seed.ts` script that populates the database with the entities defined in Requirement 14.
2. THE seed script SHALL create exactly 6 Suppliers named: Magnolia Meats, Dizon Farms, Bounty Fresh, NutriAsia, Pure Foods, and Farm Fresh.
3. THE seed script SHALL create between 25 and 30 Products spanning the following Filipino staples: pork belly, pork shoulder, chicken whole, chicken breast, bangus, tilapia, ground beef, kangkong, pechay, sitaw, kalabasa, talong, sibuyas, bawang, kamatis, kanin/bigas, mantika, toyo, suka, patis, asin, paminta, itlog, gatas, atsuete, and laurel.
4. THE seed script SHALL assign every Product to one of the categories Meat, Fish, Vegetables, Condiments, or Rice/Grains.
5. THE seed script SHALL create exactly 4 Carinderia records using realistic Makati names with varied ratings.
6. THE seed script SHALL create at least 3 MenuItems per Carinderia.
7. THE seed script SHALL create JournalEntries spanning the last 7 calendar days, including a mix of REVENUE and EXPENSE entries.
8. WHEN the seed script completes, THE Finance_Module SHALL display a non-empty list and a non-empty 7-day chart on first launch.

### Requirement 16: Currency Formatting

**User Story:** As a carinderia owner reading numbers all day, I want every peso amount formatted consistently, so that I never misread a price.

#### Acceptance Criteria

1. THE CarinderAI_App SHALL format every PHP value displayed in the UI as `₱X,XXX.XX` with the peso glyph, comma thousands separators, and exactly two decimal places.
2. THE CarinderAI_App SHALL apply the formatting rule from item 1 to all currency values across Market_Module, Finance_Module, Scan_Module, Dashboard_Tab, Customer_Browse, and Tray_Tally.

### Requirement 17: Empty States, Loading, and Toasts

**User Story:** As a carinderia owner using the app for the first time, I want clear feedback for every state, so that I always know what is happening.

#### Acceptance Criteria

1. THE CarinderAI_App SHALL display an empty-state message with friendly Filipino copy on every list view that has zero items, including Market_Module category lists, Finance_Module list, Scan_Module result list, and Customer_Browse menus.
2. WHILE the Scan_API request is in flight, THE Scan_Module SHALL display a loading spinner.
3. WHILE the checkout request is in flight, THE Market_Module SHALL display a loading spinner.
4. WHEN an Order is created successfully, THE CarinderAI_App SHALL display a toast notification.
5. WHEN a JournalEntry is created successfully, THE CarinderAI_App SHALL display a toast notification.

### Requirement 18: Smoke Test Coverage

**User Story:** As a developer maintaining CarinderAI, I want a single smoke test of the Scan_API, so that I can confirm the OCR endpoint is wired correctly without committing to a full test suite.

#### Acceptance Criteria

1. THE CarinderAI_App SHALL include exactly one automated smoke test exercising the Scan_API route.
2. THE smoke test SHALL POST a sample image to `/api/scan` and assert that the response status is 200 and the response body conforms to the OCR_Result schema defined in Requirement 7.
3. THE CarinderAI_App SHALL NOT include any other automated tests beyond the Scan_API smoke test.

### Requirement 19: Non-Goals

**User Story:** As a stakeholder reviewing the spec, I want explicit non-goals, so that scope creep is prevented during implementation.

#### Acceptance Criteria

1. THE CarinderAI_App SHALL NOT include any authentication or login flow.
2. THE CarinderAI_App SHALL NOT integrate with any real payment processor.
3. THE CarinderAI_App SHALL NOT integrate with any real delivery tracking service.
4. THE CarinderAI_App SHALL NOT use a third-party internationalization library.
5. THE CarinderAI_App SHALL NOT include production deployment configuration files beyond what Next.js generates by default.

### Requirement 20: Implementation Priority Order

**User Story:** As a developer planning the build, I want a clear priority order, so that Tier 1 features are demo-ready before Tier 2 and Tier 3.

#### Acceptance Criteria

1. THE CarinderAI_App implementation plan SHALL order tasks so that the Prisma schema is established before any feature work.
2. THE CarinderAI_App implementation plan SHALL order tasks so that the seed script is completed before features that depend on seeded data.
3. THE CarinderAI_App implementation plan SHALL order Tier 1 work — Market_Module and Cart, Finance_Module, Scan_API, Scan_Module — before any Tier 2 or Tier 3 work.
4. THE CarinderAI_App implementation plan SHALL order Tier 2 work — Dashboard_Tab, Customer_Browse — before any Tier 3 work.
5. THE CarinderAI_App implementation plan SHALL order Tier 3 work — Insights_Module, Tray_Tally — before final polish tasks.

### Requirement 21: Microcopy Catalog

**User Story:** As a developer implementing UI copy, I want a pinned catalog of Filipino microcopy strings, so that the language feel is consistent.

#### Acceptance Criteria

1. THE Strings_File SHALL include the following English keys with the following exact Tagalog translations:
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
