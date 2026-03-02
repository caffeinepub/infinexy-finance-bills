import type { Invoice, TaxRate, UserProfile } from "../backend.d";
import { calculateTax, formatDate } from "../utils/formatting";
import { BillHeader } from "./BillHeader";

interface InvoicePrintViewProps {
  invoice: Invoice;
  profile: UserProfile | null;
  taxRates: TaxRate[];
}

function getTaxRate(taxRates: TaxRate[], id: bigint): TaxRate | null {
  return taxRates.find((t) => t.id === id) || null;
}

export function InvoicePrintView({
  invoice,
  profile,
  taxRates,
}: InvoicePrintViewProps) {
  const copyLabel =
    invoice.copyType === "transport" ? "Transport Copy" : "Customer Copy";

  // Calculate totals
  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const itemsWithCalc = invoice.items.map((item) => {
    const price = Number(item.sellingPrice);
    const qty = Number(item.quantity);
    const taxRate = getTaxRate(taxRates, item.taxRateId);
    // cgst/sgst/igst stored as integer*100 (e.g. 250 = 2.5%), divide by 100 for actual pct
    const cgstPct = taxRate ? Number(taxRate.cgst) / 100 : 0;
    const sgstPct = taxRate ? Number(taxRate.sgst) / 100 : 0;
    const igstPct = taxRate ? Number(taxRate.igst) / 100 : 0;

    const calc = calculateTax(price, qty, cgstPct, sgstPct, igstPct);
    subtotal += calc.base;
    totalCgst += calc.cgst;
    totalSgst += calc.sgst;
    totalIgst += calc.igst;

    return {
      ...item,
      price,
      qty,
      calc,
      taxRate,
      cgstPct,
      sgstPct,
    };
  });

  const grandTotal = subtotal + totalCgst + totalSgst;

  const styles: Record<string, React.CSSProperties> = {
    page: {
      fontFamily: "Arial, sans-serif",
      background: "white",
      color: "#1a1a2e",
      padding: "32px",
      maxWidth: "900px",
      margin: "0 auto",
      fontSize: "13px",
      lineHeight: "1.5",
    },
    titleRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "20px",
    },
    titleLeft: {
      fontSize: "28px",
      fontWeight: "800",
      color: "#1a2456",
      letterSpacing: "2px",
    },
    titleRight: {
      textAlign: "right" as const,
      color: "#333",
    },
    copyBadge: {
      display: "inline-block",
      background: "#1a2456",
      color: "white",
      padding: "3px 10px",
      borderRadius: "4px",
      fontSize: "11px",
      fontWeight: "700",
      marginTop: "4px",
    },
    billTo: {
      background: "#f0f4ff",
      border: "1px solid #d0d8f0",
      borderRadius: "6px",
      padding: "12px 16px",
      marginBottom: "20px",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse" as const,
      marginBottom: "16px",
    },
    th: {
      background: "#1a2456",
      color: "white",
      padding: "8px 10px",
      textAlign: "left" as const,
      fontSize: "12px",
      fontWeight: "600",
      border: "1px solid #1a2456",
    },
    td: {
      padding: "7px 10px",
      border: "1px solid #d0d8f0",
      fontSize: "12px",
    },
    tdRight: {
      padding: "7px 10px",
      border: "1px solid #d0d8f0",
      fontSize: "12px",
      textAlign: "right" as const,
    },
    totalsTable: {
      marginLeft: "auto",
      width: "320px",
      borderCollapse: "collapse" as const,
    },
    totalRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "5px 10px",
      borderBottom: "1px solid #e0e8f0",
      fontSize: "13px",
    },
    grandTotalRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 10px",
      background: "#1a2456",
      color: "white",
      fontWeight: "700",
      fontSize: "15px",
      borderRadius: "4px",
      marginTop: "4px",
    },
    footer: {
      marginTop: "30px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
  };

  return (
    <div style={styles.page}>
      <BillHeader profile={profile} />

      <div style={styles.titleRow}>
        <div>
          <div style={styles.titleLeft}>INVOICE</div>
          <div style={{ ...styles.copyBadge }}>{copyLabel}</div>
        </div>
        <div style={styles.titleRight}>
          <div>
            <strong>Invoice No:</strong> {invoice.id}
          </div>
          <div>
            <strong>Date:</strong> {formatDate(invoice.invoiceDate)}
          </div>
          <div>
            <strong>Place of Supply:</strong>{" "}
            {invoice.placeOfSupply || "24-Gujarat"}
          </div>
        </div>
      </div>

      <div style={styles.billTo}>
        <div style={{ fontSize: "11px", color: "#555", marginBottom: "2px" }}>
          BILL TO
        </div>
        <div style={{ fontSize: "16px", fontWeight: "700", color: "#1a2456" }}>
          {invoice.customerName}
        </div>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>#</th>
            <th style={styles.th}>Product / Service</th>
            <th style={styles.th}>HSN</th>
            <th style={{ ...styles.th, textAlign: "right" }}>Qty (PCS)</th>
            <th style={{ ...styles.th, textAlign: "right" }}>Price (₹)</th>
            <th style={{ ...styles.th, textAlign: "right" }}>CGST</th>
            <th style={{ ...styles.th, textAlign: "right" }}>SGST</th>
            <th style={{ ...styles.th, textAlign: "right" }}>Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          {itemsWithCalc.map((item, idx) => (
            <tr
              key={`${item.productName}-${idx}`}
              style={{ background: idx % 2 === 0 ? "white" : "#f8f9ff" }}
            >
              <td style={styles.td}>{idx + 1}</td>
              <td style={styles.td}>{item.productName}</td>
              <td style={{ ...styles.td, color: "#666" }}>
                {(item as unknown as { hsnCode?: string }).hsnCode || "—"}
              </td>
              <td style={styles.tdRight}>{item.qty}</td>
              <td style={styles.tdRight}>
                ₹{(item.price * item.qty).toLocaleString("en-IN")}
              </td>
              <td style={styles.tdRight}>
                {item.cgstPct > 0
                  ? `₹${item.calc.cgst.toFixed(2)} (${item.cgstPct}%)`
                  : "—"}
              </td>
              <td style={styles.tdRight}>
                {item.sgstPct > 0
                  ? `₹${item.calc.sgst.toFixed(2)} (${item.sgstPct}%)`
                  : "—"}
              </td>
              <td
                style={{
                  ...styles.tdRight,
                  fontWeight: "600",
                  color: "#1a2456",
                }}
              >
                ₹{item.calc.total.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div
          style={{
            width: "320px",
            border: "1px solid #d0d8f0",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <div style={styles.totalRow}>
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {totalCgst > 0 && (
            <div style={styles.totalRow}>
              <span>Total CGST</span>
              <span>₹{totalCgst.toFixed(2)}</span>
            </div>
          )}
          {totalSgst > 0 && (
            <div style={styles.totalRow}>
              <span>Total SGST</span>
              <span>₹{totalSgst.toFixed(2)}</span>
            </div>
          )}
          {totalIgst > 0 && (
            <div style={styles.totalRow}>
              <span>Total IGST</span>
              <span>₹{totalIgst.toFixed(2)}</span>
            </div>
          )}
          <div style={styles.grandTotalRow}>
            <span>Grand Total</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div
          style={{
            marginTop: "20px",
            padding: "12px 16px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "6px",
            fontSize: "12px",
          }}
        >
          <strong>Notes:</strong> {invoice.notes}
        </div>
      )}

      <div style={styles.footer}>
        <div>
          <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>
            Thank you for your business!
          </div>
          <div
            style={{
              borderTop: "2px solid #1a2456",
              paddingTop: "6px",
              fontSize: "11px",
              color: "#1a2456",
              fontWeight: "600",
            }}
          >
            INFINEXY FINANCE
          </div>
        </div>
        {invoice.signatureUrl && (
          <div style={{ textAlign: "center" }}>
            <img
              src={invoice.signatureUrl}
              alt="Signature"
              style={{
                maxWidth: "160px",
                maxHeight: "60px",
                objectFit: "contain",
              }}
            />
            <div
              style={{
                borderTop: "1px solid #333",
                marginTop: "6px",
                paddingTop: "4px",
                fontSize: "11px",
                color: "#555",
              }}
            >
              Authorized Signature
            </div>
          </div>
        )}
        {!invoice.signatureUrl && (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "160px",
                borderTop: "1px solid #333",
                marginTop: "60px",
                paddingTop: "4px",
                fontSize: "11px",
                color: "#555",
              }}
            >
              Authorized Signature
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
