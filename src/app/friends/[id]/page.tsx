"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Check,
  Copy,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import SettleModal from "@/components/SettleModal";

interface FriendDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  totalOwed: number;
  totalPaid: number;
  balance: number;
  splits: {
    id: string;
    assignedShare: number;
    isSettled: boolean;
    settledAt: string | null;
    createdAt: string;
    item: {
      id: string;
      name: string;
      price: number;
      quantity: number;
      expense: {
        id: string;
        title: string;
        date: string;
        currency: string;
      };
    };
  }[];
  payments: {
    id: string;
    amount: number;
    date: string;
    note: string | null;
  }[];
}

export default function FriendDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [friend, setFriend] = useState<FriendDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchFriend = async () => {
    try {
      const res = await fetch(`/api/friends/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFriend(data);
      }
    } catch (err) {
      console.error("Failed to load friend", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriend();
  }, [id]);

  const toggleSplitSettled = async (splitId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/splits/${splitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSettled: !currentStatus }),
      });
      if (res.ok) {
        fetchFriend();
      }
    } catch (err) {
      console.error("Failed to toggle split", err);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        Loading friend details...
      </div>
    );
  }

  if (!friend) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-white mb-2">Friend not found</h2>
        <Link href="/friends" className="text-emerald-400 hover:underline">
          Back to friends
        </Link>
      </div>
    );
  }

  const unsettledSplits = friend.splits.filter((s) => !s.isSettled);
  const settledSplits = friend.splits.filter((s) => s.isSettled);

  const reminderText = `Hey ${friend.name}! You have ${formatCurrency(
    friend.balance
  )} remaining for your items on PayBack. Whenever you can send that, let me know! Thanks!`;

  const copyReminder = () => {
    navigator.clipboard.writeText(reminderText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </Link>
      </div>

      {/* Friend Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center font-extrabold text-2xl text-white uppercase shadow-md shadow-indigo-600/20">
            {friend.name.substring(0, 2)}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {friend.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
              {friend.phone && <span>Phone: {friend.phone}</span>}
              {friend.email && <span>Email: {friend.email}</span>}
              {friend.notes && <span className="italic">&quot;{friend.notes}&quot;</span>}
            </div>
          </div>
        </div>

        {/* Balance Card Action */}
        <div className="flex flex-col sm:items-end justify-center bg-slate-950/60 sm:bg-transparent p-4 sm:p-0 rounded-2xl border border-slate-800 sm:border-0">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Left to Pay
          </span>
          <span
            className={`text-3xl font-extrabold ${
              friend.balance > 0 ? "text-emerald-400" : "text-slate-400"
            }`}
          >
            {formatCurrency(friend.balance)}
          </span>
          {friend.balance > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={copyReminder}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-indigo-400" /> Share Reminder
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsSettleModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-500/20"
              >
                Record Paid
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs or Sections: Unpaid Items vs History */}
      <div className="space-y-6">
        {/* Unpaid Items Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">
                Unpaid Items & Splits ({unsettledSplits.length})
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-400">
              Check off items as they are paid
            </span>
          </div>

          {unsettledSplits.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              🎉 All items for {friend.name} are settled!
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {unsettledSplits.map((split) => (
                <div
                  key={split.id}
                  className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleSplitSettled(split.id, split.isSettled)}
                      className="w-6 h-6 rounded-lg border border-slate-700 hover:border-emerald-500 flex items-center justify-center text-transparent hover:text-emerald-400 transition"
                      title="Mark item as settled"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <div>
                      <div className="font-semibold text-white text-sm">
                        {split.item.name}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>From &quot;{split.item.expense.title}&quot;</span>
                        <span>•</span>
                        <span>{formatDate(split.item.expense.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-bold text-emerald-400">
                      {formatCurrency(split.assignedShare)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Repayments Recorded */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">
                Payment History ({friend.payments.length})
              </h2>
            </div>
          </div>

          {friend.payments.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-sm">
              No payments recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {friend.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-200">
                      {payment.note || "Repayment"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDate(payment.date)}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-indigo-400">
                    +{formatCurrency(payment.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Settled Items */}
        {settledSplits.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              Previously Settled Items ({settledSplits.length})
            </h3>
            <div className="divide-y divide-slate-800/50">
              {settledSplits.map((split) => (
                <div
                  key={split.id}
                  className="py-2.5 flex items-center justify-between text-xs text-slate-500 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-2 line-through">
                    <span>{split.item.name}</span>
                    <span>({split.item.expense.title})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>{formatCurrency(split.assignedShare)}</span>
                    <button
                      type="button"
                      onClick={() => toggleSplitSettled(split.id, split.isSettled)}
                      className="text-slate-400 hover:text-white underline text-[11px]"
                    >
                      Undo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Settle Modal */}
      {friend && (
        <SettleModal
          friend={friend}
          isOpen={isSettleModalOpen}
          onClose={() => setIsSettleModalOpen(false)}
          onSettled={fetchFriend}
        />
      )}
    </div>
  );
}
