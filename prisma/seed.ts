import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding test data...");

  // Clean existing
  await prisma.payment.deleteMany();
  await prisma.itemSplit.deleteMany();
  await prisma.expenseItem.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.friend.deleteMany();

  // Create Friends
  const alex = await prisma.friend.create({
    data: {
      name: "Alex Johnson",
      email: "alex@example.com",
      phone: "+1 555-0101",
      notes: "Roommate",
    },
  });

  const sarah = await prisma.friend.create({
    data: {
      name: "Sarah Miller",
      email: "sarah@example.com",
      phone: "+1 555-0102",
      notes: "Coworker",
    },
  });

  const dave = await prisma.friend.create({
    data: {
      name: "Dave Chen",
      email: "dave@example.com",
      phone: "+1 555-0103",
      notes: "Gym buddy",
    },
  });

  // Expense 1: Friday Dinner ($78.50 + $7.50 Tax + $15.00 Tip = $101.00)
  const dinner = await prisma.expense.create({
    data: {
      title: "Trattoria Pasta & Wine",
      category: "Dining",
      totalAmount: 101.0,
      tax: 7.5,
      tip: 15.0,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // Items
  const pizza = await prisma.expenseItem.create({
    data: {
      expenseId: dinner.id,
      name: "Truffle Pizza",
      price: 24.0,
    },
  });

  const pasta = await prisma.expenseItem.create({
    data: {
      expenseId: dinner.id,
      name: "Seafood Linguine",
      price: 26.0,
    },
  });

  const wine = await prisma.expenseItem.create({
    data: {
      expenseId: dinner.id,
      name: "Bottle of Chianti",
      price: 28.5,
    },
  });

  // Splits with proportional tax/tip (~28.6% extra)
  // Pizza split between Alex and Sarah ($12 base + $3.44 extra = $15.44 each)
  await prisma.itemSplit.createMany({
    data: [
      { itemId: pizza.id, friendId: alex.id, assignedShare: 15.44, isSettled: false },
      { itemId: pizza.id, friendId: sarah.id, assignedShare: 15.44, isSettled: false },
    ],
  });

  // Pasta for Dave only ($26 base + $7.45 extra = $33.45)
  await prisma.itemSplit.create({
    data: { itemId: pasta.id, friendId: dave.id, assignedShare: 33.45, isSettled: false },
  });

  // Wine split across Alex, Sarah, Dave ($9.50 base + $2.72 extra = $12.22 each)
  await prisma.itemSplit.createMany({
    data: [
      { itemId: wine.id, friendId: alex.id, assignedShare: 12.22, isSettled: false },
      { itemId: wine.id, friendId: sarah.id, assignedShare: 12.22, isSettled: false },
      { itemId: wine.id, friendId: dave.id, assignedShare: 12.22, isSettled: false },
    ],
  });

  // Add partial payment from Sarah of $10
  await prisma.payment.create({
    data: {
      friendId: sarah.id,
      amount: 10.0,
      note: "Venmo partial for wine",
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
