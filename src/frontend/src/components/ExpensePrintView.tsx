import type { Expense, UserProfile } from "../backend.d";
import { formatDate } from "../utils/formatting";

type ExpenseWithSignature = Expense & { signatureUrl?: string };

interface ExpensePrintViewProps {
  expense: ExpenseWithSignature;
  profile: UserProfile | null;
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

export function ExpensePrintView({ expense, profile }: ExpensePrintViewProps) {
  const borderColor = "#2c3e7a";
  const accentDark = "#1a2456";
  const accentLight = "#e8ecf8";
  const B = `1px solid ${borderColor}`;
  const amount = Number(expense.amount);
  const amountInWords = numberToWords(amount);

  const labelStyle: React.CSSProperties = {
    fontSize: "8.5px",
    fontWeight: "700",
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

  const detailLabel: React.CSSProperties = {
    padding: "8px 14px",
    border: B,
    fontSize: "9.5px",
    fontWeight: "700",
    color: "#555",
    background: accentLight,
    textTransform: "uppercase",
    letterSpacing: "0.3px",
    width: "38%",
    verticalAlign: "middle",
  };
  const detailValue: React.CSSProperties = {
    padding: "8px 14px",
    border: B,
    fontSize: "11px",
    color: "#1a1a1a",
    verticalAlign: "middle",
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
            EXPENSE VOUCHER
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
            ORIGINAL
          </span>
        </div>

        {/* COMPANY + EXPENSE META */}
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

          {/* Expense Meta Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div
              style={{
                padding: "10px 12px",
                borderRight: B,
                borderBottom: B,
                background: "white",
              }}
            >
              <div style={labelStyle}>Expense No.</div>
              <div style={{ ...valueStyle, fontSize: "12px" }}>
                {expense.id}
              </div>
            </div>
            <div
              style={{
                padding: "10px 12px",
                borderBottom: B,
                background: "#fafbff",
              }}
            >
              <div style={labelStyle}>Expense Date</div>
              <div style={valueStyle}>{formatDate(expense.expenseDate)}</div>
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
                {expense.placeOfSupply || "24-GUJARAT"}
              </div>
            </div>
            <div style={{ padding: "10px 12px", background: "#fafbff" }}>
              <div style={labelStyle}>Payment Date</div>
              <div style={valueStyle}>{formatDate(expense.paymentDate)}</div>
            </div>
          </div>
        </div>

        {/* TOTAL AMOUNT HERO BOX */}
        <div
          style={{
            borderBottom: B,
            background: accentDark,
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "8.5px",
                color: "rgba(255,255,255,0.65)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "2px",
              }}
            >
              Total Expense Amount
            </div>
            <div
              style={{
                fontSize: "9.5px",
                color: "rgba(255,255,255,0.8)",
                fontStyle: "italic",
              }}
            >
              {amountInWords}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "26px",
                fontWeight: "900",
                color: "white",
                letterSpacing: "-0.5px",
              }}
            >
              ₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* EXPENSE DETAILS TABLE */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                style={{
                  padding: "6px 14px",
                  background: accentDark,
                  color: "white",
                  fontSize: "9.5px",
                  fontWeight: "700",
                  textAlign: "left",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  border: B,
                  width: "38%",
                }}
              >
                Field
              </th>
              <th
                style={{
                  padding: "6px 14px",
                  background: accentDark,
                  color: "white",
                  fontSize: "9.5px",
                  fontWeight: "700",
                  textAlign: "left",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  border: B,
                }}
              >
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={detailLabel}>Category</td>
              <td style={{ ...detailValue, fontWeight: "600" }}>
                {expense.category}
              </td>
            </tr>
            <tr>
              <td style={detailLabel}>Payment Type</td>
              <td style={detailValue}>{expense.paymentType}</td>
            </tr>
            <tr>
              <td style={detailLabel}>Expense Date</td>
              <td style={detailValue}>{formatDate(expense.expenseDate)}</td>
            </tr>
            <tr>
              <td style={detailLabel}>Payment Date</td>
              <td style={detailValue}>{formatDate(expense.paymentDate)}</td>
            </tr>
            {expense.notes && (
              <tr>
                <td style={detailLabel}>Payment Notes</td>
                <td
                  style={{
                    ...detailValue,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {expense.notes}
                </td>
              </tr>
            )}
            <tr style={{ background: accentDark }}>
              <td
                style={{
                  ...detailLabel,
                  background: "transparent",
                  color: "white",
                  fontSize: "11px",
                }}
              >
                Total Amount
              </td>
              <td
                style={{
                  padding: "10px 14px",
                  border: B,
                  fontSize: "16px",
                  fontWeight: "900",
                  color: "white",
                }}
              >
                ₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>

        {/* SPACER */}
        <div style={{ height: "20px", borderTop: "none" }} />

        {/* DECLARATION + SIGNATURE */}
        <div
          style={{
            borderTop: B,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
          }}
        >
          <div style={{ borderRight: B, padding: "12px 14px 28px 14px" }}>
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
              We declare that this expense voucher shows the actual amount spent
              and that all particulars are true and correct.
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
            {expense.signatureUrl ? (
              <img
                src={expense.signatureUrl}
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
