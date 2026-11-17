import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { friendId, amount, note, markAllSettled } = body;

    if (!friendId || amount === undefined || amount <= 0) {
      return NextResponse.json(
        { error: "friendId and a valid amount are required" },
        { status: 400 }
      );
    }

    // Record payment
    const payment = await prisma.payment.create({
      data: {
        friendId,
        amount: Number(amount),
        note: note ? note.trim() : null,
      },
    });

    // If requested or if the friend has settled their balance, mark unsettled splits as settled
    if (markAllSettled) {
      await prisma.itemSplit.updateMany({
        where: {
          friendId,
          isSettled: false,
        },
        data: {
          isSettled: true,
          settledAt: new Date(),
        },
      });
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}
