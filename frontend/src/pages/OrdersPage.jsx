import React, { useState, useEffect } from "react";
import { useBreakpoint } from "../hooks";
import { Ic, fmt } from "../utils/helpers";
import { apiGetMyOrders } from "../api";
import { CheckCircle, Clock, Package, Settings, ShoppingBag, Truck, XCircle } from "lucide-react";
import { Spinner } from "../components/ui/Common";

const OrdersPage = ({ setPage }) => {
  const {isMobile}=useBreakpoint();
  const [orders,setOrders]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{apiGetMyOrders().then(r=>setOrders(Array.isArray(r?.data?.orders)?r.data.orders:[])).catch(console.error).finally(()=>setLoading(false));},[]);

  // Status config — label, colour, icon, step number
  const STEPS=["pending","processing","shipped","delivered"];
  const SC={
    pending:  {bg:"#FEF3C7",c:"#D97706",icon:<Ic icon={Clock} size={14}/>,label:"Order Placed"},
    processing:{bg:"#EFF6FF",c:"#2563EB",icon:<Ic icon={Settings} size={14}/>,label:"Being Prepared"},
    shipped:  {bg:"#F5F3FF",c:"#6D28D9",icon:<Ic icon={Truck} size={14}/>,label:"Out for Delivery"},
    delivered:{bg:"#F0FDF4",c:"#16A34A",icon:<Ic icon={CheckCircle} size={14}/>,label:"Delivered"},
    cancelled:{bg:"#FEF2F2",c:"#DC2626",icon:<Ic icon={XCircle} size={14}/>,label:"Cancelled"},
  };

  return(
    <div style={{background:"var(--ivory)",minHeight:"100vh",padding:isMobile?"20px 16px":"44px 80px"}}>
      <div style={{maxWidth:860,margin:"0 auto"}}>
        <h1 style={{fontFamily:"var(--font-d)",color:"var(--dark)",fontSize:isMobile?28:44,fontWeight:700,marginBottom:24}}>My Orders</h1>
        {loading?<Spinner/>:orders.length===0?(
          <div style={{textAlign:"center",padding:"60px 0"}}>
            <div style={{fontSize:52,marginBottom:12}}>📦</div>
            <div style={{fontFamily:"var(--font-d)",fontSize:26,color:"var(--muted)",marginBottom:14}}>No orders yet</div>
            <button className="btn btn-rose" onClick={()=>setPage("shop")} style={{padding:"12px 28px",fontSize:14}}>Start Shopping</button>
          </div>
        ):orders.map(ord=>{
          const s=ord.status;
          const sc=SC[s]||{bg:"#f1f5f9",c:"#64748b",icon:<Ic icon={Package} size={13}/>,label:s};
          const stepIdx=STEPS.indexOf(s);
          const cancelled=s==="cancelled";
          return(
            <div key={ord._id} style={{background:"#fff",borderRadius:"20px",border:"1.5px solid var(--border)",marginBottom:18,overflow:"hidden",boxShadow:"0 4px 24px rgba(194,24,91,0.07)"}}>

              {/* ── Top header ── */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:isMobile?"12px 16px":"14px 22px",background:"linear-gradient(135deg,var(--roseL),var(--saffronL))",borderBottom:"1px solid var(--border)",flexWrap:"wrap",gap:8}}>
                <div style={{display:"flex",gap:isMobile?14:28,flexWrap:"wrap"}}>
                  {[["Order",`#${ord._id.slice(-8).toUpperCase()}`],["Date",new Date(ord.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})],["Total",fmt(ord.total)]].map(([k,v])=>(
                    <div key={k}>
                      <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:"var(--muted)",textTransform:"uppercase"}}>{k}</div>
                      <div style={{fontFamily:k==="Total"?"var(--font-d)":"var(--font-b)",fontWeight:700,fontSize:k==="Total"?16:13,marginTop:2,
                        background:k==="Total"?"linear-gradient(135deg,var(--rose),var(--saffron))":"none",
                        WebkitBackgroundClip:k==="Total"?"text":"unset",WebkitTextFillColor:k==="Total"?"transparent":"unset",
                        color:k!=="Total"?"var(--text)":"unset"}}>{v}</div>
                    </div>
                  ))}
                </div>
                <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:99,background:sc.bg,color:sc.c,fontWeight:800,fontSize:11,letterSpacing:.3}}>
                  {sc.icon} {sc.label}
                </span>
              </div>

              {/* ── Items ── */}
              <div style={{padding:isMobile?"12px 16px":"14px 22px",display:"flex",flexWrap:"wrap",gap:14,borderBottom:"1px solid var(--border)"}}>
                {ord.items.map((item,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                    <img src={item.image||`https://placehold.co/44x54/FDF8F3/C2185B?text=P`} alt={item.name} loading="lazy" style={{width:44,height:54,objectFit:"contain",background:"var(--ivory2)",borderRadius:10,boxShadow:"0 2px 8px rgba(0,0,0,.08)"}}/>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{item.name}</div>
                      <div style={{fontSize:11,color:"var(--muted)",marginTop:2,fontWeight:500}}>
                        {[item.color,item.size,`Qty: ${item.qty}`,fmt(item.price*item.qty)].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Order progress tracker ── */}
              <div style={{padding:isMobile?"16px":"20px 24px"}}>
                {cancelled?(
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:"#FEF2F2",borderRadius:12,border:"1.5px solid #FECACA"}}>
                    <Ic icon={XCircle} size={22} color="#DC2626"/>
                    <div>
                      <div style={{fontWeight:700,color:"#DC2626",fontSize:14}}>Order Cancelled</div>
                      <div style={{fontSize:12,color:"#EF4444",marginTop:2}}>This order has been cancelled. Contact support if you have questions.</div>
                    </div>
                  </div>
                ):(
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",letterSpacing:.5,textTransform:"uppercase",marginBottom:14}}>Delivery Progress</div>
                    <div style={{display:"flex",alignItems:"center",position:"relative"}}>
                      {STEPS.map((step,i)=>{
                        const done=i<=stepIdx;
                        const active=i===stepIdx;
                        const sc2=SC[step];
                        return(
                          <React.Fragment key={step}>
                            {/* connector line */}
                            {i>0&&(
                              <div style={{flex:1,height:3,background:i<=stepIdx?"linear-gradient(90deg,var(--rose),var(--saffron))":"var(--border)",borderRadius:2,transition:"background .4s",margin:"0 4px",marginBottom:isMobile?0:20}}/>
                            )}
                            {/* step dot */}
                            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,flexShrink:0}}>
                              <div style={{
                                width:isMobile?32:40,height:isMobile?32:40,borderRadius:"50%",
                                background:done?"linear-gradient(135deg,var(--rose),var(--saffron))":"#fff",
                                border:`2px solid ${done?"transparent":"var(--border2)"}`,
                                display:"flex",alignItems:"center",justifyContent:"center",
                                fontSize:isMobile?14:18,
                                boxShadow:active?"0 0 0 4px rgba(194,24,91,.15)":done?"0 4px 12px rgba(194,24,91,.25)":"none",
                                transition:"all .3s",
                              }}>{done?<span style={{fontSize:isMobile?12:16,filter:"grayscale(0)"}}>{sc2.icon}</span>:<span style={{fontSize:isMobile?10:13,opacity:.3}}>{sc2.icon}</span>}</div>
                              {!isMobile&&(
                                <div style={{fontSize:10,fontWeight:done?700:500,color:done?"var(--rose)":"var(--muted)",textAlign:"center",whiteSpace:"nowrap",transition:"color .3s"}}>{sc2.label}</div>
                              )}
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                    {isMobile&&(
                      <div style={{marginTop:10,fontSize:12,fontWeight:700,color:"var(--rose)",textAlign:"center"}}>{sc.label}</div>
                    )}
                    {stepIdx>=0&&stepIdx<3&&(
                      <div style={{marginTop:14,padding:"10px 14px",background:"var(--roseL)",borderRadius:10,fontSize:12,color:"var(--rose)",fontWeight:600,display:"flex",alignItems:"center",gap:8}}>
                        <span>{sc.icon}</span>
                        <span>{{0:"Your order has been placed and is awaiting confirmation.",1:"Your order is being packed and prepared for dispatch.",2:"Your order is on the way! Expected delivery in 1–3 days."}[stepIdx]}</span>
                      </div>
                    )}
                    {stepIdx===3&&(
                      <div style={{marginTop:14,padding:"10px 14px",background:"#F0FDF4",borderRadius:10,fontSize:12,color:"#16A34A",fontWeight:600,display:"flex",alignItems:"center",gap:8}}>
                        <Ic icon={CheckCircle} size={14} color="#16A34A"/><span>Your order has been delivered. Thank you for shopping with BanyanVision — Empowering Dreams, Inspiring Innovations!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── WISHLIST ────────────────────────────────────────────────────────────────── */

export default OrdersPage;