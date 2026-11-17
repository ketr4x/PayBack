import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/friends - Returns all friends with their computed balances
export async function GET() {
  try {
    const friends = await prisma.friend.findMany({
      include: {
        splits: {
          include: {
            item: {
              include: {
                expense: true,
              },
            },
          },
        },
        payments: true,
      },
      orderBy: { name: "asc" },
    });

    const summary = friends.map((friend) => {
      // Calculate total owed from unsettled splits
      const unsettledSplits = friend.splits.filter((s) => !s.isSettled);
      const totalOwed = unsettledSplits.reduce((acc, s) => acc + s.assignedShare, 0);

      // Total payments recorded that haven't been factored into split settlements
      const totalPaid = friend.payments.reduce((acc, p) => acc + p.amount, 0);

      // Remaining balance owed to user (positive means friend owes money)
      const balance = Math.max(0, totalOwed - totalPaid);

      return {
        id: friend.id,
        name: friend.name,
        email: friend.email,
        phone: friend.phone,
        avatarUrl: friend.avatarUrl,
        notes: friend.notes,
        totalOwed,
        totalPaid,
        balance,
        unsettledSplitsCount: unsettledSplits.length,
        splits: friend.splits,
        payments: friend.payments,
      };
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching friends:", error);
    return NextResponse.json(
      { error: "Failed to fetch friends" },
      { status: 500 }
    );
  }
}

// POST /api/friends - Add a new friend
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, notes } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const friend = await prisma.friend.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(friend, { status: 201 });
  } catch (error) {
    console.error("Error creating friend:", error);
    return NextResponse.json(
      { error: "Failed to create friend" },
      { status: 500 }
    );
  }
}
