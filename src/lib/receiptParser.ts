/**
 * Parser for raw OCR text from receipts.
 * Extracts line items, prices, tax, tip, and total.
 */
export interface ExtractedReceiptData {
  storeName?: string;
  total?: number;
  tax?: number;
  tip?: number;
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];
}

export function parseReceiptText(text: string): ExtractedReceiptData {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const items: { name: string; price: number; quantity: number }[] = [];
  let total: number | undefined;
  let tax: number | undefined;
  let tip: number | undefined;
  let storeName: string | undefined;

  // First non-empty header line is often store name
  if (lines.length > 0 && !lines[0].match(/\d{2,}/)) {
    storeName = lines[0].replace(/[^a-zA-Z0-9\s&'-]/g, "").trim();
  }

  const ignoreWords = [
    "subtotal",
    "total",
    "tax",
    "tip",
    "gratuity",
    "balance",
    "amount due",
    "cash",
    "visa",
    "mastercard",
    "amex",
    "change",
    "card",
    "debit",
    "credit",
    "tendered",
    "thank you",
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Look for Tax
    if (lower.includes("tax") || lower.includes("vat")) {
      const match = line.match(/\$?(\d+[.,]\d{2})/);
      if (match) {
        tax = parseFloat(match[1].replace(",", "."));
      }
      continue;
    }

    // Look for Tip / Gratuity
    if (lower.includes("tip") || lower.includes("gratuity")) {
      const match = line.match(/\$?(\d+[.,]\d{2})/);
      if (match) {
        tip = parseFloat(match[1].replace(",", "."));
      }
      continue;
    }

    // Look for Total
    if (
      (lower.includes("total") || lower.includes("balance due") || lower.includes("amount due")) &&
      !lower.includes("subtotal")
    ) {
      const match = line.match(/\$?(\d+[.,]\d{2})/);
      if (match) {
        total = parseFloat(match[1].replace(",", "."));
      }
      continue;
    }

    // Skip generic lines
    if (ignoreWords.some((w) => lower.startsWith(w) || lower === w)) {
      continue;
    }

    // Check if line contains an item and price (e.g., "Burger 12.99" or "2x Coffee 4.50")
    // Match line pattern: [qty] [name] [price]
    const matches = Array.from(line.matchAll(/(\d+[.,]\d{2})/g));
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      const priceStr = lastMatch[0].replace(",", ".");
      const price = parseFloat(priceStr);

      if (!isNaN(price) && price > 0) {
        // Strip out the price part to get the name
        let name = line.substring(0, lastMatch.index).trim();
        // Remove trailing dollar or currency symbols
        name = name.replace(/[$€£]/g, "").trim();

        // Check for quantity multiplier e.g. "2x" or "2 @"
        let quantity = 1;
        const qtyMatch = name.match(/^(\d+)\s*[xX@]\s*(.*)$/);
        if (qtyMatch) {
          quantity = parseInt(qtyMatch[1], 10);
          name = qtyMatch[2].trim();
        }

        // Clean up weird OCR chars
        name = name.replace(/^[-_.*#]+\s*/, "").trim();

        if (name.length >= 2) {
          items.push({
            name,
            price: Number((price / quantity).toFixed(2)),
            quantity: quantity || 1,
          });
        }
      }
    }
  }

  // Fallback total calculation if not detected directly
  if (!total && items.length > 0) {
    const itemsSum = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
    total = Number((itemsSum + (tax || 0) + (tip || 0)).toFixed(2));
  }

  return {
    storeName,
    total,
    tax,
    tip,
    items,
  };
}
