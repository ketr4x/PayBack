"use client";

import React, { useState } from "react";
import { Check, Copy, Share2, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { formatCurrency } from "@/lib/utils";

interface SettleModalProps {
  friend: {
    id: string;
    name: string;
    balance: number;
    phone?: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onSettled: () => void;
}

export default function SettleModal({
  friend,
  isOpen,
  onClose,
  onSettled,
}: SettleModalProps) {
  const [paymentAmount, setPaymentAmount] = useState<number>(friend.balance);
  const [note, setNote] = useState<string>("Settled balance via PayBack");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friendId: friend.id,
          amount: paymentAmount,
          note,
          markAllSettled: paymentAmount >= friend.balance,
        }),
      });

      if (res.ok) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        onSettled();
        onClose();
      }
    } catch (err) {
      console.error("Failed to settle payment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reminderText = `Hey ${friend.name}! You currently have an open balance of ${formatCurrency(
    friend.balance
  )} on PayBack for our recent shared purchases. Let me know when you've sent it over!`;

  const copyReminder = () => {
    navigator.clipboard.writeText(reminderText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
        <h3 className="text-xl font-bold text-white mb-1">
          Settle with {friend.name}
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Current outstanding debt:{" "}
          <span className="font-semibold text-emerald-400">
            {formatCurrency(friend.balance)}
          </span>
        </p>

        {/* Reminder Share Helper */}
        <div className="mb-6 p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-indigo-400" /> Payment Reminder
            </span>
            <button
              type="button"
              onClick={copyReminder}
              className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy message
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-300 italic line-clamp-2">
            &quot;{reminderText}&quot;
          </p>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSettle} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Amount Paid ($)
            </label>
            <input
              type="number"
              step="0.01"
              required
              min="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-semibold text-lg focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Payment Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Venmo, Cash, Bank Transfer"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || paymentAmount <= 0}
              className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Paid</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
