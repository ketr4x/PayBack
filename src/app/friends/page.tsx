"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  ArrowRight,
  Trash2,
  Phone,
  Mail,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Friend {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  totalOwed: number;
  totalPaid: number;
  balance: number;
  unsettledSplitsCount: number;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/friends");
      if (res.ok) {
        const data = await res.json();
        setFriends(data);
      }
    } catch (err) {
      console.error("Failed to load friends", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, notes }),
      });

      if (res.ok) {
        setName("");
        setPhone("");
        setEmail("");
        setNotes("");
        setShowAddModal(false);
        fetchFriends();
      }
    } catch (err) {
      console.error("Failed to add friend", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFriend = async (id: string, friendName: string) => {
    if (!confirm(`Are you sure you want to remove ${friendName}?`)) return;

    try {
      const res = await fetch(`/api/friends/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchFriends();
      }
    } catch (err) {
      console.error("Failed to delete friend", err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Friends</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage the people you split bills and purchases with.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-lg shadow-emerald-500/20 active:scale-95 text-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Friend</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Loading friends...
          </div>
        ) : friends.length === 0 ? (
          <div className="py-12 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">
              No friends in your list
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Add a friend by name to start assigning items to them.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-xs transition"
            >
              Add First Friend
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 uppercase shrink-0">
                    {friend.name.substring(0, 2)}
                  </div>
                  <div>
                    <Link
                      href={`/friends/${friend.id}`}
                      className="font-semibold text-white hover:text-emerald-400 transition flex items-center gap-1.5"
                    >
                      <span>{friend.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-0.5">
                      {friend.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {friend.phone}
                        </span>
                      )}
                      {friend.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" />
                          {friend.email}
                        </span>
                      )}
                      {friend.unsettledSplitsCount > 0 && (
                        <span className="text-amber-400">
                          {friend.unsettledSplitsCount} pending items
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5">
                  <div className="text-right">
                    <div
                      className={`text-base font-bold ${
                        friend.balance > 0 ? "text-emerald-400" : "text-slate-500"
                      }`}
                    >
                      {formatCurrency(friend.balance)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {friend.balance > 0 ? "owes you" : "settled"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/friends/${friend.id}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                    >
                      View Details
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteFriend(friend.id, friend.name)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition rounded-lg"
                      title="Delete friend"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold text-white mb-1">Add Friend</h3>
            <p className="text-xs text-slate-400 mb-5">
              Add a contact so you can assign receipt items to them.
            </p>

            <form onSubmit={handleAddFriend} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex, Sarah, Dave"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-medium focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 555-0192"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alex@example.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Roommate, Co-worker"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Friend"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
