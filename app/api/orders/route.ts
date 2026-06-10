import { NextRequest, NextResponse } from 'next/server';
import { JournalEntryType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { CreateOrderInput } from '@/lib/schemas';

// POST /api/orders
//
// Creates an Order + OrderItem rows + a paired EXPENSE JournalEntry inside a
// single Prisma transaction. This is the auto-journaling invariant from
// Requirement 3.7.
//
// See: .kiro/specs/carinderai/design.md §POST /api/orders, §Error Handling Matrix
// Requirements: 3.4, 3.5, 3.6, 3.7
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json();
    const parsed = CreateOrderInput.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const productIds = parsed.data.lines.map((l) => l.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, pricePhp: true },
    });

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missingId = productIds.find((id) => !foundIds.has(id)) ?? productIds[0];
      return NextResponse.json(
        { error: 'Product not found', productId: missingId },
        { status: 404 },
      );
    }

    const priceMap = new Map<string, number>(
      products.map((p) => [p.id, p.pricePhp]),
    );

    const rawTotal = parsed.data.lines.reduce((sum, l) => {
      const price = priceMap.get(l.productId) as number;
      return sum + price * l.quantity;
    }, 0);
    // Round to 2 decimals to avoid float drift before persistence.
    const totalPhp = Number(rawTotal.toFixed(2));

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          status: 'PLACED',
          totalPhp,
          items: {
            create: parsed.data.lines.map((l) => ({
              productId: l.productId,
              quantity: l.quantity,
              unitPriceSnapshot: priceMap.get(l.productId) as number,
            })),
          },
        },
      });

      const journal = await tx.journalEntry.create({
        data: {
          date: order.createdAt,
          type: JournalEntryType.EXPENSE,
          category: 'Supplies',
          amountPhp: order.totalPhp,
          sourceOrderId: order.id,
          note: `Order ${order.id}`,
        },
      });

      return {
        orderId: order.id,
        totalPhp: order.totalPhp,
        journalEntryId: journal.id,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[POST /api/orders] Internal error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
