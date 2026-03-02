import type { Expense, UserProfile } from "../backend.d";
import { formatDate } from "../utils/formatting";
import { BillHeader } from "./BillHeader";

interface ExpensePrintViewProps {
  expense: Expense;
  profile: UserProfile | null;
}

export function ExpensePrintView({ expense, profile }: ExpensePrintViewProps) {
  const styles: Record<string, React.CSSProperties> = {
    page: {
      fontFamily: "Arial, sans-serif",
      background: "white",
      color: "#1a1a2e",
      padding: "32px",
      maxWidth: "800px",
      margin: "0 auto",
      fontSize: "13px",
      lineHeight: "1.5",
    },
    titleRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "24px",
    },
    titleLeft: {
      fontSize: "26px",
      fontWeight: "800",
      color: "#1a2456",
      letterSpacing: "2px",
    },
    titleRight: {
      textAlign: "right" as const,
      color: "#333",
    },
    detailsCard: {
      background: "#f8f9ff",
      border: "1px solid #d0d8f0",
      borderRadius: "8px",
      padding: "20px",
      marginBottom: "20px",
    },
    detailRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "10px 0",
      borderBottom: "1px solid #e0e8f0",
      fontSize: "14px",
    },
    label: {
      color: "#555",
      fontWeight: "600",
    },
    value: {
      color: "#1a2456",
      fontWeight: "500",
    },
    amountBox: {
      background: "#1a2456",
      color: "white",
      borderRadius: "8px",
      padding: "16px 24px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
    },
    amountLabel: {
      fontSize: "16px",
      fontWeight: "600",
    },
    amountValue: {
      fontSize: "28px",
      fontWeight: "800",
    },
  };

  return (
    <div style={styles.page}>
      <BillHeader profile={profile} />

      <div style={styles.titleRow}>
        <div style={styles.titleLeft}>EXPENSE VOUCHER</div>
        <div style={styles.titleRight}>
          <div>
            <strong>Expense No:</strong> {expense.id}
          </div>
          <div>
            <strong>Expense Date:</strong> {formatDate(expense.expenseDate)}
          </div>
          <div>
            <strong>Place of Supply:</strong>{" "}
            {expense.placeOfSupply || "24-Gujarat"}
          </div>
        </div>
      </div>

      <div style={styles.amountBox}>
        <span style={styles.amountLabel}>Total Expense Amount</span>
        <span style={styles.amountValue}>
          ₹
          {Number(expense.amount).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}
        </span>
      </div>

      <div style={styles.detailsCard}>
        <div style={styles.detailRow}>
          <span style={styles.label}>Category</span>
          <span style={styles.value}>{expense.category}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.label}>Payment Type</span>
          <span style={styles.value}>{expense.paymentType}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.label}>Payment Date</span>
          <span style={styles.value}>{formatDate(expense.paymentDate)}</span>
        </div>
        {expense.notes && (
          <div
            style={{
              ...styles.detailRow,
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <span style={styles.label}>Payment Notes</span>
            <span
              style={{
                ...styles.value,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {expense.notes}
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "40px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "160px",
              borderTop: "1px solid #333",
              paddingTop: "6px",
              fontSize: "11px",
              color: "#555",
            }}
          >
            Authorized Signature
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "24px",
          paddingTop: "12px",
          borderTop: "2px solid #1a2456",
          fontSize: "11px",
          color: "#888",
          textAlign: "center",
        }}
      >
        INFINEXY FINANCE — This is a computer-generated document
      </div>
    </div>
  );
}
