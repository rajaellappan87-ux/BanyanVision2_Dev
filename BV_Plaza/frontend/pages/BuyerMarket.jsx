/**
 * BV_Plaza/frontend/pages/BuyerMarket.jsx
 * Buyer's view — browse all stalls, filter, and visit
 */
import React, { useState, useEffect, useCallback } from "react";
import { apiPlazaGetStalls } from "../plazaApi";
import StallCard from "../components/StallCard";

const BuyerMarket = ({ onVisitStall, onBack }) => {
  const [stalls,   setStalls]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all"); // all | online | offline
  const [category, setCategory] = useState("");

  const allCategories = [...new Set(stalls.flatMap(s => s.categories || []))].filter(Boolean);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)            params.search   = search;
      if (category)          params.category = category;
      if (filter === "online") params.online = "true";
      const r = await apiPlazaGetStalls(params);
      let list = r.data?.stalls || [];
      if (filter === "offline") list = list.filter(s => !s.isActuallyOnline);
      setStalls(list);
    } catch { setStalls([]); }
    setLoading(false);
  }, [search, category, filter]);

  useEffect(() => { load(); }, [load]);

  // Live stalls first
  const sorted = [...stalls].sort((a, b) => (b.isActuallyOnline ? 1 : 0) - (a.isActuallyOnline ? 1 : 0));
  const liveCount = stalls.filter(s => s.isActuallyOnline).length;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}>←</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#1e293b" }}>BV Plaza Market</h1>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
            {liveCount > 0 ? (
              <span>🟢 <strong style={{ color: "#22c55e" }}>{liveCount} live</strong> · {stalls.length} total stalls</span>
            ) : (
              <span>{stalls.length} stalls available</span>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24, alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search stalls..."
            style={{ width: "100%", padding: "10px 12px 10px 36px", border: "1.5px solid #e2e8f0", borderRadius: 12, fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* Online filter */}
        {["all","online","offline"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "10px 18px", borderRadius: 12, border: "1.5px solid", borderColor: filter === f ? "#4f46e5" : "#e2e8f0", background: filter === f ? "#ede9fe" : "#fff", color: filter === f ? "#4f46e5" : "#64748b", fontWeight: filter === f ? 700 : 500, fontSize: 13, cursor: "pointer", textTransform: "capitalize" }}>
            {f === "online" ? "🟢 Live" : f === "offline" ? "⚫ Offline" : "All"}
          </button>
        ))}

        {/* Category filter */}
        {allCategories.length > 0 && (
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 12, fontSize: 13, background: "#fff", color: "#475569", outline: "none" }}>
            <option value="">All Categories</option>
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Stalls grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏪</div>
          Loading stalls…
        </div>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <div style={{ fontWeight: 600 }}>No stalls found</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Try different filters</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 20 }}>
          {sorted.map(stall => (
            <StallCard key={stall._id} stall={stall} onClick={() => onVisitStall(stall._id)}/>
          ))}
        </div>
      )}
    </div>
  );
};

export default BuyerMarket;
