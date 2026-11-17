export interface FriendSummary {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  notes?: string | null;
  totalOwed: number; // total amount assigned to this friend across unpaid splits
  totalPaid: number; // total payments made by this friend
  balance: number;   // totalOwed - totalPaid (positive means friend owes you)
  unsettledSplitsCount: number;
}

export interface SplitAssignment {
  friendId: string;
  share: number; // exact amount assigned
}

export interface ParsedReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  assignedFriendIds: string[]; // friend IDs splitting this item
}

export interface ReceiptParseResult {
  storeName?: string;
  date?: string;
  total?: number;
  tax?: number;
  tip?: number;
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];
  rawText: string;
}
