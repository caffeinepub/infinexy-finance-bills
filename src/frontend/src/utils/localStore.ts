/**
 * Local storage-based data store for invoices, expenses, tax rates, categories, and profile.
 * This allows the app to work without Internet Identity authentication.
 */

import type {
  Expense,
  ExpenseCategory,
  Invoice,
  TaxRate,
  UserProfile,
} from "../backend.d";

const KEYS = {
  invoices: "infinexy_invoices",
  expenses: "infinexy_expenses",
  taxRates: "infinexy_tax_rates",
  expenseCategories: "infinexy_expense_categories",
  profile: "infinexy_profile",
  nextInvoiceNum: "infinexy_next_invoice_num",
  nextExpenseNum: "infinexy_next_expense_num",
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

function formatSerial(prefix: string, num: number): string {
  return `${prefix}-${String(num).padStart(4, "0")}`;
}

// ── Raw stored types (BigInt serialized as string) ──────────────────────────

type SerializedTaxRate = {
  id: string;
  name: string;
  percentage: string;
  cgst: string;
  sgst: string;
  igst: string;
};

type SerializedInvoiceItem = {
  productName: string;
  sellingPrice: string;
  quantity: string;
  taxRateId: string;
  imageUrl?: string;
};

type SerializedInvoice = {
  id: string;
  customerName: string;
  invoiceDate: string;
  placeOfSupply: string;
  copyType: string;
  signatureUrl?: string;
  notes?: string;
  items: SerializedInvoiceItem[];
  taxRates: SerializedTaxRate[];
};

type SerializedExpense = {
  id: string;
  amount: string;
  expenseDate: string;
  category: string;
  paymentType: string;
  paymentDate: string;
  notes?: string;
  placeOfSupply: string;
};

// ── Default tax rates (GST slabs) ────────────────────────────────────────────
// percentages stored as integer * 100 (so 2.5% = 250, 9% = 900)

const DEFAULT_TAX_RATES: SerializedTaxRate[] = [
  { id: "1", name: "GST 0%", percentage: "0", cgst: "0", sgst: "0", igst: "0" },
  {
    id: "2",
    name: "GST 5%",
    percentage: "500",
    cgst: "250",
    sgst: "250",
    igst: "500",
  },
  {
    id: "3",
    name: "GST 18%",
    percentage: "1800",
    cgst: "900",
    sgst: "900",
    igst: "1800",
  },
  {
    id: "4",
    name: "GST 40%",
    percentage: "4000",
    cgst: "2000",
    sgst: "2000",
    igst: "4000",
  },
];

// ── Serialization helpers ────────────────────────────────────────────────────

function serializeTaxRate(r: TaxRate): SerializedTaxRate {
  // Store as integer * 100 to preserve decimal percentages (e.g. 2.5% stored as "250")
  return {
    id: String(r.id),
    name: r.name,
    percentage: String(r.percentage),
    cgst: String(r.cgst),
    sgst: String(r.sgst),
    igst: String(r.igst),
  };
}

function deserializeTaxRate(r: SerializedTaxRate): TaxRate {
  // percentages are stored as integer * 100 to support decimals (e.g. 2.5% → "250")
  // parseFloat handles any format, then we round to get a safe integer for BigInt
  const parseStoredPct = (val: string): bigint => {
    return BigInt(Math.round(Number.parseFloat(val)));
  };
  return {
    id: BigInt(r.id),
    name: r.name,
    percentage: parseStoredPct(r.percentage),
    cgst: parseStoredPct(r.cgst),
    sgst: parseStoredPct(r.sgst),
    igst: parseStoredPct(r.igst),
  };
}

function serializeInvoice(inv: Invoice): SerializedInvoice {
  return {
    id: inv.id,
    customerName: inv.customerName,
    invoiceDate: inv.invoiceDate,
    placeOfSupply: inv.placeOfSupply,
    copyType: inv.copyType,
    signatureUrl: inv.signatureUrl,
    notes: inv.notes,
    items: inv.items.map((item) => ({
      productName: item.productName,
      sellingPrice: String(item.sellingPrice),
      quantity: String(item.quantity),
      taxRateId: String(item.taxRateId),
      imageUrl: item.imageUrl,
    })),
    taxRates: inv.taxRates.map(serializeTaxRate),
  };
}

function deserializeInvoice(inv: SerializedInvoice): Invoice {
  return {
    id: inv.id,
    customerName: inv.customerName,
    invoiceDate: inv.invoiceDate,
    placeOfSupply: inv.placeOfSupply,
    copyType: inv.copyType,
    signatureUrl: inv.signatureUrl,
    notes: inv.notes,
    items: inv.items.map((item) => ({
      productName: item.productName,
      sellingPrice: BigInt(item.sellingPrice),
      quantity: BigInt(item.quantity),
      taxRateId: BigInt(item.taxRateId),
      imageUrl: item.imageUrl,
    })),
    taxRates: inv.taxRates.map(deserializeTaxRate),
  };
}

function serializeExpense(exp: Expense): SerializedExpense {
  return {
    id: exp.id,
    amount: String(exp.amount),
    expenseDate: exp.expenseDate,
    category: exp.category,
    paymentType: exp.paymentType,
    paymentDate: exp.paymentDate,
    notes: exp.notes,
    placeOfSupply: exp.placeOfSupply,
  };
}

function deserializeExpense(exp: SerializedExpense): Expense {
  return {
    id: exp.id,
    amount: BigInt(exp.amount),
    expenseDate: exp.expenseDate,
    category: exp.category,
    paymentType: exp.paymentType,
    paymentDate: exp.paymentDate,
    notes: exp.notes,
    placeOfSupply: exp.placeOfSupply,
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

export const localStore = {
  // ── Invoices ──────────────────────────────────────────────────────────────

  getAllInvoices(): Invoice[] {
    const raw = load<SerializedInvoice[]>(KEYS.invoices, []);
    return raw.map(deserializeInvoice).sort((a, b) => a.id.localeCompare(b.id));
  },

  getInvoice(id: string): Invoice | null {
    const all = this.getAllInvoices();
    return all.find((inv) => inv.id === id) ?? null;
  },

  createInvoice(invoice: Invoice): Invoice {
    const num = load<number>(KEYS.nextInvoiceNum, 1);
    const id = formatSerial("INV", num);
    save(KEYS.nextInvoiceNum, num + 1);

    const newInvoice: Invoice = { ...invoice, id };
    const all = load<SerializedInvoice[]>(KEYS.invoices, []);
    all.push(serializeInvoice(newInvoice));
    save(KEYS.invoices, all);
    return newInvoice;
  },

  updateInvoice(invoice: Invoice): void {
    const all = load<SerializedInvoice[]>(KEYS.invoices, []);
    const idx = all.findIndex((inv) => inv.id === invoice.id);
    if (idx >= 0) {
      all[idx] = serializeInvoice(invoice);
    } else {
      all.push(serializeInvoice(invoice));
    }
    save(KEYS.invoices, all);
  },

  deleteInvoice(id: string): void {
    const all = load<SerializedInvoice[]>(KEYS.invoices, []);
    save(
      KEYS.invoices,
      all.filter((inv) => inv.id !== id),
    );
  },

  // ── Expenses ──────────────────────────────────────────────────────────────

  getAllExpenses(): Expense[] {
    const raw = load<SerializedExpense[]>(KEYS.expenses, []);
    return raw.map(deserializeExpense).sort((a, b) => a.id.localeCompare(b.id));
  },

  getExpense(id: string): Expense | null {
    const all = this.getAllExpenses();
    return all.find((exp) => exp.id === id) ?? null;
  },

  createExpense(expense: Expense): Expense {
    const num = load<number>(KEYS.nextExpenseNum, 1);
    const id = formatSerial("EXP", num);
    save(KEYS.nextExpenseNum, num + 1);

    const newExpense: Expense = { ...expense, id };
    const all = load<SerializedExpense[]>(KEYS.expenses, []);
    all.push(serializeExpense(newExpense));
    save(KEYS.expenses, all);
    return newExpense;
  },

  updateExpense(expense: Expense): void {
    const all = load<SerializedExpense[]>(KEYS.expenses, []);
    const idx = all.findIndex((exp) => exp.id === expense.id);
    if (idx >= 0) {
      all[idx] = serializeExpense(expense);
    } else {
      all.push(serializeExpense(expense));
    }
    save(KEYS.expenses, all);
  },

  deleteExpense(id: string): void {
    const all = load<SerializedExpense[]>(KEYS.expenses, []);
    save(
      KEYS.expenses,
      all.filter((exp) => exp.id !== id),
    );
  },

  // ── Tax Rates ──────────────────────────────────────────────────────────────

  getTaxRates(): TaxRate[] {
    const stored = load<SerializedTaxRate[] | null>(KEYS.taxRates, null);
    // If nothing stored yet, seed defaults and return them
    if (!stored || stored.length === 0) {
      save(KEYS.taxRates, DEFAULT_TAX_RATES);
      return DEFAULT_TAX_RATES.map(deserializeTaxRate);
    }
    return stored.map(deserializeTaxRate);
  },

  addTaxRate(rate: TaxRate): void {
    // Ensure we have defaults loaded first
    const existing = load<SerializedTaxRate[] | null>(KEYS.taxRates, null);
    const all =
      existing && existing.length > 0 ? existing : [...DEFAULT_TAX_RATES];
    // Store percentage*100 so 2.5% input (as 250n) is stored as "250"
    all.push(serializeTaxRate(rate));
    save(KEYS.taxRates, all);
  },

  // ── Expense Categories ────────────────────────────────────────────────────

  getExpenseCategories(): ExpenseCategory[] {
    return load<ExpenseCategory[]>(KEYS.expenseCategories, []);
  },

  addExpenseCategory(category: ExpenseCategory): void {
    const all = load<ExpenseCategory[]>(KEYS.expenseCategories, []);
    all.push(category);
    save(KEYS.expenseCategories, all);
  },

  // ── Profile ───────────────────────────────────────────────────────────────

  getProfile(): UserProfile | null {
    return load<UserProfile | null>(KEYS.profile, null);
  },

  updateProfile(profile: UserProfile): void {
    save(KEYS.profile, profile);
  },
};
