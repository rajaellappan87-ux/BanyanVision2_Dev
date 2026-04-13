/**
 * BV_Plaza/frontend/BVPlazaPanel.jsx
 * Attractive home page panel for BV Plaza
 * Only renders when admin has enabled BV Plaza
 * Import this into frontend/src/pages/HomePage.jsx
 */
import React, { useState, useEffect } from "react";
import { apiPlazaPublicSetting, apiPlazaGetStalls } from "./plazaApi";

const BVPlazaPanel = ({ setPage }) => {
  const [setting,   setSetting]   = useState(null);
  const [liveCount, setLiveCount] = useState(0);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      apiPlazaPublicSetting(),
      apiPlazaGetStalls({ online: "true" }),
    ]).then(([sr, stallsR]) => {
      setSetting(sr.data.setting);
      setLiveCount(stallsR.data?.stalls?.length || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Only render when enabled by admin
  if (loading || !setting?.enabled) return null;

  const title   = setting.title   || "BV Plaza";
  const tagline = setting.tagline || "India's Live Shopping Marketplace";

  return (
    <section style={{
      margin: "0",
      padding: "0 0 0",
      background: "linear-gradient(160deg,#1e1b4b 0%,#312e81 40%,#4c1d95 80%,#1e1b4b 100%)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative orbs */}
      <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(129,140,248,.2) 0%,transparent 70%)", top:-100, right:-100, pointerEvents:"none" }}/>
      <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,rgba(167,139,250,.15) 0%,transparent 70%)", bottom:-80, left:"5%", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle,rgba(251,191,36,.1) 0%,transparent 70%)", top:"30%", left:"40%", pointerEvents:"none" }}/>

      <div style={{ maxWidth:1200, margin:"0 auto", padding:"56px 36px", position:"relative" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:32, alignItems:"center", flexWrap:"wrap" }}>

          {/* Left: Text */}
          <div>
            {/* Live badge */}
            {liveCount > 0 && (
              <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:"rgba(34,197,94,.2)", border:"1px solid rgba(34,197,94,.4)", borderRadius:20, padding:"5px 14px", marginBottom:14 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"#22c55e", animation:"plazaPulse 1.5s infinite" }}/>
                <span style={{ fontSize:12, fontWeight:800, color:"#86efac", letterSpacing:.5 }}>
                  {liveCount} STALL{liveCount !== 1 ? "S" : ""} LIVE NOW
                </span>
              </div>
            )}

            <h2 style={{ margin:"0 0 10px", fontSize:"clamp(28px,4vw,48px)", fontWeight:900, color:"#fff", lineHeight:1.1 }}>
              {title}
            </h2>
            <p style={{ margin:"0 0 20px", fontSize:"clamp(14px,2vw,18px)", color:"rgba(199,210,254,.85)", maxWidth:500, lineHeight:1.7 }}>
              {tagline}
            </p>

            {/* Feature chips */}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:28 }}>
              {[
                { emoji:"📹", label:"Live Video Stalls" },
                { emoji:"💬", label:"Real-time Chat" },
                { emoji:"🛍️", label:"Buy Directly" },
                { emoji:"🧑‍💼", label:"Sell Your Products" },
              ].map(({ emoji, label }) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.15)", borderRadius:20, padding:"5px 12px" }}>
                  <span style={{ fontSize:14 }}>{emoji}</span>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,.9)", fontWeight:600 }}>{label}</span>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              <button
                onClick={() => setPage("plaza")}
                style={{
                  padding:"13px 32px", fontSize:15, fontWeight:800, cursor:"pointer", borderRadius:14,
                  background:"linear-gradient(135deg,#fbbf24,#f59e0b)", border:"none", color:"#1c1917",
                  boxShadow:"0 4px 20px rgba(251,191,36,.4)", transition:"transform .2s, box-shadow .2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 28px rgba(251,191,36,.5)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 4px 20px rgba(251,191,36,.4)"; }}
              >
                Shop Live 🛍️
              </button>
              <button
                onClick={() => setPage("plaza")}
                style={{ padding:"13px 28px", fontSize:14, fontWeight:700, cursor:"pointer", borderRadius:14, background:"rgba(255,255,255,.12)", border:"1.5px solid rgba(255,255,255,.25)", color:"#fff", backdropFilter:"blur(8px)", transition:"all .2s" }}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,.12)"; }}
              >
                Open a Stall →
              </button>
            </div>
          </div>

          {/* Right: Stats / Visuals */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, minWidth:200 }}>
            {[
              { val:liveCount > 0 ? `${liveCount}+` : "New!", label:"Live Stalls",     bg:"rgba(34,197,94,.15)",  border:"rgba(34,197,94,.3)",  color:"#86efac" },
              { val:"Free",                                    label:"To Register",      bg:"rgba(251,191,36,.15)", border:"rgba(251,191,36,.3)", color:"#fde68a" },
              { val:"₹499",                                    label:"Per Month",        bg:"rgba(129,140,248,.15)",border:"rgba(129,140,248,.3)",color:"#c7d2fe" },
              { val:"10%",                                     label:"Platform Fee",     bg:"rgba(167,139,250,.15)",border:"rgba(167,139,250,.3)",color:"#ddd6fe" },
            ].map(({ val, label, bg, border, color }) => (
              <div key={label} style={{ background:bg, border:`1px solid ${border}`, borderRadius:14, padding:"14px 16px", textAlign:"center" }}>
                <div style={{ fontWeight:900, fontSize:22, color, marginBottom:3 }}>{val}</div>
                <div style={{ fontSize:11, color:"rgba(199,210,254,.7)", fontWeight:600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes plazaPulse { 0%,100%{opacity:1}50%{opacity:.3} }
      `}</style>
    </section>
  );
};

export default BVPlazaPanel;
