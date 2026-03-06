import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, LogOut, Receipt, Settings } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Expense, Invoice } from "./backend.d";

type ExpenseWithSignature = Expense & { signatureUrl?: string };
import { CreateExpense } from "./components/CreateExpense";
import { CreateInvoice } from "./components/CreateInvoice";
import { ExpenseList } from "./components/ExpenseList";
import { InvoiceList } from "./components/InvoiceList";
import { LoginPage } from "./components/LoginPage";
import { SettingsDialog } from "./components/SettingsDialog";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

const AUTH_KEY = "infinexy_auth_session";

type SalesView = "list" | "create" | "edit";
type ExpensesView = "list" | "create" | "edit";

export default function App() {
  const { identity, loginStatus } = useInternetIdentity();
  const [localAuth, setLocalAuth] = useState<{
    mobile: string;
    name: string;
  } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("sales");

  const [salesView, setSalesView] = useState<SalesView>("list");
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);

  const [expensesView, setExpensesView] = useState<ExpensesView>("list");
  const [editExpense, setEditExpense] = useState<ExpenseWithSignature | null>(
    null,
  );

  // Check local auth on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        setLocalAuth(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    setAuthChecked(true);
  }, []);

  // Internet Identity login also counts as authenticated
  const isAuthenticated =
    !!localAuth ||
    loginStatus === "success" ||
    (identity != null && loginStatus !== "idle");

  const handleLogin = (name: string) => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      setLocalAuth(JSON.parse(stored));
    } else {
      setLocalAuth({ mobile: "", name });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setLocalAuth(null);
  };

  const userName = localAuth?.name || (identity ? "User" : "");

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <Toaster richColors />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster richColors />

      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-navy text-white border-b border-navy-light shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/infinexy-logo.jpeg"
              alt="Infinexy Finance"
              className="h-9 w-12 object-contain"
            />
            <div>
              <div className="font-display font-bold text-lg leading-tight tracking-wide">
                INFINEXY FINANCE
              </div>
              <div className="text-white/60 text-xs leading-tight hidden sm:block">
                401,402 Galav Chamber, Dairy Den, Sayajigunj, Vadodara,
                Gujarat-390005
              </div>
            </div>
          </div>

          <div className="flex-1" />

          {/* User & Actions */}
          <div className="flex items-center gap-2">
            {userName && (
              <span className="text-white/70 text-sm hidden sm:block">
                Hello, {userName}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => setSettingsOpen(true)}
              title="Company Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/10"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v);
            // Reset views when switching tabs
            if (v === "sales") setSalesView("list");
            if (v === "expenses") setExpensesView("list");
          }}
        >
          <TabsList className="h-12 p-1 bg-card border border-border mb-6 w-full sm:w-auto">
            <TabsTrigger
              value="sales"
              className="gap-2 px-6 data-[state=active]:bg-navy data-[state=active]:text-white"
            >
              <FileText className="h-4 w-4" />
              Sales
            </TabsTrigger>
            <TabsTrigger
              value="expenses"
              className="gap-2 px-6 data-[state=active]:bg-navy data-[state=active]:text-white"
            >
              <Receipt className="h-4 w-4" />
              Expenses
            </TabsTrigger>
          </TabsList>

          {/* SALES TAB */}
          <TabsContent value="sales" className="mt-0">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <AnimatePresence mode="wait">
                {salesView === "list" && (
                  <motion.div
                    key="invoice-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <InvoiceList
                      onCreateInvoice={() => {
                        setEditInvoice(null);
                        setSalesView("create");
                      }}
                      onEditInvoice={(invoice) => {
                        setEditInvoice(invoice);
                        setSalesView("edit");
                      }}
                    />
                  </motion.div>
                )}
                {(salesView === "create" || salesView === "edit") && (
                  <motion.div
                    key="invoice-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <CreateInvoice
                      editInvoice={salesView === "edit" ? editInvoice : null}
                      onBack={() => {
                        setSalesView("list");
                        setEditInvoice(null);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          {/* EXPENSES TAB */}
          <TabsContent value="expenses" className="mt-0">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <AnimatePresence mode="wait">
                {expensesView === "list" && (
                  <motion.div
                    key="expense-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <ExpenseList
                      onCreateExpense={() => {
                        setEditExpense(null);
                        setExpensesView("create");
                      }}
                      onEditExpense={(expense) => {
                        setEditExpense(expense);
                        setExpensesView("edit");
                      }}
                    />
                  </motion.div>
                )}
                {(expensesView === "create" || expensesView === "edit") && (
                  <motion.div
                    key="expense-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <CreateExpense
                      editExpense={expensesView === "edit" ? editExpense : null}
                      onBack={() => {
                        setExpensesView("list");
                        setEditExpense(null);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <img
              src="/assets/generated/infinexy-logo.jpeg"
              alt="Logo"
              className="h-5 w-7 object-contain opacity-60"
            />
            <span className="font-display font-semibold text-foreground/60">
              INFINEXY FINANCE
            </span>
          </div>
          <span>
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>

      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
