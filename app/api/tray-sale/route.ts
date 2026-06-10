import { NextRequest, NextResponse } from 'next/server';
import { JournalEntryType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { TrayResult } from '@/lib/schemas';
import { TRAY_MENU, type TrayDishId } from '@/lib/tray-menu';

// POST /api/tray-sale
//
// Records a Tray Tally sale: validates the items array against the
// canonical TRAY_MENU, computes a server-side total, and writes a single
// JournalEntry of type 'REVENUE' (category 'Sales'). This is how the
// Camera POS feeds the Finance ledger — analogous to /api/orders writing
// the EXPENSE entry on supply checkout.
//
// Mirrors the error-handling shape of `app/api/orders/route.ts`:
//   - 400 on zod failure (`{ error: 'Invalid input', issues: ZodIssue[] }`)
//   - 500 on unexpected error (`{ error: 'Internal error' }`)
//
// Returns `{ journalEntryId, totalPhp, lines: [{dishId, name, quantity, pricePhp, subtotalPhp}] }`
// so the client can render a printable receipt without re-deriving prices.
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json();
    const parsed = TrayResult.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', issues: parsed.error.issues },
        { status: 400 },
      );
    }

    if (parsed.data.items.length === 0) {
      return NextResponse.json(
        { error: 'No items on the tray' },
        { status: 400 },
      );
    }

    // Build a price lookup from the canonical menu so the server is the
    // source of truth — clients never get to dictate prices.
    const priceMap = new Map<TrayDishId, { name: string; pricePhp: number }>(
      TRAY_MENU.map((d) => [d.id, { name: d.name, pricePhp: d.pricePhp }]),
    );

    const lines = parsed.data.items.map((it) => {
      const meta = priceMap.get(it.dishId);
      if (!meta) {
        // Should be unreachable — the zod enum already rejects unknown ids.
        throw new Error(`Unknown dishId: ${it.dishId}`);
      }
      const subtotalPhp = Number((meta.pricePhp * it.quantity).toFixed(2));
      return {
        dishId: it.dishId,
        name: meta.name,
        quantity: it.quantity,
        pricePhp: meta.pricePhp,
        subtotalPhp,
      };
    });

    const rawTotal = lines.reduce((sum, l) => sum + l.subtotalPhp, 0);
    const totalPhp = Number(rawTotal.toFixed(2));

    // Note: "Tray sale: 2x Adobo, 1x Rice" — itemized for the journal row.
    const note =
      `Tray sale: ` +
      lines.map((l) => `${l.quantity}x ${l.name}`).join(', ');

    const journal = await prisma.journalEntry.create({
      data: {
        date: new Date(),
        type: JournalEntryType.REVENUE,
        category: 'Sales',
        amountPhp: totalPhp,
        note,
        sourceOrderId: null,
      },
    });

    return NextResponse.json({
      journalEntryId: journal.id,
      totalPhp,
      lines,
    });
  } catch (err) {
    console.error('[POST /api/tray-sale] Internal error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
