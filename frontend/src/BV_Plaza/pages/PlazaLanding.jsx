/**
 * BV_Plaza/frontend/pages/PlazaLanding.jsx
 * Landing page — user chooses: Buyer or Shop Owner
 */
import React from "react";

const PlazaLanding = ({ onChoose, setting }) => {
  const title   = setting?.title   || "BV Plaza";
  const tagline = setting?.tagline || "India's Live Shopping Marketplace";

  return (
    <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: "linear-gradient(160deg,#f8f4ff 0%,#eef2ff 50%,#fdf4ff 100%)" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 52 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🏪</div>
        <h1 style={{ fontSize: "clamp(32px,5vw,52px)", fontWeight: 800, color: "#1e1b4b", margin: 0, letterSpacing: -1 }}>
          {title}
        </h1>
        <p style={{ fontSize: "clamp(15px,2vw,20px)", color: "#6b7280", marginTop: 12, maxWidth: 480 }}>
          {tagline}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
          {["Live Video Shopping","Real-time Chat","Secure Payments"].map(f => (
            <span key={f} style={{ background: "#ede9fe", color: "#6d28d9", padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
              ✦ {f}
            </span>
          ))}
        </div>
      </div>

      {/* Choice cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 24, width: "100%", maxWidth: 680 }}>
        {/* Buyer */}
        <ChoiceCard
          emoji="🛍️"
          title="I'm a Buyer"
          subtitle="Browse live and offline stalls, chat with sellers, and buy unique products directly"
          features={["Live video shopping","Chat with stall owners","Filter & discover stalls","Secure payments"]}
          cta="Browse Stalls →"
          gradient="linear-gradient(135deg,#4f46e5,#7c3aed)"
          onClick={() => onChoose("buyer")}
        />
        {/* Shop Owner */}
        <ChoiceCard
          emoji="🧑‍💼"
          title="I'm a Shop Owner"
          subtitle="Set up your virtual stall, sell live via video, manage orders & earn"
          features={["1 month FREE trial","Live video stall","Product management","Wallet & withdrawals"]}
          cta="Open My Stall →"
          gradient="linear-gradient(135deg,#059669,#10b981)"
          onClick={() => onChoose("shopowner")}
          badge="FREE to start"
        />
      </div>

      {/* Pricing note */}
      <div style={{ marginTop: 36, textAlign: "center", fontSize: 13, color: "#9ca3af" }}>
        Shop owners: 1 month free · Then ₹499/month or ₹4,999/year
      </div>
    </div>
  );
};

const ChoiceCard = ({ emoji, title, subtitle, features, cta, gradient, onClick, badge }) => (
  <div
    onClick={onClick}
    style={{ background: "#fff", borderRadius: 20, border: "1px solid #e5e7eb", padding: 28, cursor: "pointer", transition: "all .25s", boxShadow: "0 4px 16px rgba(0,0,0,.06)", position: "relative" }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,.12)"; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.06)"; }}
  >
    {badge && (
      <div style={{ position: "absolute", top: -12, right: 20, background: "#f59e0b", color: "#fff", padding: "4px 14px", borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
        {badge}
      </div>
    )}
    <div style={{ fontSize: 44, marginBottom: 12 }}>{emoji}</div>
    <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#1e293b" }}>{title}</h2>
    <p style={{ margin: "0 0 20px", fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>{subtitle}</p>
    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 8 }}>
      {features.map(f => (
        <li key={f} style={{ fontSize: 13, color: "#475569", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#22c55e", fontWeight: 700 }}>✓</span> {f}
        </li>
      ))}
    </ul>
    <button style={{ width: "100%", padding: "13px 0", background: gradient, border: "none", borderRadius: 14, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
      {cta}
    </button>
  </div>
);

export default PlazaLanding;
