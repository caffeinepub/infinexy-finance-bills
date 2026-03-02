import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TaxRate {
    id: bigint;
    cgst: bigint;
    igst: bigint;
    name: string;
    sgst: bigint;
    percentage: bigint;
}
export interface InvoiceItem {
    sellingPrice: bigint;
    productName: string;
    imageUrl?: string;
    quantity: bigint;
    taxRateId: bigint;
}
export interface ExpenseCategory {
    id: string;
    name: string;
}
export interface Invoice {
    id: string;
    customerName: string;
    taxRates: Array<TaxRate>;
    invoiceDate: string;
    signatureUrl?: string;
    notes?: string;
    placeOfSupply: string;
    items: Array<InvoiceItem>;
    copyType: string;
}
export interface Expense {
    id: string;
    expenseDate: string;
    notes?: string;
    paymentDate: string;
    category: string;
    paymentType: string;
    placeOfSupply: string;
    amount: bigint;
}
export interface UserProfile {
    pan: string;
    email: string;
    website: string;
    gstin: string;
    companyName: string;
    mobile: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addExpenseCategory(category: ExpenseCategory): Promise<void>;
    addTaxRate(rate: TaxRate): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createExpense(expense: Expense): Promise<Expense>;
    createInvoice(invoice: Invoice): Promise<Invoice>;
    deleteExpense(id: string): Promise<void>;
    deleteInvoice(id: string): Promise<void>;
    getAllExpenses(): Promise<Array<Expense>>;
    getAllInvoices(): Promise<Array<Invoice>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getExpense(id: string): Promise<Expense | null>;
    getExpenseCategories(): Promise<Array<ExpenseCategory>>;
    getInvoice(id: string): Promise<Invoice | null>;
    getProfile(): Promise<UserProfile | null>;
    getTaxRates(): Promise<Array<TaxRate>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateExpense(expense: Expense): Promise<void>;
    updateInvoice(invoice: Invoice): Promise<void>;
    updateProfile(profile: UserProfile): Promise<void>;
}
