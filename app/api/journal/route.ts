import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CreateJournalInput } from '@/lib/schemas';

// POST /api/journal
//
// Creates a JournalEntry from a manual entry form or the Scan_Module's
// "Log as Expense" flow. Always sets sourceOrderId to null — auto-journaled
// rows from checkouts are written by POST /api/orders instead.
//
// See: .kiro/specs/carinderai/design.md §POST /api/journal, §Error Handling Matrix
// Requirements: 4.4, 4.5, 4.6, 8.4
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json();
    const parsed = CreateJournalInput.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', issues: parsed.error.issues },
        { status: 400 },
      );
    }

    // parsed.data.note is `string | undefined`; the JournalEntry.note column
    // is `String?` so leaving it `undefined` lets Prisma store NULL. We
    // intentionally do NOT coerce to `null` here.
    const entry = await prisma.journalEntry.create({
      data: {
        ...parsed.data,
        sourceOrderId: null,
      },
    });

    return NextResponse.json({ id: entry.id });
  } catch (err) {
    console.error('[POST /api/journal] Internal error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
