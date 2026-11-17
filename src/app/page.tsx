"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  CheckCircle,
  PlusCircle,
  DollarSign,
  ArrowRight,
  Receipt,
  UserCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import SettleModal from "@/components/SettleModal";

interface FriendSummary {
  id: string;
  name: string;
  balance: number;
  totalOwed: number;
  totalPaid: number;
  unsettledSplitsCount: number;
}

export default function DashboardPage() {
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [settlingFriend, setSettlingFriend] = useState<FriendSummary | null>(null);

  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/friends");
      if (res.ok) {
        const data = await res.json();
        setFriends(data);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const totalOutstanding = friends.reduce((acc, f) => acc + f.balance, 0);
  const friendsOwing = friends.filter((f) => f.balance > 0);
  const totalSettled = friends.reduce((acc, f) => acc + f.totalPaid, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            See who owes you money, which items they owe for, and settle up.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/expenses/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-lg shadow-emerald-500/20 active:scale-95 text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Split New Purchase</span>
          </Link>
          <Link
            href="/friends"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition border border-slate-700 active:scale-95 text-sm"
          >
            <Users className="w-4 h-4" />
            <span>Friends</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total To Collect
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white">
              {formatCurrency(totalOutstanding)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Owed by {friendsOwing.length} {friendsOwing.length === 1 ? "friend" : "friends"}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Paid Back
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white">
              {formatCurrency(totalSettled)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">All recorded repayments</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Friends
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white">
              {friends.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {friendsOwing.length} with pending balances
          </p>
        </div>
      </div>

      {/* Friends Balance Ledger */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Who Owes You</h2>
          </div>
          {friends.length > 0 && (
            <Link
              href="/friends"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
            >
              <span>Manage friends</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Loading friends & balances...
          </div>
        ) : friends.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">
              No friends added yet
            </h3>
            <p className="text-sm text-slate-400 mb-5">
              Add your friends or scan a receipt to start tracking who owes you what.
            </p>
            <div className="flex gap-3">
              <Link
                href="/friends"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition"
              >
                Add Friend
              </Link>
              <Link
                href="/expenses/new"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-sm font-bold transition shadow-md shadow-emerald-500/20"
              >
                Scan Receipt
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {friends.map((friend) => {
              const hasDebt = friend.balance > 0;

              return (
                <div
                  key={friend.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center font-bold text-base text-slate-200 uppercase shrink-0">
                      {friend.name.substring(0, 2)}
                    </div>
                    <div>
                      <Link
                        href={`/friends/${friend.id}`}
                        className="font-semibold text-white hover:text-emerald-400 transition flex items-center gap-1.5"
                      >
                        <span>{friend.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400" />
                      </Link>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span>
                          {friend.unsettledSplitsCount}{" "}
                          {friend.unsettledSplitsCount === 1 ? "item unpaid" : "items unpaid"}
                        </span>
                        {friend.totalPaid > 0 && (
                          <span className="text-indigo-400">
                            • {formatCurrency(friend.totalPaid)} total repaid
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          hasDebt ? "text-emerald-400" : "text-slate-500"
                        }`}
                      >
                        {formatCurrency(friend.balance)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {hasDebt ? "amount to pay" : "all settled up"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/friends/${friend.id}`}
                        className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition text-xs font-medium border border-slate-700"
                        title="View item breakdown"
                      >
                        <Receipt className="w-4 h-4" />
                      </Link>

                      {hasDebt && (
                        <button
                          type="button"
                          onClick={() => setSettlingFriend(friend)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-semibold text-xs transition flex items-center gap-1.5 active:scale-95"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Paid Back</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settle Modal */}
      {settlingFriend && (
        <SettleModal
          friend={settlingFriend}
          isOpen={Boolean(settlingFriend)}
          onClose={() => setSettlingFriend(null)}
          onSettled={() => {
            fetchFriends();
          }}
        />
      )}
    </div>
  );
}
