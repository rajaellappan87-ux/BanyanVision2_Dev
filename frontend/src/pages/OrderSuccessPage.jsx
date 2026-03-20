import React from "react";
import { useBreakpoint } from "../hooks";
import { Ic, fmt } from "../utils/helpers";
;
import { SecLabel } from "../components/ui/Common";

const OrderSuccessPage = ({ orderId, setPage }) => {
  const [order,setOrder]=useState(null);
  useEffect(()=>{apiGetMyOrders().then(r=>{setOrder(r.data.orders.find(o=>o._id===orderId));}).catch(console.error);},[orderId]);
  return(
    <div style={{background:"linear-gradient(160deg,var(--roseL),var(--saffronL),var(--tealL))",minHeight:"80vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{textAlign:"center",maxWidth:480,width:"100%"}}>
        <div style={{width:90,height:90,borderRadius:"50%",background:"linear-gradient(135deg,var(--rose),var(--saffron))",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",fontSize:42,boxShadow:"0 12px 40px rgba(194,24,91,.35)",animation:"glow 2s ease-in-out infinite"}}>✓</div>
        <SecLabel>Order Confirmed</SecLabel>
        <h1 style={{fontFamily:"var(--font-d)",color:"var(--dark)",fontSize:44,fontWeight:700,marginTop:10}}>Thank You!</h1>
        {order&&(
          <div style={{padding:"18px 24px",margin:"20px 0",background:"#fff",borderRadius:"20px",border:"1.5px solid var(--border)",textAlign:"left",boxShadow:"0 4px 24px rgba(194,24,91,0.08)"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:12,fontWeight:700,color:"var(--muted)",letterSpacing:.5}}>ORDER #{order._id.slice(-8).toUpperCase()}</span>
              <span style={{fontFamily:"var(--font-d)",background:"linear-gradient(135deg,var(--rose),var(--saffron))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:700,fontSize:18}}>{fmt(order.total)}</span>
            </div>
            <div style={{fontSize:11,color:"var(--muted)",fontWeight:500}}>Payment ID: {order.paymentId}</div>
          </div>
        )}
        <p style={{color:"var(--text2)",fontSize:14,marginBottom:28,lineHeight:1.8,fontWeight:400}}>Payment verified. Your order is being lovingly prepared.</p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <button className="btn btn-rose" onClick={()=>setPage("orders")} style={{padding:"13px 28px",fontSize:14}}>Track Orders</button>
          <button className="btn btn-ghost" onClick={()=>setPage("shop")} style={{padding:"13px 28px",fontSize:14}}>Continue Shopping</button>
        </div>
      </div>
    </div>
  );
};

/* ── ORDERS ──────────────────────────────────────────────────────────────────── */
/* ── SHIPPING LABEL PRINT UTILITY ───────────────────────────────────────────── */

export default OrderSuccessPage;