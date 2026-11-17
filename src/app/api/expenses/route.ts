import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/expenses - List all expenses with item and split details
export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      include: {
        items: {
          include: {
            splits: {
              include: {
                friend: true,
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

// POST /api/expenses - Create new expense with items and friend splits
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      category,
      totalAmount,
      currency,
      date,
      receiptUrl,
      receiptRawText,
      tax = 0,
      tip = 0,
      discount = 0,
      items, // array of { name, price, quantity, assignedFriendIds }
    } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

    // Calculate sum of base items
    const baseItemsSum = items.reduce(
      (acc: number, item: { price: number; quantity?: number }) =>
        acc + Number(item.price || 0) * (item.quantity || 1),
      0
    );

    // Calculate tax/tip ratio if additional charges exist
    // Extra amount = tax + tip - discount
    const extraCharges = (Number(tax) || 0) + (Number(tip) || 0) - (Number(discount) || 0);
    const extraRatio = baseItemsSum > 0 ? extraCharges / baseItemsSum : 0;

    const expense = await prisma.$transaction(async (tx) => {
      const createdExpense = await tx.expense.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          category: category?.trim() || "General",
          totalAmount: Number(totalAmount || (baseItemsSum + extraCharges)),
          currency: currency || "$",
          date: date ? new Date(date) : new Date(),
          receiptUrl: receiptUrl || null,
          receiptRawText: receiptRawText || null,
          tax: Number(tax) || 0,
          tip: Number(tip) || 0,
          discount: Number(discount) || 0,
        },
      });

      for (const item of items) {
        const itemTotal = Number(item.price || 0) * (item.quantity || 1);
        const createdItem = await tx.expenseItem.create({
          data: {
            expenseId: createdExpense.id,
            name: item.name.trim(),
            price: Number(item.price || 0),
            quantity: Number(item.quantity || 1),
          },
        });

        const assignedFriendIds: string[] = Array.isArray(item.assignedFriendIds)
          ? item.assignedFriendIds
          : [];

        if (assignedFriendIds.length > 0) {
          // Each friend pays their base share plus their proportional share of tax/tip
          const perPersonBase = itemTotal / assignedFriendIds.length;
          const perPersonExtra = (itemTotal * extraRatio) / assignedFriendIds.length;
          const assignedShare = Number((perPersonBase + perPersonExtra).toFixed(2));

          for (const friendId of assignedFriendIds) {
            await tx.itemSplit.create({
              data: {
                itemId: createdItem.id,
                friendId,
                assignedShare,
                isSettled: false,
              },
            });
          }
        }
      }

      return createdExpense;
    });

    const fullExpense = await prisma.expense.findUnique({
      where: { id: expense.id },
      include: {
        items: {
          include: {
            splits: {
              include: {
                friend: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(fullExpense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
