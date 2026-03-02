import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Expense,
  ExpenseCategory,
  Invoice,
  TaxRate,
  UserProfile,
} from "../backend.d";
import { localStore } from "../utils/localStore";

// ─── Invoices ───────────────────────────────────────────────────────────────

export function useGetAllInvoices() {
  return useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: async () => {
      return localStore.getAllInvoices();
    },
  });
}

export function useGetInvoice(id: string) {
  return useQuery<Invoice | null>({
    queryKey: ["invoice", id],
    queryFn: async () => {
      if (!id) return null;
      return localStore.getInvoice(id);
    },
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoice: Invoice) => {
      return localStore.createInvoice(invoice);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoice: Invoice) => {
      localStore.updateInvoice(invoice);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", variables.id] });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      localStore.deleteInvoice(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

// ─── Expenses ───────────────────────────────────────────────────────────────

export function useGetAllExpenses() {
  return useQuery<Expense[]>({
    queryKey: ["expenses"],
    queryFn: async () => {
      return localStore.getAllExpenses();
    },
  });
}

export function useGetExpense(id: string) {
  return useQuery<Expense | null>({
    queryKey: ["expense", id],
    queryFn: async () => {
      if (!id) return null;
      return localStore.getExpense(id);
    },
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expense: Expense) => {
      return localStore.createExpense(expense);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expense: Expense) => {
      localStore.updateExpense(expense);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense", variables.id] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      localStore.deleteExpense(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

// ─── Tax Rates ───────────────────────────────────────────────────────────────

export function useGetTaxRates() {
  return useQuery<TaxRate[]>({
    queryKey: ["taxRates"],
    queryFn: async () => {
      return localStore.getTaxRates();
    },
  });
}

export function useAddTaxRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rate: TaxRate) => {
      localStore.addTaxRate(rate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxRates"] });
    },
  });
}

// ─── Expense Categories ──────────────────────────────────────────────────────

export function useGetExpenseCategories() {
  return useQuery<ExpenseCategory[]>({
    queryKey: ["expenseCategories"],
    queryFn: async () => {
      return localStore.getExpenseCategories();
    },
  });
}

export function useAddExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: ExpenseCategory) => {
      localStore.addExpenseCategory(category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenseCategories"] });
    },
  });
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export function useGetProfile() {
  return useQuery<UserProfile | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      return localStore.getProfile();
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      localStore.updateProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
