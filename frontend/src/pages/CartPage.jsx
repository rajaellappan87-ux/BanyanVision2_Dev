import React, { useState } from "react";
import { useBreakpoint } from "../hooks";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { Ic, fmt, thumb } from "../utils/helpers";
import { apiValidateCoupon } from "../api";
import { ArrowRight, Lock, ShoppingBag, Tag, Trash2 } from "lucide-react";

/* ── Cart Order Summary (standalone component — not nested) ─────────────────── */
const CartSummary = ({
  isMobile, subtotal, discountAmt, shipping, total,
  couponCode, setCouponCode, couponInfo, setCouponInfo,
  cMsg, setCMsg, user, setPage, applyCoupon,
}) => {
  const iStyle = {
    background:"#fff", border:"1.5px solid var(--border2)", color:"var(--text)",
    padding:"10px 14px", fontSize:13, borderRadius:10, outline:"none", fontWeight:500,
  };
  return (
    <div style={{background:"#fff",borderRadius:"20px",border:"1.5px solid var(--border)",
                 padding:isMobile?18:24,boxShadow:"0 4px 24px rgba(194,24,91,0.08)"}}>
      <h3 style={{fontFamily:"var(--font-d)",color:"var(--dark)",margin:"0 0 18px",
                  fontSize:20,fontWeight:700}}>Order Summary</h3>

      {[["Subtotal", fmt(subtotal)],
        discountAmt>0 ? ["Discount", `−${fmt(discountAmt)}`] : null,
        ["Delivery", shipping===0 ? "FREE" : fmt(shipping)]
      ].filter(Boolean).map(([k,v])=>(
        <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:10,
                             fontSize:13,color:k==="Discount"?"#16A34A":"var(--text2)",
                             fontWeight:k==="Discount"?700:400}}>
          <span>{k}</span><span>{v}</span>
        </div>
      ))}

      {shipping>0&&(
        <div style={{fontSize:11,color:"var(--saffron)",marginBottom:12,padding:"8px 12px",
                     background:"var(--saffronL)",borderRadius:8,fontWeight:600}}>
          Add {fmt(2000-(subtotal-discountAmt))} more for FREE delivery
        </div>
      )}

      {/* Coupon */}
      <div style={{marginBottom:14}}>
        <div style={{display:"flex",gap:8,marginBottom:6}}>
          <input value={couponCode}
            onChange={e=>setCouponCode(e.target.value.toUpperCase())}
            onKeyDown={e=>e.key==="Enter"&&applyCoupon()}
            placeholder="COUPON CODE"
            style={{...iStyle,flex:1,fontFamily:"monospace",fontWeight:700,letterSpacing:1}}/>
          <button className="btn btn-saffron" onClick={applyCoupon}
            style={{padding:"10px 14px",fontSize:12}}>Apply</button>
        </div>
        {couponInfo && <div style={{fontSize:12,color:"#16A34A",fontWeight:700}}>✓ {couponInfo.desc}</div>}
        {cMsg      && <div style={{fontSize:12,color:"#DC2626",fontWeight:700}}>{cMsg}</div>}
        <div style={{fontSize:10,color:"var(--muted)",marginTop:5,letterSpacing:.3}}>
          Try: BANYAN10 · WELCOME20 · FLAT500
        </div>
      </div>

      {/* Total */}
      <div style={{borderTop:"1.5px solid var(--border)",paddingTop:14,display:"flex",
                   justifyContent:"space-between",fontFamily:"var(--font-d)",fontSize:24,
                   fontWeight:700,marginBottom:16,color:"var(--dark)"}}>
        <span>Total</span>
        <span style={{background:"linear-gradient(135deg,var(--rose),var(--saffron))",
                      WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
          {fmt(total)}
        </span>
      </div>

      <button className="btn btn-rose"
        onClick={()=>{ if(!user){ setPage("login"); return; } setPage("checkout"); }}
        style={{width:"100%",padding:"15px 0",fontSize:14,marginBottom:10}}>
        {user ? "Proceed to Checkout →" : "Login to Checkout"}
      </button>

      <div style={{textAlign:"center",fontSize:11,color:"var(--muted)",fontWeight:600,letterSpacing:.5}}>
        <Ic icon={Lock} size={12}/> Secured by Razorpay
      </div>
    </div>
  );
};

/* ── Cart Page ───────────────────────────────────────────────────────────────── */
const CartPage = ({ setPage, toast }) => {
  const { isMobile } = useBreakpoint();
  const { user }     = useAuth();
  const {
    cart, updateCart, removeFromCart,
    subtotal, discountAmt, shipping, total,
    couponCode, setCouponCode, couponInfo, setCouponInfo,
  } = useCart();
  const [cMsg, setCMsg] = useState("");

  const applyCoupon = async () => {
    try {
      const r = await apiValidateCoupon(couponCode);
      setCouponInfo(r.data.coupon);
      toast(`✓ ${r.data.coupon.desc}`);
      setCMsg("");
    } catch(err) {
      setCMsg(err.response?.data?.message || "Invalid coupon");
      setCouponInfo(null);
    }
  };

  const summaryProps = {
    isMobile, subtotal, discountAmt, shipping, total,
    couponCode, setCouponCode, couponInfo, setCouponInfo,
    cMsg, setCMsg, user, setPage, applyCoupon,
  };

  /* Empty cart */
  if (cart.length === 0) return (
    <div style={{minHeight:"70vh",display:"flex",alignItems:"center",justifyContent:"center",
                 background:"linear-gradient(160deg,var(--roseL),var(--saffronL))",
                 flexDirection:"column",gap:18}}>
      <Ic icon={ShoppingBag} size={72} color="var(--border2)"/>
      <h2 style={{fontFamily:"var(--font-d)",color:"var(--dark)",fontSize:32,fontWeight:700}}>
        Your bag is empty
      </h2>
      <p style={{color:"var(--muted)",fontSize:14}}>Discover beautiful Indian fashion.</p>
      <button className="btn btn-rose" onClick={()=>setPage("shop")}
        style={{padding:"13px 32px",fontSize:14}}>Browse Collections</button>
    </div>
  );

  return (
    <div style={{background:"var(--ivory)",minHeight:"100vh",
                 padding:isMobile?"20px 16px":"44px 80px"}}>
      <div style={{maxWidth:1100,margin:"0 auto"}}>
        <h1 style={{fontFamily:"var(--font-d)",color:"var(--dark)",
                    fontSize:isMobile?28:44,fontWeight:700,marginBottom:24}}>
          Shopping Bag{" "}
          <span style={{fontSize:18,color:"var(--muted)",fontFamily:"var(--font-b)",fontWeight:500}}>
            ({cart.length})
          </span>
        </h1>

        <div style={{display:"grid",
                     gridTemplateColumns:isMobile?"1fr":"1fr 340px",
                     gap:18,alignItems:"start"}}>

          {/* Cart items */}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {cart.map(item=>(
              <div key={`${item._id}-${item.size}-${item.color}`}
                style={{background:"#fff",borderRadius:"20px",border:"1.5px solid var(--border)",
                        padding:isMobile?14:20,display:"flex",gap:isMobile?12:16,
                        alignItems:"flex-start",boxShadow:"0 4px 24px rgba(194,24,91,0.08)"}}>

                <img src={thumb(item.images?.[0]?.url||item.image||"")}
                  alt={item.name} loading="lazy"
                  style={{width:isMobile?72:90,height:isMobile?88:110,
                          objectFit:"contain",background:"var(--ivory2)",
                          borderRadius:12,flexShrink:0}}/>

                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:10,fontWeight:700,
                               background:"linear-gradient(135deg,var(--rose),var(--saffron))",
                               WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
                               marginBottom:3,letterSpacing:.5}}>
                    {item.category}
                  </div>
                  <div style={{fontFamily:"var(--font-d)",fontWeight:700,color:"var(--text)",
                               fontSize:isMobile?14:16,marginBottom:4,lineHeight:1.3}}>
                    {item.name}
                  </div>
                  <div style={{fontSize:11,color:"var(--muted)",marginBottom:10,fontWeight:500}}>
                    {item.color} · {item.size}
                  </div>

                  {/* Qty controls */}
                  <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                    <div style={{display:"flex",alignItems:"center",
                                 border:"1.5px solid var(--border2)",borderRadius:10,overflow:"hidden"}}>
                      <button onClick={()=>updateCart(item._id,item.qty-1,item.size,item.color)}
                        style={{width:34,height:34,background:"var(--ivory2)",border:"none",
                                fontSize:18,fontWeight:700,color:"var(--rose)",cursor:"pointer"}}>−</button>
                      <span style={{padding:"0 14px",fontWeight:800,fontSize:14}}>{item.qty}</span>
                      <button onClick={()=>updateCart(item._id,item.qty+1,item.size,item.color)}
                        style={{width:34,height:34,background:"var(--ivory2)",border:"none",
                                fontSize:18,fontWeight:700,color:"var(--rose)",cursor:"pointer"}}>+</button>
                    </div>
                    <button onClick={()=>removeFromCart(item._id,item.size,item.color)}
                      style={{fontSize:12,color:"#DC2626",background:"#FEF2F2",border:"none",
                              cursor:"pointer",fontWeight:700,padding:"5px 12px",borderRadius:8,
                              display:"flex",alignItems:"center",gap:4}}>
                      <Ic icon={Trash2} size={12}/> Remove
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontFamily:"var(--font-d)",fontWeight:700,
                               fontSize:isMobile?16:20,
                               background:"linear-gradient(135deg,var(--rose),var(--saffron))",
                               WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                    {fmt(item.price * item.qty)}
                  </div>
                  <div style={{fontSize:11,color:"var(--muted)",fontWeight:500}}>
                    {fmt(item.price)} each
                  </div>
                </div>
              </div>
            ))}

            {/* Summary shown below items on mobile */}
            {isMobile && <CartSummary {...summaryProps}/>}
          </div>

          {/* Summary sidebar on desktop */}
          {!isMobile && <CartSummary {...summaryProps}/>}
        </div>
      </div>
    </div>
  );
};

export default CartPage;
