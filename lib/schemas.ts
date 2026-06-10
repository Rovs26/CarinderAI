import { z } from 'zod';

// POST /api/orders input — see design.md §Server Actions / API Routes Catalog
export const CreateOrderInput = z.object({
  lines: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().positive().min(0.01),
      }),
    )
    .min(1),
});

export type CreateOrderInput = z.infer<typeof CreateOrderInput>;

// POST /api/journal input — see design.md §POST /api/journal
export const CreateJournalInput = z.object({
  date: z.coerce.date(),
  type: z.enum(['REVENUE', 'EXPENSE']),
  category: z.string().min(1),
  amountPhp: z.number().positive(),
  note: z.string().optional(),
});

export type CreateJournalInput = z.infer<typeof CreateJournalInput>;

// PATCH /api/journal/[id] input. Every field is optional — callers send
// only what they want changed. Auto-generated entries (`sourceOrderId`
// not null) are blocked at the route handler, not at the schema, since
// schema validation runs before the lookup.
export const UpdateJournalInput = z.object({
  date: z.coerce.date().optional(),
  type: z.enum(['REVENUE', 'EXPENSE']).optional(),
  category: z.string().min(1).optional(),
  amountPhp: z.number().positive().optional(),
  note: z.string().nullable().optional(),
});

export type UpdateJournalInput = z.infer<typeof UpdateJournalInput>;

// /api/scan output — see design.md §Scan_API Detailed Design
export const OcrItem = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: z.enum(['kg', 'pc', 'L', 'pack', 'bundle']),
  note: z.string().optional(),
  translated: z.string().optional(),
});
export type OcrItem = z.infer<typeof OcrItem>;

export const OcrResult = z.object({ items: z.array(OcrItem) });
export type OcrResult = z.infer<typeof OcrResult>;

// /api/tray output and /api/tray-sale input — see lib/tray-menu.ts.
//
// `dishId` is constrained to the 6 known menu dish ids. `quantity` is a
// positive integer (servings on the tray); the route handler enforces ≥ 1.
export const TrayItem = z.object({
  dishId: z.enum([
    'adobo',
    'sinigang',
    'kare-kare',
    'pinakbet',
    'lechon-kawali',
    'rice',
  ]),
  quantity: z.number().int().min(1),
});
export type TrayItem = z.infer<typeof TrayItem>;

export const TrayResult = z.object({ items: z.array(TrayItem) });
export type TrayResult = z.infer<typeof TrayResult>;

// /api/tray/count output — Counter Session frame.
//
// Counts each of the 6 known dishes on a food counter. Every dish key is
// REQUIRED (set to 0 when not visible) so the client doesn't have to
// reason about missing fields when diffing consecutive frames. The route
// handler returns all-zeros on parse failure to match the "fail soft"
// contract of /api/tray (don't break the live session loop on a single
// flaky model response).
export const CounterFrame = z.object({
  counts: z.object({
    adobo: z.number().int().min(0),
    sinigang: z.number().int().min(0),
    'kare-kare': z.number().int().min(0),
    pinakbet: z.number().int().min(0),
    'lechon-kawali': z.number().int().min(0),
    rice: z.number().int().min(0),
  }),
});
export type CounterFrame = z.infer<typeof CounterFrame>;
