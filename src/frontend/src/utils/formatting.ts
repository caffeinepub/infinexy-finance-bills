/**
 * Format amount as Indian Rupees
 */
export function formatCurrency(amount: number | bigint): string {
  const num = typeof amount === "bigint" ? Number(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format date string to DD/MM/YYYY
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Get today's date in YYYY-MM-DD format for input[type=date]
 */
export function getTodayDate(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

/**
 * Calculate tax amounts
 */
export function calculateTax(
  price: number,
  qty: number,
  cgstPct: number,
  sgstPct: number,
  igstPct: number,
) {
  const base = price * qty;
  const cgst = (base * cgstPct) / 100;
  const sgst = (base * sgstPct) / 100;
  const igst = (base * igstPct) / 100;
  return { base, cgst, sgst, igst, total: base + cgst + sgst };
}

/**
 * Pad invoice/expense serial number
 */
export function formatSerial(id: string): string {
  return id;
}
