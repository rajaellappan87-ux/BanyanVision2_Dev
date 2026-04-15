/**
 * BV_Plaza/frontend/pages/StallView.jsx
 * Individual stall view — online (live video + chat) or offline (product listing)
 */
import React, { useState, useEffect, useRef } from "react";
import { apiPlazaGetStall, apiPlazaGetStallProducts, apiPlazaPlaceOrder, apiPlazaValidateCoupon, apiPlazaCreatePayment } from "../plazaApi";
import ChatWindow from "../components/ChatWindow";
import VideoCall  from "../components/VideoCall";

const fmt = n => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

// Load Razorpay checkout.js once
const loadRazorpay = () => new Promise(res => {
  if (window.Razorpay) { res(true); return; }
  const s = document.createElement("script");
  s.src = "https://checkout.razorpay.com/v1/checkout.js";
  s.onload = () => res(true);
  s.onerror = () => res(false);
  document.body.appendChild(s);
});

const StallView = ({ stallId, user, socket, onBack, toast }) => {
  const [stall,    setStall]    = useState(null);
  const [products, setProducts] = useState([]);
  const [coupons,  setCoupons]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [cart,     setCart]     = useState([]);
  const [coupon,   setCoupon]   = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg,setCouponMsg]= useState("");
  const [showCart, setShowCart] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAddress, setShowAddress] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null); // order object after payment
  const [addrForm, setAddrForm] = useState({
    fullName: "", phone: "", address: "", city: "", state: "", pin: "",
  });

  const sessionId = useRef(`session_${stallId}_${user?._id || "guest"}_${Date.now()}`).current;

  useEffect(() => {
    const load = async () => {
      try {
        const r = await apiPlazaGetStall(stallId);
        setStall(r.data.stall);
        setProducts(r.data.products || []);
        setCoupons(r.data.coupons || []);
      } catch { }
      setLoading(false);
    };
    load();
  }, [stallId]);

  // Socket: join this stall
  useEffect(() => {
    if (!socket || !user) return;
    socket.emit("buyer:join", { stallId, sessionId, buyerId: user._id, buyerName: user.name });
  }, [socket, stallId, sessionId, user]);

  // Listen for real-time stall status changes
  useEffect(() => {
    if (!socket) return;
    socket.on("stall:status", ({ stallId: sid, isOnline }) => {
      if (sid === stallId) setStall(s => s ? { ...s, isActuallyOnline: isOnline } : s);
    });
    return () => socket.off("stall:status");
  }, [socket, stallId]);

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(i => i._id === product._id);
      if (exists) return prev.map(i => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    toast?.("Added to cart ✓");
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i._id !== id));
  const changeQty = (id, delta) => setCart(prev =>
    prev.map(i => i._id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i).filter(i => i.qty > 0)
  );

  const subtotal   = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const totalAfter = Math.max(0, subtotal - discount);

  const applyCartCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const r = await apiPlazaValidateCoupon({ code: coupon, stallId, subtotal });
      setDiscount(r.data.discountAmount);
      setCouponMsg(`✓ Coupon applied! Saved ${fmt(r.data.discountAmount)}`);
    } catch (err) {
      setCouponMsg(err.response?.data?.message || "Invalid coupon");
      setDiscount(0);
    }
  };

  // Step 1: validate address form then open Razorpay
  const openAddressForm = () => {
    if (!user) { toast?.("Please login to checkout", "error"); return; }
    if (cart.length === 0) return;
    // Pre-fill from user profile if available
    setAddrForm({
      fullName: user.name || "",
      phone:    user.phone || "",
      address:  user.addressLine1 ? [user.addressLine1, user.addressLine2].filter(Boolean).join(", ") : "",
      city:     user.city  || "",
      state:    user.state || "",
      pin:      user.pin   || "",
    });
    setShowAddress(true);
  };

  // Step 2: called from AddressModal — run Razorpay
  const initiatePayment = async (addr) => {
    setShowAddress(false);
    setCheckingOut(true);
    try {
      // Load Razorpay script
      const ok = await loadRazorpay();
      if (!ok) { toast?.("Could not load payment gateway. Check your internet.", "error"); setCheckingOut(false); return; }

      // Create Razorpay order on backend
      let pr;
      try {
        pr = await apiPlazaCreatePayment(totalAfter);
      } catch (apiErr) {
        toast?.(apiErr.response?.data?.message || "Payment gateway error", "error");
        setCheckingOut(false);
        return;
      }

      const { orderId, amount, currency, keyId } = pr.data;
      if (!keyId?.startsWith("rzp_")) { toast?.("Payment gateway misconfigured", "error"); setCheckingOut(false); return; }

      // Open Razorpay modal
      const opts = {
        key:      keyId,
        amount,
        currency,
        name:     "BV Plaza",
        description: stall?.shopName || "BV Plaza Purchase",
        order_id: orderId,
        handler: async (rzpRes) => {
          try {
            const or = await apiPlazaPlaceOrder({
              stallId,
              couponUsed: coupon || undefined,
              items: cart.map(i => ({ productId: i._id, qty: i.qty })),
              shippingAddress: addr,
              paymentId:        rzpRes.razorpay_payment_id,
              paymentOrderId:   rzpRes.razorpay_order_id,
              paymentSignature: rzpRes.razorpay_signature,
            });
            setCart([]);
            setShowCart(false);
            setDiscount(0);
            setCoupon("");
            setCouponMsg("");
            setOrderSuccess(or.data.order);
          } catch (err) {
            toast?.(err.response?.data?.message || "Order creation failed — contact support", "error");
          }
          setCheckingOut(false);
        },
        prefill:  { name: addr.fullName, contact: addr.phone, email: user?.email || "" },
        theme:    { color: "#4f46e5" },
        modal:    { ondismiss: () => setCheckingOut(false), confirm_close: true },
      };

      const rzp = new window.Razorpay(opts);
      rzp.on("payment.failed", (r) => {
        toast?.(r.error?.description || "Payment failed — please try again", "error");
        setCheckingOut(false);
      });
      rzp.open();

    } catch (err) {
      toast?.(err.response?.data?.message || "Something went wrong", "error");
      setCheckingOut(false);
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 80, color: "#94a3b8" }}>Loading stall…</div>;
  if (!stall)  return <div style={{ textAlign: "center", padding: 80, color: "#ef4444" }}>Stall not found</div>;

  const isOnline = stall.isActuallyOnline;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
      {/* Back + Cart header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
          ← Back to Market
        </button>
        <button onClick={() => setShowCart(v => !v)} style={{ position: "relative", background: "#4f46e5", border: "none", borderRadius: 12, padding: "10px 18px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          🛒 Cart {cart.length > 0 && `(${cart.reduce((s, i) => s + i.qty, 0)})`}
        </button>
      </div>

      {/* Stall header */}
      <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: 24 }}>
        <div style={{ height: 140, background: stall.logo?.url ? `url(${stall.logo.url}) center/cover` : "linear-gradient(135deg,#4f46e5,#7c3aed)", position: "relative" }}>
          <div style={{ position: "absolute", top: 16, right: 16, display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 800, background: isOnline ? "#22c55e" : "#64748b", color: "#fff" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", animation: isOnline ? "pulse 1.5s infinite" : "none" }}/>
            {isOnline ? "LIVE NOW" : "OFFLINE"}
          </div>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#1e293b" }}>{stall.shopName}</h1>
          <p style={{ margin: "0 0 12px", fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>{stall.description}</p>
          <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#94a3b8", flexWrap: "wrap" }}>
            <span>📦 Ships in {stall.deliveryDays} days</span>
            <span>🔄 {stall.returnPolicy}</span>
            {stall.categories?.length > 0 && <span>🏷️ {stall.categories.join(", ")}</span>}
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: "grid", gridTemplateColumns: isOnline ? "1fr 380px" : "1fr", gap: 20 }}>
        {/* Products */}
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>
            {isOnline ? "Products — ask about any item in chat!" : "Products"}
          </h2>
          {products.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
              No products listed yet
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16 }}>
              {products.map(p => (
                <ProductCard key={p._id} product={p} onAdd={() => addToCart(p)} onView={() => setSelectedProduct(p)} isOnline={isOnline}/>
              ))}
            </div>
          )}
        </div>

        {/* Online: Video + Chat */}
        {isOnline && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Video call */}
            {user && (
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                  📹 Live Video
                </div>
                <div style={{ padding: 16 }}>
                  <VideoCall
                    socket={socket}
                    sessionId={sessionId}
                    stallId={stallId}
                    role="buyer"
                    myName={user.name}
                  />
                </div>
              </div>
            )}
            {/* Chat window */}
            <ChatWindow
              stallId={stallId}
              sessionId={sessionId}
              senderType="buyer"
              senderName={user?.name || "Guest"}
              senderId={user?._id}
              socket={socket}
              onAddToCart={p => addToCart({ _id: p.productId, name: p.name, price: p.price, images: p.image ? [{ url: p.image }] : [] })}
              compact
            />
          </div>
        )}
      </div>

      {/* Product detail modal */}
      {selectedProduct && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setSelectedProduct(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, overflow: "hidden", maxWidth: 500, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            {selectedProduct.images?.[0]?.url && (
              <img src={selectedProduct.images[0].url} alt={selectedProduct.name} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }}/>
            )}
            {/* Product video */}
            {selectedProduct.videoUrl && (
              <div style={{ padding: "12px 20px 0" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#64748b", marginBottom: 6 }}>📹 Product Demo Video</div>
                <video src={selectedProduct.videoUrl} controls style={{ width: "100%", borderRadius: 10 }}/>
              </div>
            )}
            <div style={{ padding: 20 }}>
              <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800 }}>{selectedProduct.name}</h2>
              <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{selectedProduct.description}</p>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#4f46e5", marginBottom: 16 }}>
                {fmt(selectedProduct.price)}
                {selectedProduct.originalPrice > selectedProduct.price && (
                  <span style={{ fontSize: 14, color: "#94a3b8", textDecoration: "line-through", marginLeft: 10 }}>{fmt(selectedProduct.originalPrice)}</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }} style={{ flex: 1, padding: "12px 0", background: "#f1f5f9", border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontSize: 14, color: "#475569" }}>
                  + Add to Cart
                </button>
                <button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); openAddressForm(); }} style={{ flex: 1, padding: "12px 0", background: "linear-gradient(135deg,#f59e0b,#fbbf24)", border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontSize: 14, color: "#1c1917" }}>
                  Buy Now 💳
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart drawer */}
      {showCart && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 500, display: "flex", justifyContent: "flex-end" }} onClick={() => setShowCart(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: "min(420px,100%)", background: "#fff", height: "100%", overflow: "auto", boxShadow: "-8px 0 48px rgba(0,0,0,.15)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>🛒 Your Cart</div>
              <button onClick={() => setShowCart(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Cart is empty</div>
              ) : (
                cart.map(item => (
                  <div key={item._id} style={{ display: "flex", gap: 12, marginBottom: 16, padding: 12, background: "#f8fafc", borderRadius: 12 }}>
                    {item.images?.[0]?.url && <img src={item.images[0].url} alt={item.name} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }}/>}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{item.name}</div>
                      <div style={{ color: "#4f46e5", fontWeight: 700 }}>{fmt(item.price)}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                        <button onClick={() => changeQty(item._id, -1)} style={{ width: 24, height: 24, border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>-</button>
                        <span style={{ fontWeight: 700, fontSize: 14, minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                        <button onClick={() => changeQty(item._id, 1)} style={{ width: 24, height: 24, border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>+</button>
                        <button onClick={() => removeFromCart(item._id)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13 }}>Remove</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div style={{ padding: "20px 24px", borderTop: "1px solid #f1f5f9" }}>
                {/* Coupon */}
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <input value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Coupon code" style={{ flex: 1, padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 13, outline: "none" }}/>
                  <button onClick={applyCartCoupon} style={{ padding: "10px 16px", background: "#4f46e5", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Apply</button>
                </div>
                {couponMsg && <div style={{ fontSize: 12, color: discount > 0 ? "#22c55e" : "#ef4444", marginBottom: 10 }}>{couponMsg}</div>}
                <div style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>Subtotal: {fmt(subtotal)}</div>
                {discount > 0 && <div style={{ fontSize: 14, color: "#22c55e", marginBottom: 4 }}>Discount: −{fmt(discount)}</div>}
                <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", marginBottom: 16 }}>Total: {fmt(totalAfter)}</div>
                <button onClick={openAddressForm} disabled={checkingOut || !user} style={{ width: "100%", padding: "14px 0", background: "linear-gradient(135deg,#f59e0b,#fbbf24)", border: "none", borderRadius: 14, color: "#1c1917", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: "0 4px 16px rgba(251,191,36,.4)" }}>
                  {!user ? "Login to Order" : checkingOut ? "Processing…" : "Pay with Razorpay →"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Address Modal ──────────────────────────────────────────────── */}
      {showAddress && (
        <AddressModal
          addrForm={addrForm}
          setAddrForm={setAddrForm}
          totalAfter={totalAfter}
          onCancel={() => setShowAddress(false)}
          onConfirm={initiatePayment}
        />
      )}

      {/* ── Order Success ─────────────────────────────────────────────── */}
      {orderSuccess && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:600, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:"#fff", borderRadius:24, padding:36, maxWidth:420, width:"100%", textAlign:"center", boxShadow:"0 24px 64px rgba(0,0,0,.2)" }}>
            <div style={{ fontSize:56, marginBottom:12 }}>🎉</div>
            <h2 style={{ margin:"0 0 8px", fontSize:22, fontWeight:800, color:"#1e293b" }}>Order Placed!</h2>
            <p style={{ fontSize:14, color:"#64748b", marginBottom:20 }}>
              Your payment was successful. The shop owner will confirm your order shortly.
            </p>
            <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:14, padding:"12px 18px", marginBottom:20, fontSize:13, color:"#166534" }}>
              Order #{orderSuccess._id?.slice(-8).toUpperCase()} · ₹{orderSuccess.total?.toLocaleString("en-IN")} paid
            </div>
            <button onClick={() => setOrderSuccess(null)} style={{ padding:"12px 32px", background:"linear-gradient(135deg,#4f46e5,#7c3aed)", border:"none", borderRadius:14, color:"#fff", fontWeight:800, fontSize:15, cursor:"pointer" }}>
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
};

// ── Address + Confirm Modal ────────────────────────────────────────────────────
const AddressModal = ({ addrForm, setAddrForm, totalAfter, onCancel, onConfirm }) => {
  const fmt = n => new Intl.NumberFormat("en-IN", { style:"currency", currency:"INR", maximumFractionDigits:0 }).format(n);
  const iS = { width:"100%", padding:"10px 12px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:13, outline:"none", boxSizing:"border-box" };
  const lS = { display:"block", fontSize:11, fontWeight:700, color:"#64748b", marginBottom:4, textTransform:"uppercase" };

  const handleConfirm = () => {
    const { fullName, phone, address, city, state, pin } = addrForm;
    if (!fullName || !phone || !address || !city || !state || !pin) {
      alert("Please fill all delivery address fields.");
      return;
    }
    onConfirm({ fullName, phone, address, city, state, pin });
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:600, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:24, padding:28, maxWidth:460, width:"100%", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,.2)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#1e293b" }}>Delivery Details</h2>
          <button onClick={onCancel} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#64748b" }}>×</button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
          <div>
            <label style={lS}>Full Name *</label>
            <input style={iS} value={addrForm.fullName} onChange={e=>setAddrForm(f=>({...f,fullName:e.target.value}))} placeholder="Recipient name"/>
          </div>
          <div>
            <label style={lS}>Mobile Number *</label>
            <input style={iS} type="tel" value={addrForm.phone} onChange={e=>setAddrForm(f=>({...f,phone:e.target.value}))} placeholder="10-digit mobile"/>
          </div>
          <div>
            <label style={lS}>Address *</label>
            <textarea style={{...iS,minHeight:64,resize:"vertical"}} value={addrForm.address} onChange={e=>setAddrForm(f=>({...f,address:e.target.value}))} placeholder="House/Flat no., Street, Area…"/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <label style={lS}>City *</label>
              <input style={iS} value={addrForm.city} onChange={e=>setAddrForm(f=>({...f,city:e.target.value}))} placeholder="City"/>
            </div>
            <div>
              <label style={lS}>State *</label>
              <input style={iS} value={addrForm.state} onChange={e=>setAddrForm(f=>({...f,state:e.target.value}))} placeholder="State"/>
            </div>
          </div>
          <div>
            <label style={lS}>PIN Code *</label>
            <input style={iS} value={addrForm.pin} onChange={e=>setAddrForm(f=>({...f,pin:e.target.value}))} placeholder="6-digit PIN" maxLength={6}/>
          </div>
        </div>

        {/* Order total */}
        <div style={{ background:"#f8fafc", borderRadius:12, padding:"12px 16px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:13, color:"#64748b", fontWeight:600 }}>Total to pay</span>
          <span style={{ fontSize:20, fontWeight:900, color:"#4f46e5" }}>{fmt(totalAfter)}</span>
        </div>

        <button onClick={handleConfirm} style={{ width:"100%", padding:"14px 0", background:"linear-gradient(135deg,#f59e0b,#fbbf24)", border:"none", borderRadius:14, color:"#1c1917", fontWeight:800, fontSize:16, cursor:"pointer", boxShadow:"0 4px 16px rgba(251,191,36,.4)" }}>
          Proceed to Pay {fmt(totalAfter)} →
        </button>
        <div style={{ textAlign:"center", marginTop:10, fontSize:11, color:"#94a3b8" }}>
          🔒 Secured by Razorpay · UPI, Cards, Net Banking accepted
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product, onAdd, onView, isOnline }) => {
  const discountedPrice = product.discount > 0 ? Math.round(product.price * (1 - product.discount / 100)) : product.price;
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", transition: "all .2s", cursor: "pointer" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.1)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = ""}
    >
      <div onClick={onView} style={{ height: 160, background: product.images?.[0]?.url ? `url(${product.images[0].url}) center/cover` : "#f1f5f9", position: "relative" }}>
        {!product.images?.[0]?.url && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 36 }}>📦</div>}
        {product.videoUrl && <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,.6)", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>▶ VIDEO</div>}
        {product.discount > 0 && <div style={{ position: "absolute", top: 8, left: 8, background: "#ef4444", color: "#fff", borderRadius: 20, padding: "3px 8px", fontSize: 11, fontWeight: 700 }}>{product.discount}% OFF</div>}
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div onClick={onView} style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <span style={{ fontWeight: 800, color: "#4f46e5", fontSize: 15 }}>{fmt(discountedPrice)}</span>
          {product.discount > 0 && <span style={{ fontSize: 11, color: "#94a3b8", textDecoration: "line-through" }}>{fmt(product.price)}</span>}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onView} style={{ flex: 1, padding: "7px 0", background: "#f1f5f9", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#475569" }}>View</button>
          <button onClick={onAdd} style={{ flex: 1, padding: "7px 0", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#fff" }}>
            {isOnline ? "Ask & Buy" : "+ Cart"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StallView;
