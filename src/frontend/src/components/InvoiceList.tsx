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
  FileText,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Printer,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Invoice } from "../backend.d";
import {
  useDeleteInvoice,
  useGetAllInvoices,
  useGetProfile,
  useGetTaxRates,
} from "../hooks/useQueries";
import { formatDate } from "../utils/formatting";
import { downloadAsPDF, printElement } from "../utils/printUtils";
import { InvoicePrintView } from "./InvoicePrintView";
import { InvoiceViewDialog } from "./InvoiceViewDialog";

interface InvoiceListProps {
  onCreateInvoice: () => void;
  onEditInvoice: (invoice: Invoice) => void;
}

export function InvoiceList({
  onCreateInvoice,
  onEditInvoice,
}: InvoiceListProps) {
  const { data: invoices, isLoading } = useGetAllInvoices();
  const { data: taxRates = [] } = useGetTaxRates();
  const { data: profile = null } = useGetProfile();
  const deleteInvoice = useDeleteInvoice();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const handlePrint = (invoice: Invoice) => {
    setPrintInvoice(invoice);
    setTimeout(() => {
      printElement("invoice-print-area");
      setTimeout(() => setPrintInvoice(null), 1200);
    }, 150);
  };

  const handleDownload = (invoice: Invoice) => {
    setPrintInvoice(invoice);
    setTimeout(() => {
      downloadAsPDF("invoice-print-area", `Invoice-${invoice.id}`);
      setTimeout(() => setPrintInvoice(null), 1200);
    }, 150);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteInvoice.mutateAsync(deleteTarget);
      toast.success("Invoice deleted");
    } catch {
      toast.error("Failed to delete invoice");
    }
    setDeleteTarget(null);
  };

  const calculateTotal = (invoice: Invoice) => {
    let total = 0;
    for (const item of invoice.items) {
      const price = Number(item.sellingPrice);
      const qty = Number(item.quantity);
      const base = price * qty;
      const taxRate = taxRates.find((t) => t.id === item.taxRateId);
      // cgst/sgst stored as integer*100 (e.g. 250 = 2.5%), so divide by 10000 to get actual tax
      const cgst = taxRate ? (base * Number(taxRate.cgst)) / 10000 : 0;
      const sgst = taxRate ? (base * Number(taxRate.sgst)) / 10000 : 0;
      total += base + cgst + sgst;
    }
    return total;
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
              Invoices
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {invoices?.length || 0} invoice
              {(invoices?.length || 0) !== 1 ? "s" : ""} total
            </p>
          </div>
          <Button
            onClick={onCreateInvoice}
            className="bg-navy hover:bg-navy-light text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Invoice
          </Button>
        </div>

        {/* Table */}
        {!invoices || invoices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold text-lg text-foreground">
              No invoices yet
            </h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Create your first invoice to get started
            </p>
            <Button
              onClick={onCreateInvoice}
              className="bg-navy hover:bg-navy-light text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Invoice
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
                    Invoice No.
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Customer
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Date
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Copy Type
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
                  {invoices.map((invoice, idx) => (
                    <motion.tr
                      key={invoice.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <span className="font-mono font-semibold text-primary">
                          {invoice.id}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {invoice.customerName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(invoice.invoiceDate)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            invoice.copyType === "transport"
                              ? "secondary"
                              : "default"
                          }
                          className={
                            invoice.copyType === "transport"
                              ? "bg-accent/20 text-accent-foreground"
                              : "bg-navy/10 text-navy"
                          }
                        >
                          {invoice.copyType === "transport"
                            ? "Transport"
                            : "Customer"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        ₹
                        {calculateTotal(invoice).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewInvoice(invoice)}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onEditInvoice(invoice)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handlePrint(invoice)}
                            title="Print"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDownload(invoice)}
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700"
                            onClick={() => {
                              const total = calculateTotal(
                                invoice,
                              ).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              });
                              const text = `*INFINEXY FINANCE*\nInvoice No: ${invoice.id}\nCustomer: ${invoice.customerName}\nDate: ${formatDate(invoice.invoiceDate)}\nAmount: ₹${total}\nPlace of Supply: 24-Gujarat`;
                              window.open(
                                `https://wa.me/?text=${encodeURIComponent(text)}`,
                                "_blank",
                              );
                            }}
                            title="Send via WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
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
                                onClick={() => setDeleteTarget(invoice.id)}
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
        id="invoice-print-area"
        style={{ display: "none" }}
        aria-hidden="true"
      >
        {printInvoice && (
          <InvoicePrintView
            invoice={printInvoice}
            profile={profile}
            taxRates={taxRates}
          />
        )}
      </div>

      {/* View Dialog */}
      {viewInvoice && (
        <InvoiceViewDialog
          invoice={viewInvoice}
          profile={profile}
          taxRates={taxRates}
          onClose={() => setViewInvoice(null)}
          onEdit={() => {
            onEditInvoice(viewInvoice);
            setViewInvoice(null);
          }}
          onPrint={() => {
            handlePrint(viewInvoice);
          }}
          onDownload={() => {
            handleDownload(viewInvoice);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete invoice {deleteTarget}. This action
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
