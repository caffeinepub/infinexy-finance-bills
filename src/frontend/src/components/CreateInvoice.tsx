import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Download,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Plus,
  Printer,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Invoice, InvoiceItem, TaxRate } from "../backend.d";
import {
  useAddTaxRate,
  useCreateInvoice,
  useGetProfile,
  useGetTaxRates,
  useUpdateInvoice,
} from "../hooks/useQueries";
import { calculateTax, getTodayDate } from "../utils/formatting";
import { printElement } from "../utils/printUtils";
import { InvoicePrintView } from "./InvoicePrintView";

interface LineItem {
  id: string; // stable unique id to prevent remount on keystroke
  productName: string;
  sellingPrice: string;
  hsnCode: string;
  quantity: string;
  taxRateId: string; // "0" = no tax
  imageUrl: string;
  imagePreview: string;
}

const emptyLineItem = (): LineItem => ({
  id: Math.random().toString(36).slice(2),
  productName: "",
  sellingPrice: "",
  hsnCode: "",
  quantity: "1",
  taxRateId: "0",
  imageUrl: "",
  imagePreview: "",
});

interface CreateInvoiceProps {
  editInvoice?: Invoice | null;
  onBack: () => void;
}

export function CreateInvoice({ editInvoice, onBack }: CreateInvoiceProps) {
  const { data: taxRates = [] } = useGetTaxRates();
  const { data: profile = null } = useGetProfile();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const addTaxRate = useAddTaxRate();

  const isEditing = !!editInvoice;

  // Step 1 state
  const [customerName, setCustomerName] = useState(
    editInvoice?.customerName || "",
  );
  const [invoiceDate, setInvoiceDate] = useState(
    editInvoice?.invoiceDate || getTodayDate(),
  );
  const [placeOfSupply, setPlaceOfSupply] = useState(
    editInvoice?.placeOfSupply || "24-Gujarat",
  );

  // Initialize line items from existing invoice or default
  const initLineItems = (): LineItem[] => {
    if (editInvoice?.items?.length) {
      return editInvoice.items.map((item) => ({
        id: Math.random().toString(36).slice(2),
        productName: item.productName,
        sellingPrice: String(Number(item.sellingPrice)),
        hsnCode: (item as unknown as { hsnCode?: string }).hsnCode || "",
        quantity: String(Number(item.quantity)),
        taxRateId: String(Number(item.taxRateId) || 0),
        imageUrl: item.imageUrl || "",
        imagePreview: item.imageUrl || "",
      }));
    }
    return [emptyLineItem()];
  };

  const [lineItems, setLineItems] = useState<LineItem[]>(initLineItems());
  const [step, setStep] = useState<1 | 2>(1);

  // Step 2 state
  const [signatureUrl, setSignatureUrl] = useState(
    editInvoice?.signatureUrl || "",
  );
  const [signaturePreview, setSignaturePreview] = useState(
    editInvoice?.signatureUrl || "",
  );
  const [copyType, setCopyType] = useState(editInvoice?.copyType || "customer");
  const [notes, setNotes] = useState(editInvoice?.notes || "");

  // Custom tax rate dialog
  const [showAddTaxDialog, setShowAddTaxDialog] = useState(false);
  const [newTaxName, setNewTaxName] = useState("");
  const [newTaxPercentage, setNewTaxPercentage] = useState("");
  const [newTaxCgst, setNewTaxCgst] = useState("");
  const [newTaxSgst, setNewTaxSgst] = useState("");
  const [newTaxIgst, setNewTaxIgst] = useState("");

  // Print state
  const [printInvoiceData, setPrintInvoiceData] = useState<Invoice | null>(
    null,
  );

  const imageInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const signatureInputRef = useRef<HTMLInputElement | null>(null);

  const updateLineItem = (
    idx: number,
    field: keyof LineItem,
    value: string,
  ) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const addLineItem = () => {
    setLineItems((prev) => [...prev, emptyLineItem()]);
  };

  const removeLineItem = (idx: number) => {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleImageUpload = (idx: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      updateLineItem(idx, "imageUrl", dataUrl);
      updateLineItem(idx, "imagePreview", dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setSignatureUrl(dataUrl);
      setSignaturePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const validateStep1 = () => {
    if (!customerName.trim()) {
      toast.error("Please enter customer name");
      return false;
    }
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      if (!item.productName.trim()) {
        toast.error(`Please enter product name for item ${i + 1}`);
        return false;
      }
      if (!item.sellingPrice || Number(item.sellingPrice) <= 0) {
        toast.error(`Please enter a valid selling price for item ${i + 1}`);
        return false;
      }
      if (!item.quantity || Number(item.quantity) <= 0) {
        toast.error(`Please enter a valid quantity for item ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const buildInvoicePayload = (): Invoice => {
    const invoiceItems = lineItems.map((item) => ({
      productName: item.productName,
      sellingPrice: BigInt(Math.round(Number.parseFloat(item.sellingPrice))),
      hsnCode: item.hsnCode || undefined,
      quantity: BigInt(Number.parseInt(item.quantity)),
      taxRateId: BigInt(Number.parseInt(item.taxRateId) || 0),
      imageUrl: item.imageUrl || undefined,
    })) as InvoiceItem[];

    // Collect unique tax rates used
    const usedTaxRateIds = new Set(
      lineItems.map((i) => Number.parseInt(i.taxRateId)),
    );
    const usedTaxRates = taxRates.filter((t) =>
      usedTaxRateIds.has(Number(t.id)),
    );

    return {
      id: editInvoice?.id || "",
      customerName,
      invoiceDate,
      placeOfSupply,
      copyType,
      signatureUrl: signatureUrl || undefined,
      notes: notes || undefined,
      items: invoiceItems,
      taxRates: usedTaxRates,
    };
  };

  const handleSave = async (andPrint = false, andDownload = false) => {
    if (!validateStep1()) return;

    try {
      const payload = buildInvoicePayload();
      let savedInvoice: Invoice;

      if (isEditing) {
        await updateInvoice.mutateAsync(payload);
        savedInvoice = payload;
        toast.success("Invoice updated successfully");
      } else {
        savedInvoice = await createInvoice.mutateAsync(payload);
        toast.success("Invoice saved successfully");
      }

      if (andPrint || andDownload) {
        setPrintInvoiceData({
          ...savedInvoice,
          id: savedInvoice.id || payload.id,
        });
        const originalTitle = document.title;
        if (andDownload) {
          document.title = `Invoice-${savedInvoice.id}`;
        }
        setTimeout(() => {
          printElement("invoice-create-print-area");
          if (andDownload) document.title = originalTitle;
          setPrintInvoiceData(null);
        }, 100);
      }

      if (!andPrint && !andDownload) {
        onBack();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save invoice. Please try again.");
    }
  };

  const handleAddTaxRate = async () => {
    if (!newTaxName || !newTaxPercentage) {
      toast.error("Please fill in tax name and percentage");
      return;
    }
    try {
      const newId = BigInt(Date.now());
      // Store percentages as integer * 100 (so 2.5% → 250n) to support decimals
      await addTaxRate.mutateAsync({
        id: newId,
        name: newTaxName,
        percentage: BigInt(
          Math.round(Number.parseFloat(newTaxPercentage) * 100),
        ),
        cgst: BigInt(Math.round(Number.parseFloat(newTaxCgst || "0") * 100)),
        sgst: BigInt(Math.round(Number.parseFloat(newTaxSgst || "0") * 100)),
        igst: BigInt(Math.round(Number.parseFloat(newTaxIgst || "0") * 100)),
      } as TaxRate);
      toast.success("Tax rate added");
      setShowAddTaxDialog(false);
      setNewTaxName("");
      setNewTaxPercentage("");
      setNewTaxCgst("");
      setNewTaxSgst("");
      setNewTaxIgst("");
    } catch {
      toast.error("Failed to add tax rate");
    }
  };

  // Helper: convert stored bigint*100 back to display percentage
  const pct = (val: bigint) => Number(val) / 100;

  // Tax display helper
  const getTaxDisplay = (taxRateId: string) => {
    if (!taxRateId || taxRateId === "0") return "Without Tax";
    const rate = taxRates.find((t) => String(Number(t.id)) === taxRateId);
    if (!rate) return "Without Tax";
    return `${pct(rate.percentage)}% (CGST ${pct(rate.cgst)}% + SGST ${pct(rate.sgst)}%)`;
  };

  // Calculate total for display
  const calculateDisplayTotal = () => {
    let total = 0;
    for (const item of lineItems) {
      const price = Number.parseFloat(item.sellingPrice) || 0;
      const qty = Number.parseInt(item.quantity) || 0;
      const base = price * qty;
      if (item.taxRateId && item.taxRateId !== "0") {
        const taxRate = taxRates.find(
          (t) => String(Number(t.id)) === item.taxRateId,
        );
        if (taxRate) {
          // pct values are stored as integer*100, so divide by 10000 for actual fraction
          const cgst = (base * Number(taxRate.cgst)) / 10000;
          const sgst = (base * Number(taxRate.sgst)) / 10000;
          total += base + cgst + sgst;
        } else {
          total += base;
        }
      } else {
        total += base;
      }
    }
    return total;
  };

  const isPending = createInvoice.isPending || updateInvoice.isPending;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-display font-bold text-primary">
            {isEditing ? "Edit Invoice" : "Create Invoice"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {step === 1
              ? "Step 1: Add items and details"
              : "Step 2: Review and finalize"}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div
            className={`h-2 w-8 rounded-full ${step >= 1 ? "bg-navy" : "bg-muted"}`}
          />
          <div
            className={`h-2 w-8 rounded-full ${step >= 2 ? "bg-navy" : "bg-muted"}`}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Basic Info */}
            <div className="rounded-xl border border-border p-6 bg-card space-y-4">
              <h3 className="font-display font-semibold text-lg text-primary">
                Invoice Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="customerName">
                    Customer Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invoiceDate">Invoice Date</Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="placeOfSupply">Place of Supply</Label>
                  <Input
                    id="placeOfSupply"
                    value={placeOfSupply}
                    onChange={(e) => setPlaceOfSupply(e.target.value)}
                    placeholder="24-Gujarat"
                  />
                </div>
              </div>
            </div>

            {/* Tax Rates Section */}
            <div className="rounded-xl border border-border p-6 bg-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-lg text-primary">
                  Available Tax Rates
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddTaxDialog(true)}
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Custom Tax
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="py-1.5 px-3">
                  0% — 0% CGST + 0% SGST
                </Badge>
                {taxRates.map((rate) => (
                  <Badge
                    key={String(rate.id)}
                    variant="outline"
                    className="py-1.5 px-3"
                  >
                    {pct(rate.percentage)}% — {pct(rate.cgst)}% CGST +{" "}
                    {pct(rate.sgst)}% SGST
                  </Badge>
                ))}
              </div>
            </div>

            {/* Line Items */}
            <div className="rounded-xl border border-border p-6 bg-card space-y-4">
              <h3 className="font-display font-semibold text-lg text-primary">
                Items
              </h3>

              <div className="space-y-4">
                <AnimatePresence>
                  {lineItems.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="rounded-lg border border-border p-4 space-y-4 bg-muted/10 relative"
                    >
                      {/* Item Header */}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-muted-foreground">
                          Item #{idx + 1}
                        </span>
                        {lineItems.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive/80"
                            onClick={() => removeLineItem(idx)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Row 1: Product Name */}
                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1.5">
                          <Label>
                            Product Name{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            value={item.productName}
                            onChange={(e) =>
                              updateLineItem(idx, "productName", e.target.value)
                            }
                            placeholder="Product / Service name"
                          />
                        </div>
                      </div>

                      {/* Row 2: Price, HSN Code, Qty */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label>
                            Selling Price (₹){" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="number"
                            value={item.sellingPrice}
                            onChange={(e) =>
                              updateLineItem(
                                idx,
                                "sellingPrice",
                                e.target.value,
                              )
                            }
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>HSN Code</Label>
                          <Input
                            value={item.hsnCode}
                            onChange={(e) =>
                              updateLineItem(idx, "hsnCode", e.target.value)
                            }
                            placeholder="e.g. 1234"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>
                            Quantity (PCS){" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateLineItem(idx, "quantity", e.target.value)
                            }
                            placeholder="1"
                            min="1"
                          />
                        </div>
                      </div>

                      {/* Row 2: Tax */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Tax Rate</Label>
                          <Select
                            value={item.taxRateId}
                            onValueChange={(v) =>
                              updateLineItem(idx, "taxRateId", v)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select tax rate" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Without Tax</SelectItem>
                              {taxRates.map((rate) => (
                                <SelectItem
                                  key={String(rate.id)}
                                  value={String(Number(rate.id))}
                                >
                                  {pct(rate.percentage)}% — CGST{" "}
                                  {pct(rate.cgst)}% + SGST {pct(rate.sgst)}% |
                                  IGST {pct(rate.igst)}%
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {item.taxRateId &&
                            item.taxRateId !== "0" &&
                            (() => {
                              const rate = taxRates.find(
                                (t) => String(Number(t.id)) === item.taxRateId,
                              );
                              if (!rate) return null;
                              const price =
                                Number.parseFloat(item.sellingPrice) || 0;
                              const qty = Number.parseInt(item.quantity) || 0;
                              const calc = calculateTax(
                                price,
                                qty,
                                pct(rate.cgst),
                                pct(rate.sgst),
                                pct(rate.igst),
                              );
                              return (
                                <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mt-1 space-y-0.5">
                                  <div>
                                    CGST ({pct(rate.cgst)}%): ₹
                                    {calc.cgst.toFixed(2)}
                                  </div>
                                  <div>
                                    SGST ({pct(rate.sgst)}%): ₹
                                    {calc.sgst.toFixed(2)}
                                  </div>
                                  {calc.igst > 0 && (
                                    <div>
                                      IGST ({pct(rate.igst)}%): ₹
                                      {calc.igst.toFixed(2)}
                                    </div>
                                  )}
                                  <div className="font-semibold pt-1 border-t border-border">
                                    Item Total: ₹
                                    {(
                                      calc.base +
                                      calc.cgst +
                                      calc.sgst
                                    ).toFixed(2)}
                                  </div>
                                </div>
                              );
                            })()}
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-1.5">
                          <Label>Item Image (Optional)</Label>
                          <div className="flex items-center gap-3">
                            <input
                              ref={(el) => {
                                imageInputRefs.current[idx] = el;
                              }}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(idx, file);
                              }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                imageInputRefs.current[idx]?.click()
                              }
                              className="gap-1.5"
                            >
                              <Upload className="h-3.5 w-3.5" />
                              Upload Image
                            </Button>
                            {item.imagePreview && (
                              <div className="relative">
                                <img
                                  src={item.imagePreview}
                                  alt="Item preview"
                                  className="h-12 w-12 rounded object-cover border border-border"
                                />
                                <button
                                  type="button"
                                  className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full h-4 w-4 flex items-center justify-center text-xs"
                                  onClick={() => {
                                    updateLineItem(idx, "imageUrl", "");
                                    updateLineItem(idx, "imagePreview", "");
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            )}
                            {!item.imagePreview && (
                              <div className="h-12 w-12 rounded border-2 border-dashed border-border flex items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <Button
                variant="outline"
                onClick={addLineItem}
                className="gap-2 w-full border-dashed"
              >
                <Plus className="h-4 w-4" />
                Add New Item
              </Button>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-border p-4 bg-navy/5 flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">
                  Estimated Total
                </div>
                <div className="text-2xl font-display font-bold text-primary">
                  ₹
                  {calculateDisplayTotal().toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
              <Button
                onClick={() => {
                  if (validateStep1()) setStep(2);
                }}
                className="bg-navy hover:bg-navy-light text-white gap-2"
              >
                Review Invoice
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Summary Review */}
            <div className="rounded-xl border border-border p-6 bg-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-lg text-primary">
                  Invoice Summary
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="gap-1.5 text-muted-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Edit Items
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Customer:</span>
                  <div className="font-semibold">{customerName}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <div className="font-semibold">{invoiceDate}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Place of Supply:
                  </span>
                  <div className="font-semibold">{placeOfSupply}</div>
                </div>
              </div>

              <Separator />

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-3 py-2 text-left font-semibold">#</th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Product
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">HSN</th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Price
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">Tax</th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, idx) => {
                      const price = Number.parseFloat(item.sellingPrice) || 0;
                      const qty = Number.parseInt(item.quantity) || 0;
                      const base = price * qty;
                      const taxRate = taxRates.find(
                        (t) => String(Number(t.id)) === item.taxRateId,
                      );
                      const cgst = taxRate
                        ? (base * Number(taxRate.cgst)) / 10000
                        : 0;
                      const sgst = taxRate
                        ? (base * Number(taxRate.sgst)) / 10000
                        : 0;
                      const total = base + cgst + sgst;
                      return (
                        <tr key={item.id} className="border-b border-border">
                          <td className="px-3 py-2">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium">
                            <div className="flex items-center gap-2">
                              {item.imagePreview && (
                                <img
                                  src={item.imagePreview}
                                  alt="item"
                                  className="h-8 w-8 rounded object-cover"
                                />
                              )}
                              {item.productName}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground text-xs">
                            {item.hsnCode || "—"}
                          </td>
                          <td className="px-3 py-2 text-right">{qty}</td>
                          <td className="px-3 py-2 text-right">
                            ₹{base.toLocaleString("en-IN")}
                          </td>
                          <td className="px-3 py-2 text-sm text-muted-foreground">
                            {getTaxDisplay(item.taxRateId)}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-primary">
                            ₹{total.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                    <span>Grand Total</span>
                    <span className="text-primary">
                      ₹{calculateDisplayTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Copy Type & Options */}
            <div className="rounded-xl border border-border p-6 bg-card space-y-5">
              <h3 className="font-display font-semibold text-lg text-primary">
                Invoice Options
              </h3>

              <div className="space-y-2">
                <Label>Copy Type</Label>
                <RadioGroup
                  value={copyType}
                  onValueChange={setCopyType}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="customer" id="customer-copy" />
                    <Label
                      htmlFor="customer-copy"
                      className="cursor-pointer font-normal"
                    >
                      Customer Copy
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="transport" id="transport-copy" />
                    <Label
                      htmlFor="transport-copy"
                      className="cursor-pointer font-normal"
                    >
                      Transport Copy
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes for this invoice..."
                  rows={3}
                />
              </div>
            </div>

            {/* Signature */}
            <div className="rounded-xl border border-border p-6 bg-card space-y-4">
              <h3 className="font-display font-semibold text-lg text-primary">
                Signature (Optional)
              </h3>
              <div className="flex items-center gap-4">
                <input
                  ref={signatureInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleSignatureUpload(file);
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => signatureInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Signature
                </Button>
                {signaturePreview ? (
                  <div className="relative">
                    <img
                      src={signaturePreview}
                      alt="Signature"
                      className="h-20 max-w-48 object-contain border border-border rounded bg-white"
                    />
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full h-5 w-5 flex items-center justify-center text-xs"
                      onClick={() => {
                        setSignatureUrl("");
                        setSignaturePreview("");
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="h-20 w-48 border-2 border-dashed border-border rounded flex items-center justify-center text-muted-foreground text-sm">
                    No signature uploaded
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-between items-center p-4 rounded-xl border border-border bg-card">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
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
                  Save Invoice
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
                <Button
                  variant="ghost"
                  className="gap-2 text-green-600 hover:text-green-700"
                  onClick={() => {
                    const total = calculateDisplayTotal().toFixed(2);
                    const text = `*INFINEXY FINANCE*\nCustomer: ${customerName}\nDate: ${invoiceDate}\nAmount: ₹${total}\nPlace of Supply: ${placeOfSupply}`;
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(text)}`,
                      "_blank",
                    );
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Send via WhatsApp
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print Area */}
      <div id="invoice-create-print-area">
        {printInvoiceData && (
          <InvoicePrintView
            invoice={printInvoiceData}
            profile={profile}
            taxRates={taxRates}
          />
        )}
      </div>

      {/* Add Custom Tax Rate Dialog */}
      <Dialog open={showAddTaxDialog} onOpenChange={setShowAddTaxDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom Tax Rate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tax Name</Label>
              <Input
                value={newTaxName}
                onChange={(e) => setNewTaxName(e.target.value)}
                placeholder="e.g., GST 12%"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Total Percentage (%)</Label>
              <Input
                type="number"
                value={newTaxPercentage}
                onChange={(e) => setNewTaxPercentage(e.target.value)}
                placeholder="e.g., 12"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>CGST (%)</Label>
                <Input
                  type="number"
                  value={newTaxCgst}
                  onChange={(e) => setNewTaxCgst(e.target.value)}
                  placeholder="6"
                />
              </div>
              <div className="space-y-1.5">
                <Label>SGST (%)</Label>
                <Input
                  type="number"
                  value={newTaxSgst}
                  onChange={(e) => setNewTaxSgst(e.target.value)}
                  placeholder="6"
                />
              </div>
              <div className="space-y-1.5">
                <Label>IGST (%)</Label>
                <Input
                  type="number"
                  value={newTaxIgst}
                  onChange={(e) => setNewTaxIgst(e.target.value)}
                  placeholder="12"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddTaxDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddTaxRate}
              disabled={addTaxRate.isPending}
              className="bg-navy hover:bg-navy-light text-white"
            >
              {addTaxRate.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Tax Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
