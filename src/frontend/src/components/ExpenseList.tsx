import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Printer,
  Receipt,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Expense } from "../backend.d";
import {
  useDeleteExpense,
  useGetAllExpenses,
  useGetProfile,
} from "../hooks/useQueries";
import { formatDate } from "../utils/formatting";
import { downloadAsPDF, printElement } from "../utils/printUtils";
import { ExpensePrintView } from "./ExpensePrintView";
import { ExpenseViewDialog } from "./ExpenseViewDialog";

type ExpenseWithSignature = Expense & { signatureUrl?: string };

interface ExpenseListProps {
  onCreateExpense: () => void;
  onEditExpense: (expense: ExpenseWithSignature) => void;
}

const paymentTypeColors: Record<string, string> = {
  upi: "bg-emerald-100 text-emerald-800",
  cash: "bg-amber-100 text-amber-800",
  card: "bg-blue-100 text-blue-800",
  "net banking": "bg-purple-100 text-purple-800",
  cheque: "bg-gray-100 text-gray-800",
  emi: "bg-orange-100 text-orange-800",
};

export function ExpenseList({
  onCreateExpense,
  onEditExpense,
}: ExpenseListProps) {
  const { data: expenses, isLoading } = useGetAllExpenses();
  const { data: profile = null } = useGetProfile();
  const deleteExpense = useDeleteExpense();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [printExpense, setPrintExpense] = useState<ExpenseWithSignature | null>(
    null,
  );
  const [viewExpense, setViewExpense] = useState<ExpenseWithSignature | null>(
    null,
  );

  const handlePrint = (expense: ExpenseWithSignature) => {
    setPrintExpense(expense);
    setTimeout(() => {
      printElement("expense-print-area");
      setTimeout(() => setPrintExpense(null), 1200);
    }, 150);
  };

  const handleDownload = (expense: ExpenseWithSignature) => {
    setPrintExpense(expense);
    setTimeout(() => {
      downloadAsPDF("expense-print-area", `Expense-${expense.id}`);
      setTimeout(() => setPrintExpense(null), 1200);
    }, 150);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteExpense.mutateAsync(deleteTarget);
      toast.success("Expense deleted");
    } catch {
      toast.error("Failed to delete expense");
    }
    setDeleteTarget(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {["s1", "s2", "s3", "s4", "s5"].map((k) => (
          <Skeleton key={k} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-primary">
              Expenses
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {expenses?.length || 0} expense
              {(expenses?.length || 0) !== 1 ? "s" : ""} total
            </p>
          </div>
          <Button
            onClick={onCreateExpense}
            className="bg-navy hover:bg-navy-light text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Expense
          </Button>
        </div>

        {/* Summary Cards */}
        {expenses && expenses.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["UPI", "Cash", "Card", "Other"].map((type) => {
              const typeExpenses = expenses.filter((e) =>
                type === "Other"
                  ? !["upi", "cash", "card"].includes(
                      e.paymentType.toLowerCase(),
                    )
                  : e.paymentType.toLowerCase() === type.toLowerCase(),
              );
              const total = typeExpenses.reduce(
                (sum, e) => sum + Number(e.amount),
                0,
              );
              if (total === 0 && type === "Other") return null;
              return (
                <div
                  key={type}
                  className="rounded-lg border border-border p-3 bg-card"
                >
                  <div className="text-xs text-muted-foreground">
                    {type} Payments
                  </div>
                  <div className="text-lg font-display font-bold text-primary">
                    ₹{total.toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {typeExpenses.length} entries
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Table */}
        {!expenses || expenses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold text-lg text-foreground">
              No expenses recorded
            </h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Start tracking your business expenses
            </p>
            <Button
              onClick={onCreateExpense}
              className="bg-navy hover:bg-navy-light text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Expense
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg border border-border overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold text-foreground">
                    Expense No.
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Category
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Date
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Payment Type
                  </TableHead>
                  <TableHead className="font-semibold text-foreground text-right">
                    Amount
                  </TableHead>
                  <TableHead className="font-semibold text-foreground text-center">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {expenses.map((expense, idx) => (
                    <motion.tr
                      key={expense.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <span className="font-mono font-semibold text-primary">
                          {expense.id}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {expense.category}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(expense.expenseDate)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            paymentTypeColors[
                              expense.paymentType.toLowerCase()
                            ] || "bg-gray-100 text-gray-800"
                          }
                          variant="outline"
                        >
                          {expense.paymentType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        ₹
                        {Number(expense.amount).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewExpense(expense)}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onEditExpense(expense)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handlePrint(expense)}
                            title="Print"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDownload(expense)}
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteTarget(expense.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </motion.div>
        )}
      </div>

      {/* Print Area - hidden from screen, used for print/download */}
      <div
        id="expense-print-area"
        style={{ display: "none" }}
        aria-hidden="true"
      >
        {printExpense && (
          <ExpensePrintView expense={printExpense} profile={profile} />
        )}
      </div>

      {/* View Dialog */}
      {viewExpense && (
        <ExpenseViewDialog
          expense={viewExpense}
          onClose={() => setViewExpense(null)}
          onEdit={() => {
            onEditExpense(viewExpense);
            setViewExpense(null);
          }}
          onPrint={() => handlePrint(viewExpense)}
          onDownload={() => handleDownload(viewExpense)}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete expense {deleteTarget}. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
