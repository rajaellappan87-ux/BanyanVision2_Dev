/**
 * BV_Plaza/frontend/pages/ShopOwnerDashboard.jsx
 * Complete shop owner management dashboard
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  apiPlazaGetMyStall, apiPlazaUpdateMyStall, apiPlazaHeartbeat,
  apiPlazaGetMyProducts, apiPlazaCreateProduct, apiPlazaUpdateProduct, apiPlazaDeleteProduct,
  apiPlazaGetMyCoupons, apiPlazaCreateCoupon, apiPlazaDeleteCoupon,
  apiPlazaGetShopOrders, apiPlazaUpdateOrderStatus,
  apiPlazaGetBankDetail, apiPlazaSaveBankDetail,
} from "../plazaApi";
import WalletPage  from "./WalletPage";
import ChatWindow  from "../components/ChatWindow";
import VideoCall   from "../components/VideoCall";
import { PlazaProductImages, PlazaLogoUploader } from "../components/PlazaImageUploader";

const fmt = n => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const ShopOwnerDashboard = ({ user, socket, onBack, toast }) => {
  const [tab,      setTab]      = useState("overview");
  const [stall,    setStall]    = useState(null);
  const [products, setProducts] = useState([]);
  const [coupons,  setCoupons]  = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [bank,     setBank]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [isLive,   setIsLive]   = useState(false);
  const [activeBuyers, setActiveBuyers] = useState([]); // [{sessionId, buyerName}]
  const heartbeatRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [sr, pr, cr, or, br] = await Promise.all([
        apiPlazaGetMyStall(),
        apiPlazaGetMyProducts(),
        apiPlazaGetMyCoupons(),
        apiPlazaGetShopOrders(),
        apiPlazaGetBankDetail(),
      ]);
      setStall(sr.data.stall);
      setIsLive(sr.data.stall?.isActuallyOnline || false);
      setProducts(pr.data.products || []);
      setCoupons(cr.data.coupons || []);
      setOrders(or.data.orders || []);
      setBank(br.data.bank || null);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Socket: register as shop owner & track buyers
  useEffect(() => {
    if (!socket || !stall) return;
    socket.emit("shopowner:online", { stallId: stall._id, ownerId: user._id, stallName: stall.shopName });
    socket.on("buyer:joined", ({ sessionId, buyerName }) => {
      setActiveBuyers(prev => [...prev.filter(b => b.sessionId !== sessionId), { sessionId, buyerName }]);
    });
    socket.on("buyer:left", ({ sessionId }) => {
      setActiveBuyers(prev => prev.filter(b => b.sessionId !== sessionId));
    });
    return () => { socket.off("buyer:joined"); socket.off("buyer:left"); };
  }, [socket, stall, user]);

  // Heartbeat to keep stall online
  useEffect(() => {
    if (!isLive) { clearInterval(heartbeatRef.current); return; }
    apiPlazaHeartbeat(true);
    heartbeatRef.current = setInterval(() => apiPlazaHeartbeat(true), 60000);
    return () => clearInterval(heartbeatRef.current);
  }, [isLive]);

  const toggleLive = async () => {
    const next = !isLive;
    setIsLive(next);
    await apiPlazaHeartbeat(next);
    if (socket && stall) {
      if (next) socket.emit("shopowner:online", { stallId: stall._id, ownerId: user._id, stallName: stall.shopName });
      else      socket.emit("shopowner:offline", { stallId: stall._id });
    }
    toast?.(next ? "You are now LIVE! 🟢" : "Stall set to offline");
  };

  if (loading) return <div style={{ textAlign: "center", padding: 80, color: "#94a3b8" }}>Loading your dashboard…</div>;

  const TABS = [
    ["overview","🏠 Overview"],
    ["products","📦 Products"],
    ["orders","📋 Orders"],
    ["coupons","🎟️ Coupons"],
    ["bank","🏦 Bank Details"],
    ["wallet","💰 Wallet"],
  ];

  return (
    <div style={{ display: "flex", minHeight: "80vh", background: "#f8fafc" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: "#fff", borderRight: "1px solid #e2e8f0", padding: "20px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 20px 16px", fontSize: 10, letterSpacing: 3, color: "#4f46e5", textTransform: "uppercase", fontWeight: 800 }}>
          My Stall
        </div>
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", background: tab === key ? "#ede9fe" : "transparent", borderLeft: `3px solid ${tab === key ? "#4f46e5" : "transparent"}`, border: "none", color: tab === key ? "#4f46e5" : "#64748b", cursor: "pointer", fontSize: 13, fontWeight: tab === key ? 700 : 500, textAlign: "left", transition: "all .2s" }}>
            {label}
          </button>
        ))}
        <div style={{ padding: "16px 20px", borderTop: "1px solid #f1f5f9", marginTop: 16 }}>
          <button onClick={onBack} style={{ width: "100%", padding: "10px 0", background: "#f1f5f9", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#64748b" }}>
            ← Back to Plaza
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 28, overflowY: "auto" }}>

        {/* ── Overview ────────────────────────────────────────────────── */}
        {tab === "overview" && stall && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {/* Stall logo with upload */}
                <PlazaLogoUploader
                  currentLogo={stall.logo}
                  onLogoChange={logo => setStall(s => ({ ...s, logo }))}
                />
                <div>
                  <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1e293b" }}>{stall.shopName}</h1>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                    Trial: {stall.subscriptionStatus === "trial" ? `Ends ${new Date(stall.trialEndDate).toLocaleDateString("en-IN")}` : stall.subscriptionStatus}
                  </div>
                </div>
              </div>
              {/* LIVE toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {isLive && activeBuyers.length > 0 && (
                  <div style={{ fontSize: 12, color: "#22c55e", fontWeight: 700 }}>
                    👥 {activeBuyers.length} visitor{activeBuyers.length !== 1 ? "s" : ""}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", background: isLive ? "#f0fdf4" : "#f8fafc", border: `2px solid ${isLive ? "#86efac" : "#e2e8f0"}`, borderRadius: 16, cursor: "pointer" }} onClick={toggleLive}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: isLive ? "#22c55e" : "#cbd5e1", animation: isLive ? "pulse 1.5s infinite" : "none" }}/>
                  <span style={{ fontWeight: 800, fontSize: 14, color: isLive ? "#15803d" : "#64748b" }}>
                    {isLive ? "LIVE — Click to go Offline" : "OFFLINE — Click to go Live"}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16, marginBottom: 28 }}>
              {[
                ["Total Orders", orders.length, "📦"],
                ["Products", products.length, "🛍️"],
                ["Pending", orders.filter(o => o.status === "pending").length, "⏳"],
                ["Coupons", coupons.filter(c => c.active).length, "🎟️"],
              ].map(([label, val, icon]) => (
                <div key={label} style={{ background: "#fff", borderRadius: 16, padding: "20px 20px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 26, marginBottom: 8 }}>{icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#1e293b" }}>{val}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Active chat sessions (if live) */}
            {isLive && activeBuyers.length > 0 && (
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Live Visitors</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
                  {activeBuyers.map(buyer => (
                    <div key={buyer.sessionId} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                      <div style={{ padding: "10px 14px", background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#a3e635", animation: "pulse 1.5s infinite" }}/>
                        {buyer.buyerName}
                      </div>
                      <VideoCall socket={socket} sessionId={buyer.sessionId} stallId={stall._id} role="shopowner" myName={user.name}/>
                      <ChatWindow stallId={stall._id} sessionId={buyer.sessionId} senderType="shopowner" senderName={user.name} senderId={user._id} socket={socket} compact/>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isLive && (
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 32, textAlign: "center", color: "#94a3b8" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📴</div>
                <div style={{ fontWeight: 700, marginBottom: 6, color: "#1e293b" }}>You're offline</div>
                <div style={{ fontSize: 13 }}>Click the LIVE button above to start accepting visitors</div>
              </div>
            )}
          </div>
        )}

        {/* ── Products ─────────────────────────────────────────────────── */}
        {tab === "products" && <ProductsPanel products={products} setProducts={setProducts} stallId={stall?._id} toast={toast}/>}

        {/* ── Orders ───────────────────────────────────────────────────── */}
        {tab === "orders" && <OrdersPanel orders={orders} setOrders={setOrders} toast={toast}/>}

        {/* ── Coupons ──────────────────────────────────────────────────── */}
        {tab === "coupons" && <CouponsPanel coupons={coupons} setCoupons={setCoupons} toast={toast}/>}

        {/* ── Bank Details ─────────────────────────────────────────────── */}
        {tab === "bank" && <BankPanel bank={bank} setBank={setBank} stall={stall} setStall={setStall} toast={toast}/>}

        {/* ── Wallet ───────────────────────────────────────────────────── */}
        {tab === "wallet" && <WalletPage toast={toast}/>}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
};

// ── Products Panel ─────────────────────────────────────────────────────────────
const ProductsPanel = ({ products, setProducts, toast }) => {
  const [form,    setForm]    = useState({ name:"",description:"",price:"",originalPrice:"",category:"General",stock:"",discount:"",videoUrl:"" });
  const [images,  setImages]  = useState([]); // [{url, public_id}]
  const [editId,  setEditId]  = useState(null);
  const [saving,  setSaving]  = useState(false);

  const iStyle = { width:"100%", padding:"10px 12px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:13, outline:"none", boxSizing:"border-box" };
  const lStyle = { display:"block", fontSize:11, fontWeight:700, color:"#64748b", marginBottom:4, textTransform:"uppercase" };

  const resetForm = () => {
    setForm({ name:"",description:"",price:"",originalPrice:"",category:"General",stock:"",discount:"",videoUrl:"" });
    setImages([]);
    setEditId(null);
  };

  const save = async () => {
    if (!form.name || !form.price) { toast?.("Name and price required","error"); return; }
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock||0), discount: Number(form.discount||0), images };
      if (editId) {
        const r = await apiPlazaUpdateProduct(editId, payload);
        setProducts(prev => prev.map(p => p._id === editId ? r.data.product : p));
        toast?.("Product updated!");
      } else {
        const r = await apiPlazaCreateProduct(payload);
        setProducts(prev => [r.data.product, ...prev]);
        toast?.("Product added!");
      }
      resetForm();
    } catch (err) { toast?.(err.response?.data?.message || "Error","error"); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!window.confirm("Delete product?")) return;
    await apiPlazaDeleteProduct(id);
    setProducts(prev => prev.filter(p => p._id !== id));
    toast?.("Deleted");
  };

  const startEdit = (p) => {
    setForm({ name:p.name,description:p.description,price:p.price,originalPrice:p.originalPrice||"",category:p.category,stock:p.stock,discount:p.discount||0,videoUrl:p.videoUrl||"" });
    setImages(p.images || []);
    setEditId(p._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fmt = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);

  return (
    <div>
      <h2 style={{ fontSize:18, fontWeight:800, marginBottom:20 }}>{editId ? "Edit Product" : "Add Product"}</h2>
      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e2e8f0", padding:24, marginBottom:28 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <div style={{ gridColumn:"1/-1" }}>
            <label style={lStyle}>Product Name *</label>
            <input style={iStyle} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Handwoven Cotton Saree"/>
          </div>
          <div style={{ gridColumn:"1/-1" }}>
            <label style={lStyle}>Description</label>
            <textarea style={{...iStyle,minHeight:72,resize:"vertical"}} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Product details…"/>
          </div>
          <div><label style={lStyle}>Price (₹) *</label><input style={iStyle} type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} placeholder="499"/></div>
          <div><label style={lStyle}>Original Price (₹)</label><input style={iStyle} type="number" value={form.originalPrice} onChange={e=>setForm(f=>({...f,originalPrice:e.target.value}))} placeholder="799"/></div>
          <div><label style={lStyle}>Stock</label><input style={iStyle} type="number" value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))} placeholder="10"/></div>
          <div><label style={lStyle}>Discount %</label><input style={iStyle} type="number" value={form.discount} onChange={e=>setForm(f=>({...f,discount:e.target.value}))} placeholder="0" min="0" max="90"/></div>
          <div style={{ gridColumn:"1/-1" }}>
            <label style={lStyle}>Product Video URL (optional — recorded demo)</label>
            <input style={iStyle} value={form.videoUrl} onChange={e=>setForm(f=>({...f,videoUrl:e.target.value}))} placeholder="https://..."/>
          </div>
          <div style={{ gridColumn:"1/-1" }}>
            <label style={lStyle}>Product Images (up to 4)</label>
            <PlazaProductImages images={images} onChange={setImages} maxImages={4}/>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:16 }}>
          <button onClick={save} disabled={saving} style={{ padding:"11px 28px", background:"linear-gradient(135deg,#4f46e5,#7c3aed)", border:"none", borderRadius:12, color:"#fff", fontWeight:700, cursor:"pointer", fontSize:14 }}>
            {saving ? "Saving…" : editId ? "Update" : "Add Product"}
          </button>
          {editId && <button onClick={resetForm} style={{ padding:"11px 20px", background:"#f1f5f9", border:"none", borderRadius:12, fontWeight:600, cursor:"pointer" }}>Cancel</button>}
        </div>
      </div>

      <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Your Products ({products.length})</h3>
      {products.length === 0 ? <div style={{ textAlign:"center", padding:40, color:"#94a3b8" }}>No products yet. Add your first product above!</div> : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {products.map(p => (
            <div key={p._id} style={{ background:"#fff", borderRadius:14, border:"1px solid #e2e8f0", padding:"14px 18px", display:"flex", gap:14, alignItems:"center" }}>
              {p.images?.[0]?.url && <img src={p.images[0].url} alt={p.name} style={{ width:56, height:56, objectFit:"cover", borderRadius:10, flexShrink:0 }}/>}
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14 }}>{p.name}</div>
                <div style={{ fontSize:12, color:"#64748b" }}>{fmt(p.price)} · Stock: {p.stock} · {p.discount > 0 ? `${p.discount}% off` : "No discount"}</div>
                {p.videoUrl && <div style={{ fontSize:11, color:"#4f46e5", marginTop:2 }}>📹 Video attached</div>}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>startEdit(p)} style={{ padding:"7px 14px", background:"#f1f5f9", border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer" }}>Edit</button>
                <button onClick={()=>del(p._id)} style={{ padding:"7px 14px", background:"#fef2f2", border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", color:"#ef4444" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Orders Panel ───────────────────────────────────────────────────────────────
const OrdersPanel = ({ orders, setOrders, toast }) => {
  const STATUSES = ["pending","confirmed","shipped","delivered","cancelled"];
  const colors = { pending:"#fef3c7", confirmed:"#dbeafe", shipped:"#ede9fe", delivered:"#d1fae5", cancelled:"#fee2e2" };
  const textColors = { pending:"#92400e", confirmed:"#1e40af", shipped:"#6d28d9", delivered:"#065f46", cancelled:"#991b1b" };

  const updateStatus = async (id, status) => {
    try {
      const r = await apiPlazaUpdateOrderStatus(id, status);
      setOrders(prev => prev.map(o => o._id === id ? r.data.order : o));
      toast?.(`Order → ${status}`);
    } catch (err) { toast?.(err.response?.data?.message || "Error","error"); }
  };

  return (
    <div>
      <h2 style={{ fontSize:18, fontWeight:800, marginBottom:20 }}>Orders ({orders.length})</h2>
      {orders.length === 0 ? <div style={{ textAlign:"center", padding:60, color:"#94a3b8" }}>No orders yet</div> : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {orders.map(order => (
            <div key={order._id} style={{ background:"#fff", borderRadius:16, border:"1px solid #e2e8f0", padding:"18px 20px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:14 }}>{order.buyer?.name}</div>
                  <div style={{ fontSize:12, color:"#64748b" }}>{new Date(order.createdAt).toLocaleDateString("en-IN")} · {order.items?.length} item(s) · ₹{order.total?.toLocaleString("en-IN")}</div>
                </div>
                <span style={{ background: colors[order.status], color: textColors[order.status], padding:"3px 12px", borderRadius:20, fontSize:11, fontWeight:700 }}>
                  {order.status?.toUpperCase()}
                </span>
              </div>
              {order.shippingAddress && (
                <div style={{ fontSize:12, color:"#94a3b8", marginBottom:10 }}>
                  📍 {order.shippingAddress.fullName}, {order.shippingAddress.address}, {order.shippingAddress.city} - {order.shippingAddress.pin}
                </div>
              )}
              {order.status !== "delivered" && order.status !== "cancelled" && (
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {STATUSES.filter(s => s !== order.status && s !== "pending").map(s => (
                    <button key={s} onClick={()=>updateStatus(order._id, s)} style={{ padding:"6px 14px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", textTransform:"capitalize" }}>
                      → {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Coupons Panel ──────────────────────────────────────────────────────────────
const CouponsPanel = ({ coupons, setCoupons, toast }) => {
  const [form, setForm] = useState({ code:"", type:"percent", discount:"", minOrder:"", expiresAt:"" });
  const [saving, setSaving] = useState(false);
  const iStyle = { width:"100%", padding:"10px 12px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:13, outline:"none", boxSizing:"border-box" };

  const create = async () => {
    if (!form.code || !form.discount) { toast?.("Code and discount required","error"); return; }
    setSaving(true);
    try {
      const r = await apiPlazaCreateCoupon({ ...form, discount:Number(form.discount), minOrder:Number(form.minOrder||0) });
      setCoupons(prev => [r.data.coupon, ...prev]);
      setForm({ code:"", type:"percent", discount:"", minOrder:"", expiresAt:"" });
      toast?.("Coupon created!");
    } catch (err) { toast?.(err.response?.data?.message||"Error","error"); }
    setSaving(false);
  };

  const del = async (id) => {
    await apiPlazaDeleteCoupon(id);
    setCoupons(prev => prev.filter(c => c._id !== id));
    toast?.("Deleted");
  };

  return (
    <div>
      <h2 style={{ fontSize:18, fontWeight:800, marginBottom:20 }}>Coupons</h2>
      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e2e8f0", padding:24, marginBottom:24 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:14 }}>
          <input style={iStyle} value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value.toUpperCase()}))} placeholder="Code e.g. SAVE10"/>
          <select style={iStyle} value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
            <option value="percent">Percent (%)</option>
            <option value="flat">Flat (₹)</option>
          </select>
          <input style={iStyle} type="number" value={form.discount} onChange={e=>setForm(f=>({...f,discount:e.target.value}))} placeholder={form.type==="percent" ? "10 for 10%" : "100 for ₹100"}/>
          <input style={iStyle} type="number" value={form.minOrder} onChange={e=>setForm(f=>({...f,minOrder:e.target.value}))} placeholder="Min order ₹"/>
          <input style={iStyle} type="date" value={form.expiresAt} onChange={e=>setForm(f=>({...f,expiresAt:e.target.value}))}/>
        </div>
        <button onClick={create} disabled={saving} style={{ padding:"11px 28px", background:"linear-gradient(135deg,#4f46e5,#7c3aed)", border:"none", borderRadius:12, color:"#fff", fontWeight:700, cursor:"pointer" }}>
          {saving ? "Creating…" : "Create Coupon"}
        </button>
      </div>
      {coupons.length === 0 ? <div style={{ textAlign:"center",padding:40,color:"#94a3b8" }}>No coupons yet</div> : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {coupons.map(c => (
            <div key={c._id} style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:"12px 18px", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ fontWeight:800, fontSize:16, color:"#4f46e5", minWidth:100 }}>{c.code}</div>
              <div style={{ flex:1, fontSize:13, color:"#64748b" }}>
                {c.type==="percent" ? `${c.discount}% off` : `₹${c.discount} off`}
                {c.minOrder > 0 ? ` · Min ₹${c.minOrder}` : ""}
                {c.expiresAt ? ` · Expires ${new Date(c.expiresAt).toLocaleDateString("en-IN")}` : ""}
              </div>
              <button onClick={()=>del(c._id)} style={{ padding:"6px 14px", background:"#fef2f2", border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", color:"#ef4444" }}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Bank Panel ─────────────────────────────────────────────────────────────────
const BankPanel = ({ bank, setBank, toast }) => {
  const [form, setForm] = useState({ accountHolderName:"", accountNumber:"", confirmAccountNumber:"", ifscCode:"", bankName:"", branchName:"", upiId:"" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (bank) setForm({ accountHolderName:bank.accountHolderName, accountNumber:bank.accountNumber, confirmAccountNumber:bank.accountNumber, ifscCode:bank.ifscCode, bankName:bank.bankName, branchName:bank.branchName||"", upiId:bank.upiId||"" }); }, [bank]);

  const save = async () => {
    if (form.accountNumber !== form.confirmAccountNumber) { toast?.("Account numbers don't match","error"); return; }
    if (!form.accountHolderName||!form.accountNumber||!form.ifscCode||!form.bankName) { toast?.("Fill all required fields","error"); return; }
    setSaving(true);
    try {
      const r = await apiPlazaSaveBankDetail(form);
      setBank(r.data.bank);
      toast?.("Bank details saved! ✓");
    } catch (err) { toast?.(err.response?.data?.message||"Error","error"); }
    setSaving(false);
  };

  const iStyle = { width:"100%", padding:"10px 12px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:13, outline:"none", boxSizing:"border-box" };
  const lStyle = { display:"block", fontSize:11, fontWeight:700, color:"#64748b", marginBottom:5, textTransform:"uppercase" };

  return (
    <div>
      <h2 style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>Bank Details</h2>
      <p style={{ fontSize:13, color:"#64748b", marginBottom:24 }}>Required for wallet withdrawals. Your details are stored securely.</p>
      {bank?.isVerified && (
        <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:12, padding:"10px 16px", marginBottom:20, fontSize:13, color:"#166534", fontWeight:600 }}>
          ✓ Bank account verified
        </div>
      )}
      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e2e8f0", padding:24, maxWidth:500 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div><label style={lStyle}>Account Holder Name *</label><input style={iStyle} value={form.accountHolderName} onChange={e=>setForm(f=>({...f,accountHolderName:e.target.value}))} placeholder="As per bank records"/></div>
          <div><label style={lStyle}>Account Number *</label><input style={iStyle} value={form.accountNumber} onChange={e=>setForm(f=>({...f,accountNumber:e.target.value}))} placeholder="Enter account number" type="password" autoComplete="new-password"/></div>
          <div><label style={lStyle}>Confirm Account Number *</label><input style={iStyle} value={form.confirmAccountNumber} onChange={e=>setForm(f=>({...f,confirmAccountNumber:e.target.value}))} placeholder="Re-enter account number"/></div>
          <div><label style={lStyle}>IFSC Code *</label><input style={iStyle} value={form.ifscCode} onChange={e=>setForm(f=>({...f,ifscCode:e.target.value.toUpperCase()}))} placeholder="e.g. SBIN0000001"/></div>
          <div><label style={lStyle}>Bank Name *</label><input style={iStyle} value={form.bankName} onChange={e=>setForm(f=>({...f,bankName:e.target.value}))} placeholder="e.g. State Bank of India"/></div>
          <div><label style={lStyle}>Branch Name</label><input style={iStyle} value={form.branchName} onChange={e=>setForm(f=>({...f,branchName:e.target.value}))} placeholder="e.g. Chennai Main Branch"/></div>
          <div><label style={lStyle}>UPI ID (optional)</label><input style={iStyle} value={form.upiId} onChange={e=>setForm(f=>({...f,upiId:e.target.value}))} placeholder="name@bank"/></div>
        </div>
        <div style={{ marginTop:8, fontSize:11, color:"#94a3b8", marginBottom:18 }}>
          🔒 Your bank details are encrypted and stored securely. A 10% processing fee is deducted on each withdrawal.
        </div>
        <button onClick={save} disabled={saving} style={{ padding:"12px 32px", background:"linear-gradient(135deg,#4f46e5,#7c3aed)", border:"none", borderRadius:12, color:"#fff", fontWeight:700, cursor:"pointer", fontSize:14 }}>
          {saving ? "Saving…" : "Save Bank Details"}
        </button>
      </div>
    </div>
  );
};

export default ShopOwnerDashboard;
