import type { Invoice, TaxRate, UserProfile } from "../backend.d";
import { calculateTax, formatDate } from "../utils/formatting";

interface InvoicePrintViewProps {
  invoice: Invoice;
  profile: UserProfile | null;
  taxRates: TaxRate[];
}

function getTaxRate(taxRates: TaxRate[], id: bigint): TaxRate | null {
  return taxRates.find((t) => t.id === id) || null;
}

/** Convert number to Indian words */
function numberToWords(n: number): string {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convert(num: number): string {
    if (num === 0) return "";
    if (num < 20) return `${ones[num]} `;
    if (num < 100)
      return `${tens[Math.floor(num / 10)] + (num % 10 ? ` ${ones[num % 10]}` : "")} `;
    if (num < 1000)
      return `${ones[Math.floor(num / 100)]} Hundred ${convert(num % 100)}`;
    if (num < 100000)
      return `${convert(Math.floor(num / 1000))}Thousand ${convert(num % 1000)}`;
    if (num < 10000000)
      return `${convert(Math.floor(num / 100000))}Lakh ${convert(num % 100000)}`;
    return `${convert(Math.floor(num / 10000000))}Crore ${convert(num % 10000000)}`;
  }

  const rupees = Math.floor(n);
  const paise = Math.round((n - rupees) * 100);
  let result = `${convert(rupees).trim()} Rupees`;
  if (paise > 0) result += ` and ${convert(paise).trim()} Paise`;
  result += " Only";
  return result;
}

export function InvoicePrintView({
  invoice,
  profile,
  taxRates,
}: InvoicePrintViewProps) {
  const copyLabel =
    invoice.copyType === "transport"
      ? "TRANSPORT COPY"
      : invoice.copyType === "original"
        ? "ORIGINAL COPY"
        : "CUSTOMER COPY";

  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalQty = 0;

  const itemsWithCalc = invoice.items.map((item) => {
    const price = Number(item.sellingPrice);
    const qty = Number(item.quantity);
    const taxRate = getTaxRate(taxRates, item.taxRateId);
    const cgstPct = taxRate ? Number(taxRate.cgst) / 100 : 0;
    const sgstPct = taxRate ? Number(taxRate.sgst) / 100 : 0;
    const taxLabel = taxRate ? `${Number(taxRate.percentage) / 100}%` : "0%";
    const calc = calculateTax(price, qty, cgstPct, sgstPct, 0);
    subtotal += calc.base;
    totalCgst += calc.cgst;
    totalSgst += calc.sgst;
    totalQty += qty;
    return { ...item, price, qty, calc, taxRate, cgstPct, sgstPct, taxLabel };
  });

  const grandTotal = subtotal + totalCgst + totalSgst;
  const amountInWords = numberToWords(grandTotal);

  const hsnMap: Record<
    string,
    {
      hsnCode: string;
      taxableValue: number;
      cgstRate: number;
      cgstAmt: number;
      sgstRate: number;
      sgstAmt: number;
      totalTax: number;
    }
  > = {};
  for (const item of itemsWithCalc) {
    const hsnCode = (item as unknown as { hsnCode?: string }).hsnCode || "N/A";
    const key = `${hsnCode}-${item.cgstPct}`;
    if (!hsnMap[key]) {
      hsnMap[key] = {
        hsnCode,
        taxableValue: 0,
        cgstRate: item.cgstPct,
        cgstAmt: 0,
        sgstRate: item.sgstPct,
        sgstAmt: 0,
        totalTax: 0,
      };
    }
    hsnMap[key].taxableValue += item.calc.base;
    hsnMap[key].cgstAmt += item.calc.cgst;
    hsnMap[key].sgstAmt += item.calc.sgst;
    hsnMap[key].totalTax += item.calc.cgst + item.calc.sgst;
  }
  const hsnRows = Object.values(hsnMap);

  // Shared styles
  const borderColor = "#2c3e7a";
  const accentDark = "#1a2456";
  const accentLight = "#e8ecf8";
  const B = `1px solid ${borderColor}`;

  const th: React.CSSProperties = {
    background: accentDark,
    color: "white",
    padding: "6px 8px",
    border: B,
    fontWeight: "700",
    fontSize: "9.5px",
    textAlign: "left",
    letterSpacing: "0.3px",
    textTransform: "uppercase",
  };
  const thR: React.CSSProperties = { ...th, textAlign: "right" };
  const thC: React.CSSProperties = { ...th, textAlign: "center" };
  const td: React.CSSProperties = {
    padding: "6px 8px",
    border: B,
    fontSize: "10px",
    verticalAlign: "middle",
    color: "#222",
  };
  const tdR: React.CSSProperties = { ...td, textAlign: "right" };
  const tdC: React.CSSProperties = { ...td, textAlign: "center" };

  const labelStyle: React.CSSProperties = {
    fontSize: "8.5px",
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "2px",
  };
  const valueStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: "700",
    color: "#111",
  };

  return (
    <div
      style={{
        fontFamily: "'Arial', 'Helvetica', sans-serif",
        background: "white",
        color: "#111",
        fontSize: "11px",
        lineHeight: "1.5",
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        boxSizing: "border-box",
        padding: "8mm 10mm 8mm 10mm",
      }}
    >
      {/* Outer border */}
      <div style={{ border: `2px solid ${borderColor}`, borderRadius: "3px" }}>
        {/* TOP ACCENT BAR */}
        <div style={{ background: accentDark, height: "5px" }} />

        {/* TITLE ROW */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 14px",
            borderBottom: B,
            background: accentLight,
          }}
        >
          <span
            style={{
              fontSize: "15px",
              fontWeight: "800",
              color: accentDark,
              letterSpacing: "2px",
            }}
          >
            TAX INVOICE
          </span>
          <span
            style={{
              background: accentDark,
              color: "white",
              fontSize: "8.5px",
              fontWeight: "700",
              padding: "3px 10px",
              borderRadius: "2px",
              letterSpacing: "1px",
            }}
          >
            {copyLabel}
          </span>
        </div>

        {/* COMPANY + INVOICE META */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "55% 45%",
            borderBottom: B,
          }}
        >
          {/* Company Info */}
          <div style={{ borderRight: B, padding: "12px 14px" }}>
            <div
              style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}
            >
              <img
                src="/assets/generated/infinexy-logo.jpeg"
                alt="Logo"
                style={{
                  width: "70px",
                  height: "46px",
                  objectFit: "contain",
                  flexShrink: 0,
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "900",
                    color: accentDark,
                    letterSpacing: "0.5px",
                  }}
                >
                  INFINEXY FINANCE
                </div>
                <div
                  style={{
                    fontSize: "9px",
                    color: "#555",
                    marginTop: "3px",
                    lineHeight: "1.5",
                  }}
                >
                  401,402 Galav Chamber, Dairy Den,
                  <br />
                  Sayajigunj, Vadodara, Gujarat-390005
                </div>
                <div
                  style={{
                    marginTop: "5px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1px 12px",
                  }}
                >
                  {profile?.gstin && (
                    <div style={{ fontSize: "9px", color: "#333" }}>
                      <span style={{ fontWeight: "700", color: accentDark }}>
                        GSTIN:{" "}
                      </span>
                      {profile.gstin}
                    </div>
                  )}
                  {profile?.pan && (
                    <div style={{ fontSize: "9px", color: "#333" }}>
                      <span style={{ fontWeight: "700", color: accentDark }}>
                        PAN:{" "}
                      </span>
                      {profile.pan}
                    </div>
                  )}
                  {profile?.mobile && (
                    <div style={{ fontSize: "9px", color: "#333" }}>
                      <span style={{ fontWeight: "700", color: accentDark }}>
                        Mobile:{" "}
                      </span>
                      {profile.mobile}
                    </div>
                  )}
                  {profile?.email && (
                    <div style={{ fontSize: "9px", color: "#333" }}>
                      <span style={{ fontWeight: "700", color: accentDark }}>
                        Email:{" "}
                      </span>
                      {profile.email}
                    </div>
                  )}
                  {profile?.website && (
                    <div
                      style={{
                        fontSize: "9px",
                        color: "#333",
                        gridColumn: "1 / -1",
                      }}
                    >
                      <span style={{ fontWeight: "700", color: accentDark }}>
                        Website:{" "}
                      </span>
                      {profile.website}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Meta Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div
              style={{
                padding: "10px 12px",
                borderRight: B,
                borderBottom: B,
                background: "white",
              }}
            >
              <div style={labelStyle}>Invoice No.</div>
              <div style={{ ...valueStyle, fontSize: "12px" }}>
                {invoice.id}
              </div>
            </div>
            <div
              style={{
                padding: "10px 12px",
                borderBottom: B,
                background: "#fafbff",
              }}
            >
              <div style={labelStyle}>Invoice Date</div>
              <div style={valueStyle}>{formatDate(invoice.invoiceDate)}</div>
            </div>
            <div
              style={{
                padding: "10px 12px",
                borderRight: B,
                background: "white",
              }}
            >
              <div style={labelStyle}>Place of Supply</div>
              <div style={{ ...valueStyle, color: accentDark }}>
                {invoice.placeOfSupply || "24-GUJARAT"}
              </div>
            </div>
            <div style={{ padding: "10px 12px", background: "#fafbff" }}>
              <div style={labelStyle}>Due Date</div>
              <div style={valueStyle}>{formatDate(invoice.invoiceDate)}</div>
            </div>
          </div>
        </div>

        {/* BILL TO */}
        <div
          style={{
            borderBottom: B,
            padding: "8px 14px",
            background: accentLight,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span
            style={{
              fontSize: "8.5px",
              fontWeight: "700",
              color: "#666",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              whiteSpace: "nowrap",
            }}
          >
            Bill To:
          </span>
          <span
            style={{ fontSize: "13px", fontWeight: "800", color: accentDark }}
          >
            {invoice.customerName}
          </span>
        </div>

        {/* ITEMS TABLE */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...thC, width: "28px" }}>#</th>
              <th style={th}>Item Description</th>
              <th style={{ ...thC, width: "70px" }}>HSN/SAC</th>
              <th style={{ ...thC, width: "42px" }}>GST</th>
              <th style={{ ...thC, width: "50px" }}>Qty</th>
              <th style={{ ...thR, width: "80px" }}>Rate (₹)</th>
              <th style={{ ...thR, width: "90px" }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {itemsWithCalc.map((item, idx) => (
              <tr
                key={`${item.productName}-${idx}`}
                style={{ background: idx % 2 === 0 ? "white" : "#f8f9fe" }}
              >
                <td style={tdC}>{idx + 1}</td>
                <td style={{ ...td, fontWeight: "600", color: "#1a1a1a" }}>
                  {item.productName}
                </td>
                <td style={tdC}>
                  {(item as unknown as { hsnCode?: string }).hsnCode || "—"}
                </td>
                <td style={tdC}>{item.taxLabel}</td>
                <td style={tdC}>{item.qty} PCS</td>
                <td style={tdR}>
                  {item.price.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td style={{ ...tdR, fontWeight: "600" }}>
                  {item.calc.base.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
            {/* Spacer rows for short invoices */}
            {itemsWithCalc.length < 5 &&
              Array.from({ length: 5 - itemsWithCalc.length }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static spacer rows, order never changes
                <tr key={`sp-${i}`}>
                  <td style={{ ...td, height: "22px" }} />
                  <td style={{ ...td, height: "22px" }} />
                  <td style={{ ...td, height: "22px" }} />
                  <td style={{ ...td, height: "22px" }} />
                  <td style={{ ...td, height: "22px" }} />
                  <td style={{ ...td, height: "22px" }} />
                  <td style={{ ...td, height: "22px" }} />
                </tr>
              ))}
          </tbody>
          <tfoot>
            {/* Subtotals */}
            <tr style={{ background: accentLight }}>
              <td
                colSpan={4}
                style={{
                  ...td,
                  textAlign: "right",
                  fontWeight: "600",
                  color: "#444",
                  fontSize: "9.5px",
                }}
              >
                Qty Total
              </td>
              <td style={{ ...tdC, fontWeight: "700" }}>{totalQty} PCS</td>
              <td
                style={{
                  ...tdR,
                  fontWeight: "600",
                  fontSize: "9.5px",
                  color: "#444",
                }}
              >
                Taxable Amount
              </td>
              <td style={{ ...tdR, fontWeight: "700" }}>
                {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
            </tr>
            {totalCgst > 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{ ...tdR, color: "#555", fontSize: "10px" }}
                >
                  CGST @ {(itemsWithCalc[0]?.cgstPct * 100).toFixed(1)}%
                </td>
                <td style={tdR}>
                  {totalCgst.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </td>
              </tr>
            )}
            {totalSgst > 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{ ...tdR, color: "#555", fontSize: "10px" }}
                >
                  SGST @ {(itemsWithCalc[0]?.sgstPct * 100).toFixed(1)}%
                </td>
                <td style={tdR}>
                  {totalSgst.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </td>
              </tr>
            )}
            {/* Grand Total */}
            <tr style={{ background: accentDark }}>
              <td
                colSpan={6}
                style={{
                  ...tdR,
                  color: "white",
                  fontWeight: "800",
                  fontSize: "11.5px",
                  letterSpacing: "0.5px",
                  border: B,
                }}
              >
                GRAND TOTAL
              </td>
              <td
                style={{
                  ...tdR,
                  color: "white",
                  fontWeight: "900",
                  fontSize: "13px",
                  border: B,
                }}
              >
                ₹
                {grandTotal.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* AMOUNT IN WORDS */}
        <div
          style={{
            borderTop: B,
            padding: "7px 14px",
            background: "#f5f7ff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "9.5px" }}>
            <span style={{ fontWeight: "700", color: accentDark }}>
              Amount Chargeable (in words):{" "}
            </span>
            <span style={{ color: "#333" }}>INR {amountInWords}</span>
          </div>
          <span style={{ fontSize: "9px", fontWeight: "700", color: "#555" }}>
            E &amp; O.E
          </span>
        </div>

        {/* HSN/SAC TAX SUMMARY */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th} rowSpan={2}>
                HSN/SAC
              </th>
              <th style={thR} rowSpan={2}>
                Taxable Value (₹)
              </th>
              <th style={{ ...thC, background: "#253070" }} colSpan={2}>
                Central Tax (CGST)
              </th>
              <th style={{ ...thC, background: "#253070" }} colSpan={2}>
                State / UT Tax (SGST)
              </th>
              <th style={thR} rowSpan={2}>
                Total Tax (₹)
              </th>
            </tr>
            <tr>
              <th style={{ ...thC, background: "#2e3880", fontSize: "8.5px" }}>
                Rate %
              </th>
              <th style={{ ...thR, background: "#2e3880", fontSize: "8.5px" }}>
                Amount (₹)
              </th>
              <th style={{ ...thC, background: "#2e3880", fontSize: "8.5px" }}>
                Rate %
              </th>
              <th style={{ ...thR, background: "#2e3880", fontSize: "8.5px" }}>
                Amount (₹)
              </th>
            </tr>
          </thead>
          <tbody>
            {hsnRows.map((row) => (
              <tr key={`${row.hsnCode}-${row.cgstRate}`}>
                <td style={{ ...td, fontWeight: "600" }}>{row.hsnCode}</td>
                <td style={tdR}>
                  {row.taxableValue.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td style={tdC}>{(row.cgstRate * 100).toFixed(1)}%</td>
                <td style={tdR}>
                  {row.cgstAmt.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td style={tdC}>{(row.sgstRate * 100).toFixed(1)}%</td>
                <td style={tdR}>
                  {row.sgstAmt.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td style={{ ...tdR, fontWeight: "700" }}>
                  {row.totalTax.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
            <tr style={{ background: accentLight }}>
              <td style={{ ...td, fontWeight: "800", color: accentDark }}>
                TOTAL
              </td>
              <td style={{ ...tdR, fontWeight: "700" }}>
                {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
              <td style={tdC} />
              <td style={{ ...tdR, fontWeight: "700" }}>
                {totalCgst.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </td>
              <td style={tdC} />
              <td style={{ ...tdR, fontWeight: "700" }}>
                {totalSgst.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </td>
              <td style={{ ...tdR, fontWeight: "800", color: accentDark }}>
                {(totalCgst + totalSgst).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </td>
            </tr>
          </tbody>
        </table>

        {/* TAX AMOUNT IN WORDS */}
        <div
          style={{
            borderTop: B,
            padding: "6px 14px",
            background: "#fafbff",
            fontSize: "9.5px",
          }}
        >
          <span style={{ fontWeight: "700", color: accentDark }}>
            Tax Amount (in words):{" "}
          </span>
          <span style={{ color: "#333" }}>
            INR {numberToWords(totalCgst + totalSgst)}
          </span>
        </div>

        {/* DECLARATION + SIGNATURE */}
        <div
          style={{
            borderTop: B,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
          }}
        >
          <div style={{ borderRight: B, padding: "12px 14px 24px 14px" }}>
            <div
              style={{
                fontSize: "8.5px",
                fontWeight: "700",
                color: "#555",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "5px",
              }}
            >
              Declaration:
            </div>
            <div
              style={{ fontSize: "9.5px", color: "#555", lineHeight: "1.6" }}
            >
              We declare that this invoice shows the actual price of the goods
              described and that all particulars are true and correct.
            </div>
          </div>
          <div
            style={{
              padding: "12px 14px 12px 14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "space-between",
              minHeight: "90px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontWeight: "800",
                color: accentDark,
                letterSpacing: "0.5px",
              }}
            >
              For INFINEXY FINANCE
            </div>
            {invoice.signatureUrl ? (
              <img
                src={invoice.signatureUrl}
                alt="Signature"
                style={{
                  maxWidth: "130px",
                  maxHeight: "55px",
                  objectFit: "contain",
                  margin: "6px 0",
                }}
              />
            ) : (
              <div style={{ height: "55px" }} />
            )}
            <div
              style={{
                fontSize: "9px",
                color: "#555",
                borderTop: `1.5px solid ${accentDark}`,
                paddingTop: "4px",
                width: "150px",
                textAlign: "center",
                fontWeight: "600",
              }}
            >
              Authorized Signatory
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            borderTop: B,
            background: accentLight,
            padding: "5px 14px",
            textAlign: "center",
            fontSize: "8.5px",
            color: "#555",
            fontStyle: "italic",
            letterSpacing: "0.3px",
          }}
        >
          This is a computer generated document and requires no signature.
        </div>

        {/* BOTTOM ACCENT BAR */}
        <div style={{ background: accentDark, height: "4px" }} />
      </div>
    </div>
  );
}
