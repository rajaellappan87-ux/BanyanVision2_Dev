/**
 * BV_Plaza/frontend/pages/ShopOwnerSignup.jsx
 * Shop owner registration and subscription details
 */
import React, { useState } from "react";
import { apiPlazaRegisterShop } from "../plazaApi";

const fmt = n => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const MONTHLY_PRICE = 499;
const YEARLY_PRICE  = 4999;
const YEARLY_SAVING = MONTHLY_PRICE * 12 - YEARLY_PRICE; // ₹989

const CATEGORIES = [
  "Clothing & Fashion","Electronics","Food & Groceries","Home Decor",
  "Jewellery & Accessories","Health & Beauty","Books & Stationery",
  "Toys & Kids","Sports & Fitness","Art & Crafts","Handloom & Textiles","Other",
];

const ShopOwnerSignup = ({ user, onSuccess, onBack, toast }) => {
  const [step, setStep] = useState(1); // 1=details, 2=subscription, 3=success
  const [form, setForm] = useState({
    shopName:    "",
    description: "",
    categories:  [],
    termsAccepted: false,
  });
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState("monthly");

  if (!user) {
    return (
      <div style={{ maxWidth: 420, margin: "80px auto", textAlign: "center", padding: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b" }}>Login Required</h2>
        <p style={{ color: "#64748b", fontSize: 14 }}>Please login to register your stall on BV Plaza</p>
        <button onClick={onBack} style={{ marginTop: 16, padding: "12px 32px", background: "#4f46e5", border: "none", borderRadius: 14, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
          Go Back
        </button>
      </div>
    );
  }

  const toggleCategory = (cat) => {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat) ? f.categories.filter(c => c !== cat) : [...f.categories, cat],
    }));
  };

  const submitDetails = async () => {
    if (!form.shopName.trim()) { toast?.("Enter shop name", "error"); return; }
    if (form.categories.length === 0) { toast?.("Select at least one category", "error"); return; }
    if (!form.termsAccepted) { toast?.("Accept terms & conditions", "error"); return; }
    setStep(2);
  };

  const submitRegistration = async () => {
    setLoading(true);
    try {
      await apiPlazaRegisterShop({ ...form, subscriptionPlan: plan });
      setStep(3);
      onSuccess?.();
    } catch (err) {
      toast?.(err.response?.data?.message || "Registration failed", "error");
    }
    setLoading(false);
  };

  const iStyle = { width: "100%", padding: "12px 14px", border: "1.5px solid #e2e8f0", borderRadius: 12, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#f8fafc" };
  const lStyle = { display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: .5 };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px" }}>
      {/* Back */}
      <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 14, cursor: "pointer", color: "#64748b", marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>
        ← Back
      </button>

      {/* Progress */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        {[1,2,3].map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 4, background: step >= s ? "#4f46e5" : "#e2e8f0", transition: "background .3s" }}/>
        ))}
      </div>

      {/* ── Step 1: Details ───────────────────────────────────────────── */}
      {step === 1 && (
        <div>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🏪</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", margin: 0 }}>Set Up Your Stall</h1>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 6 }}>Fill in your stall details to get started</p>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={lStyle}>Shop Name *</label>
            <input style={iStyle} value={form.shopName} onChange={e => setForm(f => ({ ...f, shopName: e.target.value }))} placeholder="e.g. Priya's Handloom House"/>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={lStyle}>Short Description</label>
            <textarea style={{ ...iStyle, resize: "vertical", minHeight: 80 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Tell buyers what you sell (max 500 chars)" maxLength={500}/>
            <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "right", marginTop: 3 }}>{form.description.length}/500</div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={lStyle}>Product Categories * (select all that apply)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => toggleCategory(cat)}
                  style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${form.categories.includes(cat) ? "#4f46e5" : "#e2e8f0"}`, background: form.categories.includes(cat) ? "#ede9fe" : "#fff", color: form.categories.includes(cat) ? "#4f46e5" : "#64748b", fontSize: 12, fontWeight: form.categories.includes(cat) ? 700 : 500, cursor: "pointer", transition: "all .15s" }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* T&C */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px", marginBottom: 24, fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
            <strong style={{ color: "#1e293b" }}>Terms & Conditions</strong><br/>
            • 1 month FREE trial, no credit card required<br/>
            • After trial: ₹499/month or ₹4,999/year<br/>
            • 10% processing fee on wallet withdrawals<br/>
            • BV Plaza reserves the right to remove stalls violating policies<br/>
            • All transactions are final unless disputed within 7 days
          </div>

          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 24 }}>
            <input type="checkbox" checked={form.termsAccepted} onChange={e => setForm(f => ({ ...f, termsAccepted: e.target.checked }))} style={{ marginTop: 2 }}/>
            <span style={{ fontSize: 13, color: "#475569" }}>
              I agree to the Terms & Conditions and understand the subscription pricing
            </span>
          </label>

          <button onClick={submitDetails} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", border: "none", borderRadius: 14, color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer" }}>
            Continue →
          </button>
        </div>
      )}

      {/* ── Step 2: Subscription ──────────────────────────────────────── */}
      {step === 2 && (
        <div>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>💳</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", margin: 0 }}>Choose Your Plan</h1>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 6 }}>You get 1 month FREE first — no charges today!</p>
          </div>

          {/* Trial badge */}
          <div style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1.5px solid #86efac", borderRadius: 16, padding: "16px 20px", marginBottom: 24, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>🎁</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#15803d" }}>1 Month FREE Trial</div>
            <div style={{ fontSize: 13, color: "#16a34a", marginTop: 4 }}>No payment needed to start. Upgrade anytime.</div>
          </div>

          {/* Plan selector */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
            <PlanCard
              name="Monthly"
              price={MONTHLY_PRICE}
              period="month"
              selected={plan === "monthly"}
              onClick={() => setPlan("monthly")}
              note="Flexible, cancel anytime"
            />
            <PlanCard
              name="Yearly"
              price={YEARLY_PRICE}
              period="year"
              perMonth={Math.round(YEARLY_PRICE / 12)}
              selected={plan === "yearly"}
              onClick={() => setPlan("yearly")}
              badge={`SAVE ${fmt(YEARLY_SAVING)}`}
              note="Best value — 2 months free!"
            />
          </div>

          <div style={{ background: "#fafafa", border: "1px solid #f1f5f9", borderRadius: 14, padding: "14px 16px", marginBottom: 24, fontSize: 13, color: "#64748b" }}>
            <strong style={{ color: "#1e293b" }}>What's included:</strong>
            <ul style={{ margin: "8px 0 0", paddingLeft: 20, lineHeight: 2 }}>
              <li>Unlimited product listings</li>
              <li>Live video stall & chat</li>
              <li>Wallet with instant withdrawal</li>
              <li>Custom discounts & coupons</li>
              <li>Order management dashboard</li>
            </ul>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep(1)} style={{ flex: "0 0 auto", padding: "14px 24px", background: "#f1f5f9", border: "none", borderRadius: 14, fontWeight: 700, cursor: "pointer", color: "#64748b" }}>
              ← Back
            </button>
            <button onClick={submitRegistration} disabled={loading} style={{ flex: 1, padding: "14px", background: "linear-gradient(135deg,#059669,#10b981)", border: "none", borderRadius: 14, color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer" }}>
              {loading ? "Setting up your stall…" : "Start FREE Trial →"}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Success ───────────────────────────────────────────── */}
      {step === 3 && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", margin: "0 0 10px" }}>Stall Created!</h1>
          <p style={{ color: "#64748b", fontSize: 15, maxWidth: 380, margin: "0 auto 28px", lineHeight: 1.7 }}>
            Welcome to BV Plaza! Your 1-month free trial has started. Set up your products, go online, and start selling.
          </p>
          <div style={{ background: "#ede9fe", borderRadius: 16, padding: "16px 20px", marginBottom: 28, display: "inline-block" }}>
            <div style={{ fontWeight: 700, color: "#4f46e5", fontSize: 14 }}>Next Steps:</div>
            <ul style={{ textAlign: "left", fontSize: 13, color: "#6d28d9", margin: "8px 0 0", paddingLeft: 20, lineHeight: 2 }}>
              <li>Add your products</li>
              <li>Upload your stall logo</li>
              <li>Add bank details for withdrawals</li>
              <li>Go LIVE and start selling!</li>
            </ul>
          </div>
          <button onClick={onSuccess} style={{ width: "100%", maxWidth: 340, padding: "14px", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", border: "none", borderRadius: 14, color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer" }}>
            Go to My Dashboard →
          </button>
        </div>
      )}
    </div>
  );
};

const PlanCard = ({ name, price, period, perMonth, selected, onClick, badge, note }) => (
  <div onClick={onClick} style={{ border: `2px solid ${selected ? "#4f46e5" : "#e2e8f0"}`, borderRadius: 16, padding: "16px 14px", cursor: "pointer", background: selected ? "#ede9fe" : "#fff", position: "relative", transition: "all .2s", textAlign: "center" }}>
    {badge && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#f59e0b", color: "#fff", padding: "3px 12px", borderRadius: 20, fontSize: 10, fontWeight: 800, whiteSpace: "nowrap" }}>{badge}</div>}
    <div style={{ fontWeight: 800, fontSize: 16, color: selected ? "#4f46e5" : "#1e293b", marginBottom: 6 }}>{name}</div>
    <div style={{ fontSize: 28, fontWeight: 900, color: selected ? "#4f46e5" : "#1e293b" }}>₹{price.toLocaleString("en-IN")}</div>
    <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>/{period}</div>
    {perMonth && <div style={{ fontSize: 12, color: "#22c55e", fontWeight: 700, marginBottom: 6 }}>≈ ₹{perMonth}/month</div>}
    <div style={{ fontSize: 11, color: "#94a3b8" }}>{note}</div>
    {selected && <div style={{ marginTop: 10, fontSize: 11, fontWeight: 800, color: "#4f46e5" }}>✓ SELECTED</div>}
  </div>
);

export default ShopOwnerSignup;
