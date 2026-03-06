import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Download, Pencil, Printer, X } from "lucide-react";
import type { Expense } from "../backend.d";
import { formatDate } from "../utils/formatting";

type ExpenseWithSignature = Expense & { signatureUrl?: string };

interface ExpenseViewDialogProps {
  expense: ExpenseWithSignature;
  onClose: () => void;
  onEdit: () => void;
  onPrint: () => void;
  onDownload: () => void;
}

export function ExpenseViewDialog({
  expense,
  onClose,
  onEdit,
  onPrint,
  onDownload,
}: ExpenseViewDialogProps) {
  return (
    <Dialog open={true} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-display text-xl text-primary">
              Expense {expense.id}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 -mr-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Company preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
            <img
              src="/assets/generated/infinexy-logo.jpeg"
              alt="Logo"
              className="h-8 w-14 object-contain"
            />
            <div className="font-display font-bold text-base text-primary">
              INFINEXY FINANCE
            </div>
          </div>

          {/* Header info */}
          <div className="flex items-start justify-between">
            <div>
              <div className="text-2xl font-display font-bold text-primary">
                EXPENSE VOUCHER
              </div>
            </div>
            <div className="text-right text-sm space-y-1">
              <div>
                <span className="text-muted-foreground">Expense No: </span>
                <span className="font-mono font-semibold">{expense.id}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Date: </span>
                {formatDate(expense.expenseDate)}
              </div>
              <div>
                <span className="text-muted-foreground">Place of Supply: </span>
                {expense.placeOfSupply || "24-Gujarat"}
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="rounded-lg bg-navy p-4 text-white">
            <div className="text-sm opacity-80">Total Amount</div>
            <div className="text-3xl font-display font-bold">
              ₹
              {Number(expense.amount).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>

          <Separator />

          {/* Details */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">
                Category
              </span>
              <span className="font-semibold">{expense.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">
                Payment Type
              </span>
              <Badge variant="outline" className="font-medium">
                {expense.paymentType}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">
                Expense Date
              </span>
              <span className="font-semibold">
                {formatDate(expense.expenseDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">
                Payment Date
              </span>
              <span className="font-semibold">
                {formatDate(expense.paymentDate)}
              </span>
            </div>
            {expense.notes && (
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground font-medium">Notes</span>
                <span className="bg-muted/40 rounded p-2 text-foreground">
                  {expense.notes}
                </span>
              </div>
            )}
            {expense.signatureUrl && (
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground font-medium">
                  Signature
                </span>
                <img
                  src={expense.signatureUrl}
                  alt="Signature"
                  className="h-16 max-w-48 object-contain border border-border rounded bg-white"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={onPrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button
            onClick={onDownload}
            className="bg-navy hover:bg-navy-light text-white"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
