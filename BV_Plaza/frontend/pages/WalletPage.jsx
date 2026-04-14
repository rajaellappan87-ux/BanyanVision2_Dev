/**
 * BV_Plaza/frontend/pages/WalletPage.jsx
 * Shop owner wallet — balance, transactions, and withdrawals
 */
import React, { useState, useEffect } from "react";
import { apiPlazaGetWallet, apiPlazaWithdraw } from "../plazaApi";

const fmt = n => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const PROCESSING_FEE = 10; // 10%

const WalletPage = ({ toast }) => {
  const [wallet,       setWallet]       = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals,  setWithdrawals]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [amount,       setAmount]       = useState("");
  const [withdrawing,  setWithdrawing]  = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiPlazaGetWallet();
      setWallet(r.data.wallet);
      setTransactions(r.data.transactions || []);
      setWithdrawals(r.data.withdrawals   || []);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const requestWithdrawal = async () => {
    const amt = Number(amount);
    if (!amt || amt < 100) { toast?.("Minimum withdrawal ₹100","error"); return; }
    if (wallet && amt > wallet.balance) { toast?.("Insufficient balance","error"); return; }
    setWithdrawing(true);
    try {
      const r = await apiPlazaWithdraw(amt);
      toast?.(r.data.message || "Withdrawal requested!");
      setAmount("");
      await load();
    } catch (err) {
      toast?.(err.response?.data?.message || "Error","error");
    }
    setWithdrawing(false);
  };

  const fee        = amount ? Math.round(Number(amount) * PROCESSING_FEE / 100) : 0;
  const netAmount  = amount ? Number(amount) - fee : 0;

  if (loading) return <div style={{ textAlign:"center", padding:60, color:"#94a3b8" }}>Loading wallet…</div>;

  return (
    <div>
      <h2 style={{ fontSize:18, fontWeight:800, marginBottom:20 }}>💰 My Wallet</h2>

      {/* Balance card */}
      <div style={{ background:"linear-gradient(135deg,#4f46e5,#7c3aed)", borderRadius:20, padding:"28px 32px", marginBottom:24, color:"#fff" }}>
        <div style={{ fontSize:12, fontWeight:700, opacity:.8, marginBottom:8, letterSpacing:1, textTransform:"uppercase" }}>Available Balance</div>
        <div style={{ fontSize:42, fontWeight:900, marginBottom:4 }}>
          {fmt(wallet?.balance || 0)}
        </div>
        <div style={{ display:"flex", gap:24, marginTop:16, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontSize:11, opacity:.7, textTransform:"uppercase", letterSpacing:.5 }}>Total Earned</div>
            <div style={{ fontWeight:700, fontSize:18 }}>{fmt(wallet?.totalEarned || 0)}</div>
          </div>
          <div>
            <div style={{ fontSize:11, opacity:.7, textTransform:"uppercase", letterSpacing:.5 }}>Total Withdrawn</div>
            <div style={{ fontWeight:700, fontSize:18 }}>{fmt(wallet?.totalWithdrawn || 0)}</div>
          </div>
        </div>
      </div>

      {/* Withdrawal */}
      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e2e8f0", padding:24, marginBottom:24 }}>
        <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:800 }}>Request Withdrawal</h3>
        <div style={{ display:"flex", gap:12, alignItems:"flex-end", flexWrap:"wrap" }}>
          <div style={{ flex:"1 1 200px" }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#64748b", marginBottom:6, textTransform:"uppercase" }}>Amount (₹)</label>
            <input
              type="number" value={amount} min="100"
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 1000"
              style={{ width:"100%", padding:"12px 14px", border:"1.5px solid #e2e8f0", borderRadius:12, fontSize:15, fontWeight:700, outline:"none", boxSizing:"border-box" }}
            />
          </div>
          <button onClick={requestWithdrawal} disabled={withdrawing || !amount}
            style={{ padding:"12px 28px", background:"linear-gradient(135deg,#059669,#10b981)", border:"none", borderRadius:12, color:"#fff", fontWeight:800, cursor:"pointer", fontSize:14, whiteSpace:"nowrap" }}>
            {withdrawing ? "Requesting…" : "Withdraw"}
          </button>
        </div>

        {amount && Number(amount) >= 100 && (
          <div style={{ marginTop:14, padding:"12px 16px", background:"#f8fafc", borderRadius:10, fontSize:13 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ color:"#64748b" }}>Requested</span>
              <span style={{ fontWeight:700 }}>{fmt(Number(amount))}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ color:"#ef4444" }}>Processing Fee (10%)</span>
              <span style={{ fontWeight:700, color:"#ef4444" }}>− {fmt(fee)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", paddingTop:8, borderTop:"1px solid #e2e8f0" }}>
              <span style={{ fontWeight:700, color:"#1e293b" }}>You'll Receive</span>
              <span style={{ fontWeight:900, fontSize:16, color:"#059669" }}>{fmt(netAmount)}</span>
            </div>
          </div>
        )}

        <div style={{ marginTop:12, fontSize:11, color:"#94a3b8" }}>
          ℹ️ 10% processing fee is deducted. Withdrawals are processed within 2-3 business days. Add bank details before requesting.
        </div>
      </div>

      {/* Withdrawal history */}
      {withdrawals.length > 0 && (
        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e2e8f0", padding:24, marginBottom:24 }}>
          <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:800 }}>Withdrawal History</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {withdrawals.map(w => {
              const colors = { pending:["#fef3c7","#92400e"], processing:["#dbeafe","#1e40af"], completed:["#d1fae5","#065f46"], rejected:["#fee2e2","#991b1b"] };
              const [bg, tc] = colors[w.status] || ["#f1f5f9","#64748b"];
              return (
                <div key={w._id} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 0", borderBottom:"1px solid #f8fafc" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{fmt(w.requestedAmount)} requested</div>
                    <div style={{ fontSize:12, color:"#64748b" }}>Fee: {fmt(w.processingFee)} · You get: {fmt(w.netAmount)} · {new Date(w.createdAt).toLocaleDateString("en-IN")}</div>
                  </div>
                  <span style={{ background:bg, color:tc, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>{w.status?.toUpperCase()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transactions */}
      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e2e8f0", padding:24 }}>
        <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:800 }}>Transactions ({transactions.length})</h3>
        {transactions.length === 0 ? (
          <div style={{ textAlign:"center", padding:32, color:"#94a3b8" }}>No transactions yet</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            {transactions.map(t => {
              const isCredit = t.type === "credit";
              return (
                <div key={t._id} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 0", borderBottom:"1px solid #f8fafc" }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", background:isCredit ? "#f0fdf4" : "#fef2f2", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
                    {isCredit ? "↓" : "↑"}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13, color:"#1e293b" }}>{t.description || t.type}</div>
                    <div style={{ fontSize:11, color:"#94a3b8" }}>{new Date(t.createdAt).toLocaleString("en-IN")}</div>
                  </div>
                  <div style={{ fontWeight:800, fontSize:15, color:isCredit ? "#059669" : "#ef4444" }}>
                    {isCredit ? "+" : "−"}{fmt(t.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletPage;
