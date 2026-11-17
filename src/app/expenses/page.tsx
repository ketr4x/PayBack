"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ReceiptText,
  PlusCircle,
  Calendar,
  Trash2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ExpenseListItem {
  id: string;
  title: string;
  totalAmount: number;
  date: string;
  category: string;
  tax: number;
  tip: number;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    splits: {
      id: string;
      assignedShare: number;
      isSettled: boolean;
      friend: {
        id: string;
        name: string;
      };
    }[];
  }[];
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/expenses");
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (err) {
      console.error("Failed to fetch expenses", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleDeleteExpense = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchExpenses();
      }
    } catch (err) {
      console.error("Failed to delete expense", err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Expenses</h1>
          <p className="text-sm text-slate-400 mt-1">
            All your logged purchases, receipts, and split records.
          </p>
        </div>
        <Link
          href="/expenses/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-lg shadow-emerald-500/20 active:scale-95 text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Expense</span>
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Loading expenses...
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-12 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <ReceiptText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">
              No expenses recorded yet
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Add your first purchase or receipt to start splitting costs.
            </p>
            <Link
              href="/expenses/new"
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-xs transition inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Split Expense</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {expenses.map((expense) => {
              // Collect all involved friends
              const friendsMap: Record<string, string> = {};
              let settledCount = 0;
              let totalSplits = 0;

              for (const item of expense.items) {
                for (const split of item.splits) {
                  friendsMap[split.friend.id] = split.friend.name;
                  totalSplits++;
                  if (split.isSettled) settledCount++;
                }
              }

              const friendNames = Object.values(friendsMap);

              return (
                <div
                  key={expense.id}
                  className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">
                        {expense.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-semibold text-slate-400 border border-slate-700">
                        {expense.category}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {formatDate(expense.date)}
                      </span>
                      <span>•</span>
                      <span>{expense.items.length} items</span>

                      {friendNames.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-slate-300">
                            Split with: {friendNames.join(", ")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <div className="text-right">
                      <div className="text-base font-bold text-white">
                        {formatCurrency(expense.totalAmount)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {totalSplits > 0
                          ? `${settledCount}/${totalSplits} splits paid`
                          : "No friend splits"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteExpense(expense.id, expense.title)
                        }
                        className="p-2 text-slate-500 hover:text-rose-400 transition rounded-lg"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
