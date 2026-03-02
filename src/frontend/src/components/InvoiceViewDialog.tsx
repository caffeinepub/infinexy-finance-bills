import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Pencil, Printer, X } from "lucide-react";
import type { Invoice, TaxRate, UserProfile } from "../backend.d";
import { calculateTax, formatDate } from "../utils/formatting";

interface InvoiceViewDialogProps {
  invoice: Invoice;
  profile: UserProfile | null;
  taxRates: TaxRate[];
  onClose: () => void;
  onEdit: () => void;
  onPrint: () => void;
  onDownload: () => void;
}

export function InvoiceViewDialog({
  invoice,
  profile,
  taxRates,
  onClose,
  onEdit,
  onPrint,
  onDownload,
}: InvoiceViewDialogProps) {
  let subtotal = 0;
  let totalTax = 0;

  const itemsWithCalc = invoice.items.map((item) => {
    const price = Number(item.sellingPrice);
    const qty = Number(item.quantity);
    const taxRate = taxRates.find((t) => t.id === item.taxRateId);
    // cgst/sgst stored as integer*100 (e.g. 250 = 2.5%), divide by 100 for actual pct
    const cgstPct = taxRate ? Number(taxRate.cgst) / 100 : 0;
    const sgstPct = taxRate ? Number(taxRate.sgst) / 100 : 0;
    const calc = calculateTax(price, qty, cgstPct, sgstPct, 0);
    subtotal += calc.base;
    totalTax += calc.cgst + calc.sgst;
    return { ...item, price, qty, calc, taxRate };
  });

  const grandTotal = subtotal + totalTax;

  return (
    <Dialog open={true} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-display text-xl text-primary">
              Invoice {invoice.id}
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

        {/* Company Header Preview */}
        <div className="rounded-lg border border-border p-4 bg-muted/20">
          <div className="flex items-center gap-3 pb-3 mb-3 border-b border-border">
            <img
              src="/assets/generated/infinexy-logo.jpeg"
              alt="Logo"
              className="h-10 w-16 object-contain"
            />
            <div>
              <div className="font-display font-bold text-lg text-primary">
                INFINEXY FINANCE
              </div>
              <div className="text-xs text-muted-foreground space-x-3">
                {profile?.gstin && <span>GSTIN: {profile.gstin}</span>}
                {profile?.mobile && <span>Mobile: {profile.mobile}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-2xl font-display font-bold text-primary">
                INVOICE
              </div>
              <Badge
                className={
                  invoice.copyType === "transport"
                    ? "bg-accent/20 text-accent-foreground mt-1"
                    : "bg-navy/10 text-navy mt-1"
                }
              >
                {invoice.copyType === "transport"
                  ? "Transport Copy"
                  : "Customer Copy"}
              </Badge>
            </div>
            <div className="text-right text-sm space-y-1">
              <div>
                <span className="text-muted-foreground">Invoice No:</span>{" "}
                <span className="font-mono font-semibold">{invoice.id}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Date:</span>{" "}
                {formatDate(invoice.invoiceDate)}
              </div>
              <div>
                <span className="text-muted-foreground">Place of Supply:</span>{" "}
                {invoice.placeOfSupply || "24-Gujarat"}
              </div>
            </div>
          </div>

          <div className="bg-primary/5 rounded p-3 mb-4">
            <div className="text-xs text-muted-foreground">BILL TO</div>
            <div className="font-semibold text-primary">
              {invoice.customerName}
            </div>
          </div>

          {/* Items */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-left">HSN</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Price</th>
                  <th className="px-3 py-2 text-right">CGST</th>
                  <th className="px-3 py-2 text-right">SGST</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {itemsWithCalc.map((item, idx) => (
                  <tr
                    key={`${item.productName}-${idx}`}
                    className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}
                  >
                    <td className="px-3 py-2">{idx + 1}</td>
                    <td className="px-3 py-2 font-medium">
                      {item.productName}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-sm">
                      {(item as unknown as { hsnCode?: string }).hsnCode || "—"}
                    </td>
                    <td className="px-3 py-2 text-right">{item.qty}</td>
                    <td className="px-3 py-2 text-right">
                      ₹{(item.price * item.qty).toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-muted-foreground">
                      {item.calc.cgst > 0
                        ? `₹${item.calc.cgst.toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-muted-foreground">
                      {item.calc.sgst > 0
                        ? `₹${item.calc.sgst.toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      ₹{item.calc.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mt-4">
            <div className="w-64 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {totalTax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Tax</span>
                  <span>₹{totalTax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                <span>Grand Total</span>
                <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-sm">
              <span className="font-medium">Notes: </span>
              {invoice.notes}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
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
