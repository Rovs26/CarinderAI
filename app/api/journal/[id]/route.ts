import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { UpdateJournalInput } from "@/lib/schemas";

/**
 * PATCH /api/journal/[id]
 *
 * Partially updates an editable JournalEntry. Auto-generated entries
 * (those with `sourceOrderId !== null`) are locked because their values
 * mirror the source Order — letting the user edit them in isolation
 * would silently drift the journal away from the underlying ledger.
 *
 * Status codes:
 *   200 — updated, body is the full updated row
 *   400 — invalid body (zod failure)
 *   404 — entry not found
 *   409 — entry is auto-generated (code: AUTO_GENERATED)
 *   500 — db / unexpected
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    const raw: unknown = await req.json();
    const parsed = UpdateJournalInput.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const existing = await prisma.journalEntry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existing.sourceOrderId !== null) {
      return NextResponse.json(
        {
          error: "Cannot edit auto-generated entries",
          code: "AUTO_GENERATED",
        },
        { status: 409 },
      );
    }

    const updated = await prisma.journalEntry.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/journal/[id]] Internal error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * DELETE /api/journal/[id]
 *
 * Same auto-generated lock as PATCH. Returns `{ id, deleted: true }`
 * on success so callers can confirm the operation.
 */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    const existing = await prisma.journalEntry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existing.sourceOrderId !== null) {
      return NextResponse.json(
        {
          error: "Cannot edit auto-generated entries",
          code: "AUTO_GENERATED",
        },
        { status: 409 },
      );
    }

    await prisma.journalEntry.delete({ where: { id } });
    return NextResponse.json({ id, deleted: true });
  } catch (err) {
    console.error("[DELETE /api/journal/[id]] Internal error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
