import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { isSettled } = body;

    const updated = await prisma.itemSplit.update({
      where: { id },
      data: {
        isSettled: Boolean(isSettled),
        settledAt: isSettled ? new Date() : null,
      },
      include: {
        item: true,
        friend: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating split status:", error);
    return NextResponse.json(
      { error: "Failed to update split" },
      { status: 500 }
    );
  }
}
