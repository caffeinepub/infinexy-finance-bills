import type { UserProfile } from "../backend.d";

interface BillHeaderProps {
  profile: UserProfile | null;
}

export function BillHeader({ profile }: BillHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "16px",
        borderBottom: "3px solid #1a2456",
        paddingBottom: "16px",
        marginBottom: "20px",
      }}
    >
      <img
        src="/assets/generated/infinexy-logo.jpeg"
        alt="Infinexy Finance Logo"
        style={{ width: "90px", height: "60px", objectFit: "contain" }}
      />
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: "22px",
            fontWeight: "800",
            color: "#1a2456",
            letterSpacing: "0.5px",
            fontFamily: "Arial, sans-serif",
          }}
        >
          INFINEXY FINANCE
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2px 24px",
            marginTop: "6px",
            fontSize: "12px",
            color: "#333",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <span>
            <strong>GSTIN:</strong> {profile?.gstin || ""}
          </span>
          <span>
            <strong>PAN:</strong> {profile?.pan || ""}
          </span>
          <span>
            <strong>Mobile:</strong> {profile?.mobile || ""}
          </span>
          <span>
            <strong>Email:</strong> {profile?.email || ""}
          </span>
          <span style={{ gridColumn: "1 / -1" }}>
            <strong>Website:</strong> {profile?.website || ""}
          </span>
        </div>
      </div>
    </div>
  );
}
