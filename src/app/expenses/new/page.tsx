"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Users,
  Check,
  Receipt,
  ArrowRight,
  Loader2,
  Layers,
} from "lucide-react";
import ReceiptScanner from "@/components/ReceiptScanner";
import { formatCurrency } from "@/lib/utils";

interface Friend {
  id: string;
  name: string;
}

interface EditableItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  assignedFriendIds: string[];
}

export default function NewExpensePage() {
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Dining");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [tax, setTax] = useState<number>(0);
  const [tip, setTip] = useState<number>(0);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptRawText, setReceiptRawText] = useState<string | null>(null);

  const [items, setItems] = useState<EditableItem[]>([
    {
      id: "item-1",
      name: "",
      price: 0,
      quantity: 1,
      assignedFriendIds: [],
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddFriendInline, setShowAddFriendInline] = useState(false);
  const [newFriendName, setNewFriendName] = useState("");

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/friends");
      if (res.ok) {
        const data = await res.json();
        setFriends(data);
      }
    } catch (err) {
      console.error("Failed to fetch friends", err);
    }
  };

  const handleQuickAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName.trim()) return;

    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFriendName.trim() }),
      });
      if (res.ok) {
        const created = await res.json();
        setFriends((prev) => [...prev, created]);
        setNewFriendName("");
        setShowAddFriendInline(false);
      }
    } catch (err) {
      console.error("Failed to quick add friend", err);
    }
  };

  const handleScanComplete = (result: {
    storeName?: string;
    total?: number;
    tax?: number;
    tip?: number;
    items: { name: string; price: number; quantity: number }[];
    rawText: string;
    receiptImageBase64?: string;
  }) => {
    if (result.storeName && !title) {
      setTitle(result.storeName);
    }
    if (result.tax) setTax(result.tax);
    if (result.tip) setTip(result.tip);
    if (result.receiptImageBase64) setReceiptImage(result.receiptImageBase64);
    if (result.rawText) setReceiptRawText(result.rawText);

    if (result.items && result.items.length > 0) {
      const convertedItems: EditableItem[] = result.items.map((it, idx) => ({
        id: `scanned-${idx}-${Date.now()}`,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        assignedFriendIds: [],
      }));
      setItems(convertedItems);
    }
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name: "",
        price: 0,
        quantity: 1,
        assignedFriendIds: [],
      },
    ]);
  };

  const updateItem = (
    id: string,
    field: keyof EditableItem,
    value: string | number | string[]
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeItemRow = (id: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const toggleFriendAssignment = (itemId: string, friendId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const exists = item.assignedFriendIds.includes(friendId);
        const nextIds = exists
          ? item.assignedFriendIds.filter((id) => id !== friendId)
          : [...item.assignedFriendIds, friendId];
        return { ...item, assignedFriendIds: nextIds };
      })
    );
  };

  const assignAllFriendsToItem = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const allIds = friends.map((f) => f.id);
        const hasAll = item.assignedFriendIds.length === allIds.length;
        return {
          ...item,
          assignedFriendIds: hasAll ? [] : allIds,
        };
      })
    );
  };

  // Calculations
  const subtotal = items.reduce(
    (acc, it) => acc + (Number(it.price) || 0) * (it.quantity || 1),
    0
  );
  const extraTotal = (Number(tax) || 0) + (Number(tip) || 0);
  const grandTotal = subtotal + extraTotal;

  // Breakdown of how much each friend owes from current inputs
  const friendOwedBreakdown: Record<string, number> = {};
  const extraRatio = subtotal > 0 ? extraTotal / subtotal : 0;

  for (const item of items) {
    const itemTotal = (Number(item.price) || 0) * (item.quantity || 1);
    if (item.assignedFriendIds.length > 0) {
      const perFriend =
        (itemTotal + itemTotal * extraRatio) / item.assignedFriendIds.length;
      for (const fId of item.assignedFriendIds) {
        friendOwedBreakdown[fId] = (friendOwedBreakdown[fId] || 0) + perFriend;
      }
    }
  }

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please give this expense a title (e.g. Olive Garden Dinner).");
      return;
    }

    const validItems = items.filter(
      (it) => it.name.trim().length > 0 && it.price > 0
    );

    if (validItems.length === 0) {
      alert("Please add at least one item with a valid name and price.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          date,
          tax: Number(tax) || 0,
          tip: Number(tip) || 0,
          totalAmount: grandTotal,
          receiptRawText,
          receiptUrl: receiptImage,
          items: validItems,
        }),
      });

      if (res.ok) {
        router.push("/");
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || "Failed to save expense"}`);
      }
    } catch (err) {
      console.error("Failed to submit expense:", err);
      alert("Failed to submit expense. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Split an Expense</h1>
        <p className="text-sm text-slate-400 mt-1">
          Scan a receipt or type items manually, assign which friends owe for what, and we calculate tax & tip splits automatically.
        </p>
      </div>

      {/* Step 1: Scanner */}
      <ReceiptScanner onScanComplete={handleScanComplete} />

      {/* Step 2: Expense Info & Item Matrix */}
      <form onSubmit={handleSubmitExpense} className="space-y-8">
        {/* Basic Metadata */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <span>Expense Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Where did you buy this? / Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Costco Grocery Run, Sushi Dinner, Airbnb"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-medium focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Itemized Split Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <span>Line Items & Friend Assignments</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Click a friend&apos;s badge to toggle who is splitting each item.
              </p>
            </div>

            {/* Quick Add Friend Button */}
            <div className="flex items-center gap-2">
              {!showAddFriendInline ? (
                <button
                  type="button"
                  onClick={() => setShowAddFriendInline(true)}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 p-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Friend</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newFriendName}
                    onChange={(e) => setNewFriendName(e.target.value)}
                    placeholder="Friend name"
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddFriend}
                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddFriendInline(false)}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 w-5">
                    #{index + 1}
                  </span>

                  <input
                    type="text"
                    placeholder="Item name (e.g. Burger, Wine, Fries)"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, "name", e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm font-medium focus:outline-none focus:border-indigo-500"
                  />

                  <div className="flex items-center gap-1 w-28 shrink-0">
                    <span className="text-slate-500 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={item.price || ""}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "price",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-sm font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItemRow(item.id)}
                    disabled={items.length === 1}
                    className="p-2 text-slate-500 hover:text-rose-400 disabled:opacity-30 transition rounded-lg"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Friend Assignment Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-900">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-500" />
                    Split with:
                  </span>

                  {friends.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">
                      No friends yet. Click &quot;+ Add Friend&quot; above!
                    </span>
                  ) : (
                    <>
                      {friends.map((friend) => {
                        const isAssigned = item.assignedFriendIds.includes(
                          friend.id
                        );
                        return (
                          <button
                            key={friend.id}
                            type="button"
                            onClick={() =>
                              toggleFriendAssignment(item.id, friend.id)
                            }
                            className={`px-3 py-1 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
                              isAssigned
                                ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                                : "bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200"
                            }`}
                          >
                            {isAssigned && <Check className="w-3 h-3" />}
                            <span>{friend.name}</span>
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => assignAllFriendsToItem(item.id)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium underline ml-2"
                      >
                        {item.assignedFriendIds.length === friends.length
                          ? "Clear"
                          : "Split all"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addItemRow}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Item</span>
            </button>
          </div>

          {/* Tax & Tip Additions */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Tax ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={tax || ""}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-sm font-semibold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Split proportionally across everyone&apos;s items
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Tip ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={tip || ""}
                onChange={(e) => setTip(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-sm font-semibold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Added to everyone&apos;s total proportionally
              </span>
            </div>
          </div>
        </div>

        {/* Step 4: Summary Card & Friend Owed Preview */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center justify-between">
            <span>Split Summary</span>
            <span className="text-xl font-extrabold text-emerald-400">
              Total: {formatCurrency(grandTotal)}
            </span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal:</span>
                <span className="text-white font-semibold">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tax:</span>
                <span className="text-white font-semibold">
                  {formatCurrency(tax)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tip:</span>
                <span className="text-white font-semibold">
                  {formatCurrency(tip)}
                </span>
              </div>
            </div>

            {/* Friend owed live calculation */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
              <span className="font-semibold text-slate-300 block mb-2">
                Who will owe what:
              </span>
              {Object.keys(friendOwedBreakdown).length === 0 ? (
                <div className="text-slate-500 italic">
                  No friends assigned to items yet.
                </div>
              ) : (
                Object.entries(friendOwedBreakdown).map(([fId, share]) => {
                  const friend = friends.find((f) => f.id === fId);
                  if (!friend) return null;
                  return (
                    <div
                      key={fId}
                      className="flex justify-between items-center text-slate-300"
                    >
                      <span className="font-medium">{friend.name}:</span>
                      <span className="font-bold text-emerald-400">
                        {formatCurrency(share)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || grandTotal <= 0}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 font-extrabold text-base transition shadow-xl shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Save & Record Expense</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
