import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const friend = await prisma.friend.findUnique({
      where: { id },
      include: {
        splits: {
          include: {
            item: {
              include: {
                expense: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        payments: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!friend) {
      return NextResponse.json({ error: "Friend not found" }, { status: 404 });
    }

    const unsettledSplits = friend.splits.filter((s) => !s.isSettled);
    const totalOwed = unsettledSplits.reduce((acc, s) => acc + s.assignedShare, 0);
    const totalPaid = friend.payments.reduce((acc, p) => acc + p.amount, 0);
    const balance = Math.max(0, totalOwed - totalPaid);

    return NextResponse.json({
      ...friend,
      totalOwed,
      totalPaid,
      balance,
    });
  } catch (error) {
    console.error("Error fetching friend details:", error);
    return NextResponse.json(
      { error: "Failed to fetch friend details" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, email, phone, notes } = body;

    const updated = await prisma.friend.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(email !== undefined && { email: email ? email.trim() : null }),
        ...(phone !== undefined && { phone: phone ? phone.trim() : null }),
        ...(notes !== undefined && { notes: notes ? notes.trim() : null }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating friend:", error);
    return NextResponse.json(
      { error: "Failed to update friend" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.friend.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting friend:", error);
    return NextResponse.json(
      { error: "Failed to delete friend" },
      { status: 500 }
    );
  }
}
