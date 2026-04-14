/**
 * BV_Plaza/frontend/components/PlazaAdminSettings.jsx
 * Admin panel for BV Plaza — toggle visibility, manage stalls & withdrawals
 */
import React, { useState, useEffect } from "react";
import {
  apiPlazaGetSetting, apiPlazaUpdateSetting,
  apiPlazaAdminGetStalls, apiPlazaAdminUpdateStall,
  apiPlazaAdminWithdrawals, apiPlazaAdminProcessWD,
} from "../plazaApi";

const fmt = n => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const PlazaAdminSettings = ({ toast }) => {
  const [setting,     setSetting]     = useState({ enabled: false, title: "BV Plaza", tagline: "" });
  const [stalls,      setStalls]      = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [tab,         setTab]         = useState("general");
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    // Load setting first (fast), then stalls/withdrawals separately (may be slow on first run)
    apiPlazaGetSetting()
      .then(r => setSetting(r.data.setting || {}))
      .catch(() => {})
      .finally(() => setLoading(false));

    apiPlazaAdminGetStalls()
      .then(r => setStalls(r.data.stalls || []))
      .catch(() => setStalls([]));

    apiPlazaAdminWithdrawals()
      .then(r => setWithdrawals(r.data.withdrawals || []))
      .catch(() => setWithdrawals([]));
  }, []);

  const saveSetting = async () => {
    setSaving(true);
    try {
      const r = await apiPlazaUpdateSetting(setting);
      setSetting(r.data.setting);
      toast?.("BV Plaza settings saved!");
    } catch (err) {
      toast?.(err.response?.data?.message || "Save failed", "error");
    }
    setSaving(false);
  };

  const toggleStall = async (stall, field) => {
    try {
      const r = await apiPlazaAdminUpdateStall(stall._id, { [field]: !stall[field] });
      setStalls(prev => prev.map(s => s._id === stall._id ? r.data.stall : s));
      toast?.("Updated");
    } catch (err) {
      toast?.(err.response?.data?.message || "Error", "error");
    }
  };

  const processWithdrawal = async (id, status) => {
    try {
      await apiPlazaAdminProcessWD(id, { status });
      setWithdrawals(prev => prev.map(w => w._id === id ? { ...w, status } : w));
      toast?.(`Withdrawal ${status}`);
    } catch (err) {
      toast?.(err.response?.data?.message || "Error", "error");
    }
  };

  const TABS = [["general","⚙️ General"],["stalls","🏪 Stalls"],["withdrawals","💰 Withdrawals"]];

  const iStyle = { background: "var(--ivory2,#f8fafc)", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
  const lStyle = { display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: .5 };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading Plaza settings…</div>;

  return (
    <div>
      {/* Tab nav */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "2px solid #f1f5f9", paddingBottom: 2 }}>
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding: "8px 18px", background: "none", border: "none", cursor: "pointer", fontWeight: tab === key ? 700 : 500, color: tab === key ? "#4f46e5" : "#64748b", borderBottom: tab === key ? "2px solid #4f46e5" : "2px solid transparent", marginBottom: -2, fontSize: 13, transition: "all .2s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ─ General ─ */}
      {tab === "general" && (
        <div style={{ maxWidth: 480 }}>
          {/* Toggle switch */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", background: setting.enabled ? "#f0fdf4" : "#fafafa", border: `2px solid ${setting.enabled ? "#86efac" : "#e2e8f0"}`, borderRadius: 16, marginBottom: 24 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>BV Plaza Visibility</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                {setting.enabled ? "Visible on home page" : "Hidden from users"}
              </div>
            </div>
            <div onClick={() => setSetting(s => ({ ...s, enabled: !s.enabled }))}
              style={{ width: 52, height: 28, background: setting.enabled ? "#22c55e" : "#cbd5e1", borderRadius: 14, cursor: "pointer", position: "relative", transition: "background .2s" }}>
              <div style={{ position: "absolute", top: 3, left: setting.enabled ? 27 : 3, width: 22, height: 22, background: "#fff", borderRadius: "50%", boxShadow: "0 1px 4px rgba(0,0,0,.2)", transition: "left .2s" }}/>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={lStyle}>Plaza Title</label>
            <input style={iStyle} value={setting.title || ""} onChange={e => setSetting(s => ({ ...s, title: e.target.value }))} placeholder="BV Plaza"/>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={lStyle}>Tagline</label>
            <input style={iStyle} value={setting.tagline || ""} onChange={e => setSetting(s => ({ ...s, tagline: e.target.value }))} placeholder="India's Live Shopping Marketplace"/>
          </div>

          <button onClick={saveSetting} disabled={saving} style={{ padding: "12px 32px", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      )}

      {/* ─ Stalls ─ */}
      {tab === "stalls" && (
        <div>
          <div style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>{stalls.length} stalls registered</div>
          {stalls.length === 0 && <div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>No stalls yet</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {stalls.map(stall => (
              <div key={stall._id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{stall.shopName}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{stall.owner?.name} · {stall.owner?.email}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: stall.subscriptionStatus === "trial" ? "#fef3c7" : stall.subscriptionStatus === "active" ? "#d1fae5" : "#fee2e2", color: stall.subscriptionStatus === "trial" ? "#92400e" : stall.subscriptionStatus === "active" ? "#065f46" : "#991b1b" }}>
                      {stall.subscriptionStatus?.toUpperCase()}
                    </span>
                    {stall.isOnline && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#d1fae5", color: "#065f46" }}>ONLINE</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <ToggleBtn
                    label={stall.isVerified ? "✓ Verified" : "Verify"}
                    active={stall.isVerified}
                    onClick={() => toggleStall(stall, "isVerified")}
                  />
                  <ToggleBtn
                    label={stall.isActive ? "Active" : "Disabled"}
                    active={stall.isActive}
                    onClick={() => toggleStall(stall, "isActive")}
                    danger={!stall.isActive}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─ Withdrawals ─ */}
      {tab === "withdrawals" && (
        <div>
          <div style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
            {withdrawals.filter(w => w.status === "pending").length} pending · {withdrawals.length} total
          </div>
          {withdrawals.length === 0 && <div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>No withdrawal requests</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {withdrawals.map(w => (
              <div key={w._id} style={{ background: "#fff", border: `1px solid ${w.status === "pending" ? "#fbbf24" : "#e2e8f0"}`, borderRadius: 14, padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{w.owner?.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{w.owner?.email}</div>
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 13 }}>Requested: <strong>{fmt(w.requestedAmount)}</strong></div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>Fee (10%): {fmt(w.processingFee)} · Net: <strong style={{ color: "#22c55e" }}>{fmt(w.netAmount)}</strong></div>
                      {w.bankDetail && (
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                          {w.bankDetail.bankName} · A/C: ···{w.bankDetail.accountNumber?.slice(-4)} · IFSC: {w.bankDetail.ifscCode}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <StatusBadge status={w.status}/>
                    {w.status === "pending" && (
                      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                        <button onClick={() => processWithdrawal(w._id, "completed")} style={{ padding: "6px 14px", background: "#22c55e", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          Approve
                        </button>
                        <button onClick={() => processWithdrawal(w._id, "rejected")} style={{ padding: "6px 14px", background: "#ef4444", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ToggleBtn = ({ label, active, onClick, danger }) => (
  <button onClick={onClick} style={{ padding: "6px 14px", background: active ? (danger ? "#fef2f2" : "#f0fdf4") : "#f8fafc", border: `1px solid ${active ? (danger ? "#fca5a5" : "#86efac") : "#e2e8f0"}`, borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", color: active ? (danger ? "#dc2626" : "#16a34a") : "#64748b", transition: "all .15s" }}>
  {label}
  </button>
);

const StatusBadge = ({ status }) => {
  const colors = { pending: ["#fef3c7","#92400e"], processing: ["#dbeafe","#1e40af"], completed: ["#d1fae5","#065f46"], rejected: ["#fee2e2","#991b1b"] };
  const [bg, text] = colors[status] || ["#f1f5f9","#64748b"];
  return <span style={{ background: bg, color: text, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{status?.toUpperCase()}</span>;
};

export default PlazaAdminSettings;
