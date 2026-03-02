import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Download,
  Loader2,
  Plus,
  Printer,
  Save,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Expense } from "../backend.d";
import {
  useAddExpenseCategory,
  useCreateExpense,
  useGetExpenseCategories,
  useGetProfile,
  useUpdateExpense,
} from "../hooks/useQueries";
import { getTodayDate } from "../utils/formatting";
import { printElement } from "../utils/printUtils";
import { ExpensePrintView } from "./ExpensePrintView";

const PAYMENT_TYPES = ["UPI", "Cash", "Card", "Net Banking", "Cheque", "EMI"];

interface CreateExpenseProps {
  editExpense?: Expense | null;
  onBack: () => void;
}

export function CreateExpense({ editExpense, onBack }: CreateExpenseProps) {
  const { data: categories = [] } = useGetExpenseCategories();
  const { data: profile = null } = useGetProfile();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const addCategory = useAddExpenseCategory();

  const isEditing = !!editExpense;

  const [amount, setAmount] = useState(
    editExpense ? String(Number(editExpense.amount)) : "",
  );
  const [expenseDate, setExpenseDate] = useState(
    editExpense?.expenseDate || getTodayDate(),
  );
  const [category, setCategory] = useState(editExpense?.category || "");
  const [paymentType, setPaymentType] = useState(
    editExpense?.paymentType || "UPI",
  );
  const [paymentDate, setPaymentDate] = useState(
    editExpense?.paymentDate || getTodayDate(),
  );
  const [notes, setNotes] = useState(editExpense?.notes || "");
  const [placeOfSupply] = useState(editExpense?.placeOfSupply || "24-Gujarat");

  // Add category dialog
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Print state
  const [printExpenseData, setPrintExpenseData] = useState<Expense | null>(
    null,
  );

  const validate = () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      toast.error("Please enter a valid expense amount");
      return false;
    }
    if (!expenseDate) {
      toast.error("Please select an expense date");
      return false;
    }
    if (!category) {
      toast.error("Please select a category");
      return false;
    }
    if (!paymentType) {
      toast.error("Please select a payment type");
      return false;
    }
    if (!paymentDate) {
      toast.error("Please select a payment date");
      return false;
    }
    return true;
  };

  const buildPayload = (): Expense => {
    return {
      id: editExpense?.id || "",
      amount: BigInt(Math.round(Number.parseFloat(amount))),
      expenseDate,
      category,
      paymentType,
      paymentDate,
      notes: notes || undefined,
      placeOfSupply,
    };
  };

  const handleSave = async (andPrint = false, andDownload = false) => {
    if (!validate()) return;

    try {
      const payload = buildPayload();
      let savedExpense: Expense;

      if (isEditing) {
        await updateExpense.mutateAsync(payload);
        savedExpense = payload;
        toast.success("Expense updated successfully");
      } else {
        savedExpense = await createExpense.mutateAsync(payload);
        toast.success("Expense saved successfully");
      }

      if (andPrint || andDownload) {
        setPrintExpenseData({
          ...savedExpense,
          id: savedExpense.id || payload.id,
        });
        const originalTitle = document.title;
        if (andDownload) {
          document.title = `Expense-${savedExpense.id}`;
        }
        setTimeout(() => {
          printElement("expense-create-print-area");
          if (andDownload) document.title = originalTitle;
          setPrintExpenseData(null);
        }, 100);
      }

      if (!andPrint && !andDownload) {
        onBack();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save expense. Please try again.");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }
    try {
      const newId = `cat-${Date.now()}`;
      await addCategory.mutateAsync({
        id: newId,
        name: newCategoryName.trim(),
      });
      toast.success("Category added");
      setCategory(newCategoryName.trim());
      setShowAddCategory(false);
      setNewCategoryName("");
    } catch {
      toast.error("Failed to add category");
    }
  };

  const isPending = createExpense.isPending || updateExpense.isPending;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-display font-bold text-primary">
            {isEditing ? "Edit Expense" : "Create Expense"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Fill in the expense details below
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Main form */}
        <div className="rounded-xl border border-border p-6 bg-card space-y-5">
          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-sm font-semibold">
              Expense Amount (₹) <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                ₹
              </span>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-8 text-lg font-semibold"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expense Date */}
            <div className="space-y-1.5">
              <Label htmlFor="expenseDate">
                Expense Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="expenseDate"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>
                  Category <span className="text-destructive">*</span>
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 text-xs text-primary"
                  onClick={() => setShowAddCategory(true)}
                >
                  <Plus className="h-3 w-3" />
                  Add New
                </Button>
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Telephone & Internet Bills">
                    Telephone & Internet Bills
                  </SelectItem>
                  <SelectItem value="Repair & Maintenance">
                    Repair & Maintenance
                  </SelectItem>
                  <SelectItem value="Rent Expenses">Rent Expenses</SelectItem>
                  <SelectItem value="Raw Material">Raw Material</SelectItem>
                  <SelectItem value="Printing and Stationery">
                    Printing and Stationery
                  </SelectItem>
                  <SelectItem value="Employee Salaries & Advances">
                    Employee Salaries & Advances
                  </SelectItem>
                  <SelectItem value="Electricity Bill">
                    Electricity Bill
                  </SelectItem>
                  <SelectItem value="Bank Fee & Charges">
                    Bank Fee & Charges
                  </SelectItem>
                  {categories
                    .filter(
                      (c) =>
                        ![
                          "Telephone & Internet Bills",
                          "Repair & Maintenance",
                          "Rent Expenses",
                          "Raw Material",
                          "Printing and Stationery",
                          "Employee Salaries & Advances",
                          "Electricity Bill",
                          "Bank Fee & Charges",
                        ].includes(c.name),
                    )
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment Type */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Payment Type <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={paymentType}
              onValueChange={setPaymentType}
              className="flex flex-wrap gap-2"
            >
              {PAYMENT_TYPES.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={type}
                    id={`pt-${type}`}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`pt-${type}`}
                    className={`cursor-pointer px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                      paymentType === type
                        ? "bg-navy text-white border-navy"
                        : "bg-background border-border hover:border-primary/50"
                    }`}
                  >
                    {type}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Payment Date */}
          <div className="space-y-1.5">
            <Label htmlFor="paymentDate">
              Payment Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="expenseNotes">Payment Notes (Optional)</Label>
            <Textarea
              id="expenseNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this expense..."
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-between items-center p-4 rounded-xl border border-border bg-card">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleSave(false, false)}
              disabled={isPending}
              className="bg-navy hover:bg-navy-light text-white gap-2"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Expense
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave(true, false)}
              disabled={isPending}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Save & Print
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave(false, true)}
              disabled={isPending}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Print Area */}
      <div id="expense-create-print-area">
        {printExpenseData && (
          <ExpensePrintView expense={printExpenseData} profile={profile} />
        )}
      </div>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Category Name</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Office Supplies"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCategory();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCategory(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCategory}
              disabled={addCategory.isPending}
              className="bg-navy hover:bg-navy-light text-white"
            >
              {addCategory.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
