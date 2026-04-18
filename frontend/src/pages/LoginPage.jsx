import React, { useState, useEffect } from "react";
import { useBreakpoint } from "../hooks";
import { useSettings } from "../store/contentStore";
import { useAuth } from "../context/AuthContext";
import { apiForgotPassword, apiResetPassword } from "../api";

const LoginPage = ({ setPage, toast, resetToken = "", clearResetToken }) => {
  const { isMobile } = useBreakpoint();
  const st = useSettings();
  const { login, register } = useAuth();

  // tab: "login" | "register" | "forgot" | "reset"
  const [tab, setTab]       = useState(resetToken ? "reset" : "login");
  // For register: "email" | "phone"
  const [regMode, setRegMode] = useState("email");
  const [form, setForm]     = useState({ name: "", email: "", phone: "", identifier: "", password: "", confirm: "" });
  const [err, setErr]       = useState("");
  const [msg, setMsg]       = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (resetToken) { setTab("reset"); setErr(""); setMsg(""); }
  }, [resetToken]);

  const iStyle = {
    background: "var(--ivory2)", border: "1.5px solid var(--border2)", color: "var(--text)",
    padding: "14px 16px", fontSize: 14, borderRadius: 12, outline: "none",
    width: "100%", boxSizing: "border-box", fontWeight: 500, transition: "border-color .2s",
  };

  const goTab = (t) => {
    setTab(t); setErr(""); setMsg("");
    if (t !== "reset" && clearResetToken) clearResetToken();
  };

  const handle = async () => {
    setLoading(true); setErr(""); setMsg("");
    try {
      if (tab === "login") {
        const u = await login(form.identifier, form.password);
        toast(`Welcome back, ${u.name}!`);
        setPage("home");
      } else if (tab === "register") {
        const email = regMode === "email" ? form.email : "";
        const phone = regMode === "phone" ? form.phone : "";
        const u = await register(form.name, email, form.password, phone);
        toast(`Welcome, ${u.name}!`);
        setPage("home");
      } else if (tab === "forgot") {
        const r = await apiForgotPassword(form.email);
        setMsg(r.data.message || "Reset link sent! Check your inbox.");
      } else if (tab === "reset") {
        if (form.password !== form.confirm) { setErr("Passwords do not match"); setLoading(false); return; }
        await apiResetPassword(resetToken, form.password);
        toast("Password updated! Please sign in.");
        if (clearResetToken) clearResetToken();
        goTab("login");
      }
    } catch (e) { setErr(e.response?.data?.message || "Something went wrong"); }
    setLoading(false);
  };

  const leftPanel = (
    <div style={{ background: "linear-gradient(160deg,var(--rose) 0%,var(--saffron) 50%,var(--purple) 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,.07)" }}/>
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 250, height: 250, borderRadius: "50%", background: "rgba(255,255,255,.05)" }}/>
      <div style={{ position: "relative", textAlign: "center", maxWidth: 380 }}>
        <img src="/bv.jpg" alt="BanyanVision" style={{ width: 120, height: 120, objectFit: "contain", margin: "0 auto 16px", background: "transparent" }}/>
        <div style={{ fontFamily: "var(--font-d)", fontSize: 40, fontWeight: 700, color: "#fff", marginBottom: 6, letterSpacing: .5 }}>BanyanVision</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.75)", letterSpacing: 3, fontWeight: 700, textTransform: "uppercase", marginBottom: 32 }}>Empowering Dreams, Inspiring Innovations</div>
        <p style={{ color: "rgba(255,255,255,.8)", fontSize: 15, lineHeight: 1.85, marginBottom: 32 }}>India's finest handcrafted fashion destination. Real Razorpay payments, real artisans, real heritage.</p>
        <div style={{ background: "rgba(255,255,255,.12)", borderRadius: "20px", padding: "20px 24px", textAlign: "left", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,.15)" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.75)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Why Shop With Us</div>
          {[["Handcrafted","Verified Indian master artisans only"],["Secure Payments","Razorpay — UPI, Cards, EMI, NetBanking"],...(st.returnsEnabled ? [["Easy Returns",`${st.returnDays||7}-day hassle-free return policy`]] : []),["Fast Delivery",`${st.standardDays||"3–7 business days"} across India`]].map(([t, d]) => (
            <div key={t} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)", marginTop: 5, flexShrink: 0 }}/>
              <div>
                <div style={{ fontSize: 13, color: "#fff", fontWeight: 700, marginBottom: 2 }}>{t}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.65)" }}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const formTitle = { login: "Welcome Back!", register: "Create Account", forgot: "Forgot Password?", reset: "Set New Password" }[tab];
  const formSub   = {
    login: "Sign in with your email or phone number",
    register: "Join thousands of happy shoppers",
    forgot: "Enter your email to receive a reset link",
    reset: "Choose a strong new password",
  }[tab];

  const rightPanel = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "48px 24px" : 60, background: "var(--ivory)" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {isMobile && (
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <img src="/bv.jpg" alt="BanyanVision" style={{ width: 100, height: 100, objectFit: "contain", margin: "0 auto 10px", background: "transparent" }}/>
            <div style={{ fontFamily: "var(--font-d)", fontSize: 26, fontWeight: 700, color: "var(--dark)" }}>BanyanVision</div>
          </div>
        )}

        <h2 style={{ fontFamily: "var(--font-d)", fontSize: 28, fontWeight: 700, color: "var(--dark)", marginBottom: 6 }}>{formTitle}</h2>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24, fontWeight: 500 }}>{formSub}</p>

        {/* Login / Register tab switch */}
        {(tab === "login" || tab === "register") && (
          <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "var(--ivory3)", borderRadius: 12, padding: 4 }}>
            {["login","register"].map(t => (
              <button key={t} onClick={() => goTab(t)} style={{ flex: 1, padding: "10px 0", background: tab === t ? "#fff" : "transparent", border: "none", borderRadius: 10, color: tab === t ? "var(--rose)" : "var(--muted)", fontWeight: 700, cursor: "pointer", fontSize: 13, transition: "all .2s", boxShadow: tab === t ? "0 2px 10px rgba(0,0,0,.08)" : "none" }}>
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>
        )}

        {/* Back link for forgot/reset */}
        {(tab === "forgot" || tab === "reset") && (
          <button onClick={() => goTab("login")} style={{ background: "none", border: "none", color: "var(--rose)", fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 20, padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
            ← Back to Sign In
          </button>
        )}

        {/* ── REGISTER FIELDS ── */}
        {tab === "register" && (<>
          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 6 }}>Full Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={iStyle} placeholder="Your name"/>
          </div>

          {/* Email / Phone toggle */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)" }}>
                {regMode === "email" ? "Email Address" : "Phone Number"}
              </label>
              <button onClick={() => { setRegMode(m => m === "email" ? "phone" : "email"); setForm(f => ({ ...f, email: "", phone: "" })); setErr(""); }}
                style={{ background: "none", border: "none", fontSize: 11, fontWeight: 700, color: "var(--rose)", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                Use {regMode === "email" ? "Phone instead" : "Email instead"}
              </button>
            </div>

            {regMode === "email" ? (
              <input type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={iStyle} placeholder="you@example.com"/>
            ) : (
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, fontWeight: 700, color: "var(--text2)", pointerEvents: "none" }}>+91</span>
                <input type="tel" value={form.phone} maxLength={10}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, "") }))}
                  style={{ ...iStyle, paddingLeft: 52 }} placeholder="10-digit mobile number"/>
              </div>
            )}
          </div>
        </>)}

        {/* ── LOGIN FIELD (email or phone combined) ── */}
        {tab === "login" && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 6 }}>Email or Phone Number</label>
            <input value={form.identifier}
              onChange={e => setForm(f => ({ ...f, identifier: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && handle()}
              style={iStyle} placeholder="you@example.com or 9876543210"
              autoComplete="username"/>
          </div>
        )}

        {/* ── FORGOT PASSWORD field ── */}
        {tab === "forgot" && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 6 }}>Email Address</label>
            <input type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && handle()}
              style={iStyle} placeholder="you@example.com"/>
          </div>
        )}

        {/* Password */}
        {(tab === "login" || tab === "register" || tab === "reset") && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 6 }}>
              {tab === "reset" ? "New Password" : "Password"}
            </label>
            <input type="password" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && handle()}
              style={iStyle} placeholder="Min 6 characters"/>
          </div>
        )}

        {/* Confirm password (reset only) */}
        {tab === "reset" && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 6 }}>Confirm New Password</label>
            <input type="password" value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && handle()}
              style={iStyle} placeholder="Repeat password"/>
          </div>
        )}

        {/* Forgot password link (login tab) */}
        {tab === "login" && (
          <div style={{ textAlign: "right", marginBottom: 16, marginTop: -8 }}>
            <button onClick={() => goTab("forgot")} style={{ background: "none", border: "none", color: "var(--rose)", fontWeight: 600, fontSize: 12, cursor: "pointer", padding: 0 }}>
              Forgot Password?
            </button>
          </div>
        )}

        {/* Error */}
        {err && <div style={{ color: "#DC2626", fontSize: 13, marginBottom: 14, fontWeight: 600, padding: "10px 14px", background: "#FEF2F2", borderRadius: 10, border: "1px solid #FECACA" }}>⚠ {err}</div>}

        {/* Success */}
        {msg && (
          <div style={{ color: "#16A34A", fontSize: 13, marginBottom: 14, fontWeight: 600, padding: "12px 16px", background: "#F0FDF4", borderRadius: 10, border: "1px solid #BBF7D0", lineHeight: 1.5 }}>
            ✅ {msg}
          </div>
        )}

        <button className="btn btn-rose" onClick={handle} disabled={loading || !!msg}
          style={{ width: "100%", padding: "15px 0", fontSize: 15, marginBottom: 12, opacity: (loading || !!msg) ? .75 : 1 }}>
          {loading ? "Please wait…" : { login: "Sign In →", register: "Create Account →", forgot: "Send Reset Link →", reset: "Update Password →" }[tab]}
        </button>

        {(tab === "login" || tab === "register") && (
          <button className="btn btn-ghost" onClick={() => setPage("home")} style={{ width: "100%", padding: "13px 0", fontSize: 14 }}>Continue as Guest</button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
      {!isMobile && leftPanel}
      {rightPanel}
    </div>
  );
};

export default LoginPage;
