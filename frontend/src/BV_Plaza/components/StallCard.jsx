/**
 * BV_Plaza/frontend/components/StallCard.jsx
 * Card component for displaying a stall in the buyer market
 */
import React from "react";

const BADGE_ONLINE  = { background: "#22c55e", color: "#fff" };
const BADGE_OFFLINE = { background: "#94a3b8", color: "#fff" };

const StallCard = ({ stall, onClick }) => {
  const online = stall.isActuallyOnline;

  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        borderRadius: 16,
        border: `2px solid ${online ? "#bbf7d0" : "#e2e8f0"}`,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all .22s",
        boxShadow: online ? "0 4px 24px rgba(34,197,94,.15)" : "0 2px 12px rgba(0,0,0,.06)",
        position: "relative",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,0,0,.14)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = online ? "0 4px 24px rgba(34,197,94,.15)" : "0 2px 12px rgba(0,0,0,.06)"; }}
    >
      {/* Online/Offline Badge */}
      <div style={{
        position: "absolute", top: 12, right: 12, zIndex: 2,
        display: "flex", alignItems: "center", gap: 5,
        padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
        ...( online ? BADGE_ONLINE : BADGE_OFFLINE ),
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: online ? "#fff" : "#cbd5e1",
          animation: online ? "pulse 1.5s ease-in-out infinite" : "none",
        }}/>
        {online ? "LIVE" : "Offline"}
      </div>

      {/* Logo / Banner */}
      <div style={{
        height: 100,
        background: stall.logo?.url
          ? `url(${stall.logo.url}) center/cover`
          : "linear-gradient(135deg,#4f46e5,#7c3aed)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {!stall.logo?.url && (
          <div style={{ fontSize: 36, color: "rgba(255,255,255,.8)" }}>
            {stall.shopName?.[0]?.toUpperCase() || "🏪"}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "16px 16px 14px" }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {stall.shopName}
        </div>
        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {stall.description || "Welcome to our stall!"}
        </div>

        {/* Categories */}
        {stall.categories?.length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
            {stall.categories.slice(0, 3).map(c => (
              <span key={c} style={{ background: "#f1f5f9", color: "#475569", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20 }}>
                {c}
              </span>
            ))}
          </div>
        )}

        {/* Rating */}
        {stall.numReviews > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#f59e0b" }}>
            {"★".repeat(Math.round(stall.rating))}{"☆".repeat(5 - Math.round(stall.rating))}
            <span style={{ color: "#94a3b8", fontSize: 11 }}>({stall.numReviews})</span>
          </div>
        )}

        {/* CTA */}
        <div style={{
          marginTop: 12, padding: "8px 0", textAlign: "center",
          background: online ? "linear-gradient(135deg,#10b981,#059669)" : "#f1f5f9",
          color: online ? "#fff" : "#64748b",
          borderRadius: 10, fontSize: 13, fontWeight: 700,
        }}>
          {online ? "Visit Live Stall →" : "Browse Products →"}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
    </div>
  );
};

export default StallCard;
