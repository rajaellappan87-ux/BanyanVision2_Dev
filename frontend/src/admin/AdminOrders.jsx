import React, { useState } from "react";
import { useBreakpoint } from "../hooks";
import { Ic, fmt, printShippingLabel } from "../utils/helpers";
import { apiUpdateStatus, apiDeleteOrder, apiExportOrdersEmail } from "../api";
import { CheckCircle, Clock, CreditCard, Download, FileText, Info, Mail, MapPin, Package, Phone, Printer, Search, Send, Settings, Tag, Trash2, Truck, XCircle } from "lucide-react";

/* ── ADMIN ORDERS LIST ───────────────────────────────────────────────────────── */
const AdminOrdersList = ({ orders, setOrders, isMobile, iStyle, updateSt, toast }) => {
  const [expanded,   setExpanded]   = useState({});
  const [statusF,    setStatusF]    = useState("all");
  const [search,     setSearch]     = useState("");
  const [sortBy,     setSortBy]     = useState("newest");
  const [confirmDel, setConfirmDel] = useState(null);
  const [exporting,  setExporting]  = useState(false);
  const [sending,    setSending]    = useState(false);

  const toggle = id => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const SC = {
    pending:    { bg:"#FEF3C7", c:"#D97706", icon:<Ic icon={Clock} size={13}/> },
    processing: { bg:"#EFF6FF", c:"#2563EB", icon:<Ic icon={Settings} size={13}/> },
    shipped:    { bg:"#F5F3FF", c:"#6D28D9", icon:<Ic icon={Truck} size={13}/> },
    delivered:  { bg:"#F0FDF4", c:"#16A34A", icon:<Ic icon={CheckCircle} size={13}/> },
    cancelled:  { bg:"#FEF2F2", c:"#DC2626", icon:<Ic icon={XCircle} size={13}/> },
  };

  // ── Filters + sort ──
  const filtered = orders
    .filter(ord => {
      const mS = statusF === "all" || ord.status === statusF;
      const q  = search.toLowerCase();
      const mQ = !q
        || ord._id.toLowerCase().includes(q)
        || ord.user?.name?.toLowerCase().includes(q)
        || ord.user?.email?.toLowerCase().includes(q)
        || ord.shippingAddress?.fullName?.toLowerCase().includes(q)
        || ord.shippingAddress?.phone?.includes(q);
      return mS && mQ;
    })
    .sort((a, b) => {
      if (sortBy === "newest")   return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest")   return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "highest")  return b.total - a.total;
      if (sortBy === "lowest")   return a.total - b.total;
      return 0;
    });

  // ── Summary counts ──
  const counts = ["pending","processing","shipped","delivered","cancelled"]
    .reduce((acc, s) => ({ ...acc, [s]: orders.filter(o => o.status===s).length }), {});
  const totalRev = filtered.reduce((s,o) => s+o.total, 0);

  // ── Delete order ──
  const deleteOrder = async id => {
    try {
      await apiDeleteOrder(id);
      setOrders(os => os.filter(o => o._id !== id));
      toast("Order deleted ✓");
      setConfirmDel(null);
    } catch(err) { toast(err.response?.data?.message || "Delete failed","error"); }
  };

  // ── Export CSV (download in browser) ──
  const exportCSV = () => {
    setExporting(true);
    const headers = ["Order ID","Date","Customer","Email","Phone","Items","Subtotal","Discount","Shipping","Total","Payment","Status","Coupon","Ship To Name","Address","City","State","PIN"];
    const rows = filtered.map(ord => {
      const sa = ord.shippingAddress || {};
      const items = ord.items.map(i => `${i.name}(x${i.qty})`).join(" | ");
      const esc = v => `"${String(v||"").replace(/"/g,'""')}"`;
      return [
        esc(ord._id.slice(-8).toUpperCase()),
        esc(new Date(ord.createdAt).toLocaleString("en-IN")),
        esc(ord.user?.name || ""),
        esc(ord.user?.email || ""),
        esc(sa.phone || ""),
        esc(items),
        esc(ord.subtotal || ord.total),
        esc(ord.discount || 0),
        esc(ord.shipping || 0),
        esc(ord.total),
        esc(ord.paymentId ? "Razorpay" : "COD"),
        esc(ord.status),
        esc(ord.coupon || ""),
        esc(sa.fullName || ""),
        esc(sa.address || ""),
        esc(sa.city || ""),
        esc(sa.state || ""),
        esc(sa.pin || ""),
      ].join(",");
    });
    const csv  = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    const date = new Date().toLocaleDateString("en-IN").replace(/\//g,"-");
    a.href = url; a.download = `BanyanVision_Orders_${statusF}_${date}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast(`CSV downloaded — ${filtered.length} orders ✓`);
    setExporting(false);
  };

  // ── Send CSV via email ──
  const sendEmail = async () => {
    setSending(true);
    try {
      const r = await apiExportOrdersEmail({ statusFilter: statusF });
      toast(r.data.message || "Export email sent ✓");
    } catch(err) { toast(err.response?.data?.message || "Email failed","error"); }
    setSending(false);
  };

  const iS = { background:"#fff", border:"1.5px solid var(--border2)", color:"var(--text)", padding:"8px 12px", fontSize:12, borderRadius:9, outline:"none", fontWeight:500, cursor:"pointer" };

  return (
    <div>
      {/* ── Header ── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{fontFamily:"var(--font-d)",color:"var(--dark)",margin:"0 0 8px",fontSize:28,fontWeight:700}}>All Orders</h2>
          <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
            {[["Total",orders.length,"var(--rose)"],["Revenue",fmt(orders.reduce((s,o)=>s+o.total,0)),"var(--teal)"],...Object.entries(counts).map(([s,n])=>[s.charAt(0).toUpperCase()+s.slice(1),n,SC[s]?.c])].map(([l,v,col])=>(
              <span key={l} style={{fontSize:11,fontWeight:700,color:"var(--muted)"}}>
                {l}: <span style={{color:col||"var(--dark)"}}>{v}</span>
              </span>
            ))}
          </div>
        </div>
        {/* Export buttons */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={exportCSV} disabled={exporting||!filtered.length}
            style={{...iS,display:"inline-flex",alignItems:"center",gap:6,padding:"9px 16px",background:"linear-gradient(135deg,#16A34A,#15803D)",color:"#fff",border:"none",borderRadius:10,fontWeight:700,opacity:exporting||!filtered.length?.6:1}}>
            <span style={{display:"flex",alignItems:"center",gap:6}}><Ic icon={Download} size={14}/>Download CSV</span>
          </button>
          <button onClick={sendEmail} disabled={sending||!filtered.length}
            style={{...iS,display:"inline-flex",alignItems:"center",gap:6,padding:"9px 16px",background:"linear-gradient(135deg,var(--rose),var(--saffron))",color:"#fff",border:"none",borderRadius:10,fontWeight:700,opacity:sending||!filtered.length?.6:1}}>
            {sending?"Sending…":"Email to Admin"}
          </button>
        </div>
      </div>

      {/* ── Status filter pills ── */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
        {[["all","All",orders.length],["pending","Pending",counts.pending],["processing","Processing",counts.processing],["shipped","Shipped",counts.shipped],["delivered","Delivered",counts.delivered],["cancelled","Cancelled",counts.cancelled]].map(([val,label,cnt])=>(
          <button key={val} onClick={()=>setStatusF(val)}
            style={{padding:"6px 14px",borderRadius:99,fontSize:11,fontWeight:700,cursor:"pointer",transition:"all .2s",border:"none",
              background:statusF===val?(val==="all"?"linear-gradient(135deg,var(--rose),var(--saffron))":SC[val]?"linear-gradient(135deg,"+SC[val].c+","+SC[val].c+"99)":"var(--rose)"):"var(--ivory3)",
              color:statusF===val?"#fff":"var(--muted)"}}>
            {label} {cnt > 0 && <span style={{opacity:.8}}>({cnt})</span>}
          </button>
        ))}
      </div>

      {/* ── Search + Sort ── */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search order ID, customer, phone…"
          style={{...iS,flex:1,minWidth:200,padding:"9px 13px"}}/>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{...iS}}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Value</option>
          <option value="lowest">Lowest Value</option>
        </select>
      </div>

      {/* ── Results info bar ── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,padding:"8px 14px",background:"var(--ivory2)",borderRadius:10,fontSize:12,color:"var(--muted)",fontWeight:500}}>
        <span>Showing <strong style={{color:"var(--dark)"}}>{filtered.length}</strong> of {orders.length} orders</span>
        {filtered.length > 0 && <span>Filtered total: <strong style={{color:"var(--rose)"}}>{fmt(totalRev)}</strong></span>}
      </div>

      {/* ── Orders list ── */}
      {filtered.length === 0 ? (
        <div style={{textAlign:"center",padding:"60px 0",color:"var(--muted)",fontSize:14}}>
          <div style={{fontSize:40,marginBottom:12}}></div>
          No orders match the current filter.
        </div>
      ) : filtered.map(ord => {
        const sa   = ord.shippingAddress || {};
        const ss   = SC[ord.status] || { bg:"#f1f5f9", c:"#64748b", icon:"•" };
        const open = expanded[ord._id];
        return (
          <div key={ord._id} style={{background:"#fff",borderRadius:14,marginBottom:12,overflow:"hidden",border:"1.5px solid var(--border)",boxShadow:"0 4px 24px rgba(194,24,91,.07)"}}>

            {/* ── Row header ── */}
            <div onClick={()=>toggle(ord._id)}
              style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",
                background:"linear-gradient(135deg,var(--roseL),var(--saffronL))",
                borderBottom:"1px solid var(--border)",flexWrap:"wrap",gap:8,cursor:"pointer"}}>
              <div style={{display:"flex",gap:14,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontFamily:"monospace",fontWeight:800,fontSize:13,color:"var(--dark)"}}>#{ord._id.slice(-8).toUpperCase()}</span>
                <span style={{color:"var(--muted)",fontSize:11,fontWeight:600}}>{ord.user?.name||ord.user?.email}</span>
                <span style={{color:"var(--muted)",fontSize:11}}>
                  {new Date(ord.createdAt).toLocaleDateString("en-IN")}{" "}
                  {new Date(ord.createdAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}
                </span>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontFamily:"var(--font-d)",fontWeight:800,fontSize:15,
                  background:"linear-gradient(135deg,var(--rose),var(--saffron))",
                  WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{fmt(ord.total)}</span>
                <span style={{padding:"3px 10px",borderRadius:99,fontSize:9,fontWeight:800,letterSpacing:.5,
                  background:ss.bg,color:ss.c}}>{ss.icon} {ord.status.toUpperCase()}</span>
                <select value={ord.status} onClick={e=>e.stopPropagation()} onChange={e=>updateSt(ord._id,e.target.value)}
                  style={{...iS,padding:"4px 8px",fontSize:11}}>
                  {["pending","processing","shipped","delivered","cancelled"].map(s=><option key={s}>{s}</option>)}
                </select>
                {/* Delete button */}
                <button onClick={e=>{e.stopPropagation();setConfirmDel(ord);}}
                  style={{background:"#FEF2F2",border:"none",color:"#DC2626",width:28,height:28,borderRadius:7,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}
                  title="Delete order"><Ic icon={Trash2} size={14}/></button>
                <span style={{fontSize:16,color:"var(--muted)",display:"inline-block",transition:"transform .2s",
                  transform:open?"rotate(180deg)":"rotate(0deg)"}}>⌄</span>
              </div>
            </div>

            {/* ── Items strip ── */}
            <div style={{padding:"10px 16px",display:"flex",gap:10,flexWrap:"wrap",borderBottom:"1px solid var(--border)"}}>
              {ord.items.map((item,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:7}}>
                  <img src={item.image||"https://placehold.co/36x44/FDF8F3/C2185B?text=P"} alt={item.name}
                    loading="lazy" style={{width:36,height:44,objectFit:"contain",background:"var(--ivory2)",borderRadius:8}}/>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:"var(--text)"}}>{item.name}</div>
                    <div style={{fontSize:10,color:"var(--muted)"}}>
                      {item.color&&item.color+" · "}{item.size&&item.size+" · "}×{item.qty} · {fmt(item.price)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Expanded details ── */}
            {open&&(
              <div style={{padding:16,background:"var(--ivory2)"}}>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:12,marginBottom:14}}>
                  {/* Ship To */}
                  <div style={{background:"#fff",borderRadius:12,padding:14,border:"1.5px solid var(--border)"}}>
                    <div style={{fontSize:9,fontWeight:800,color:"var(--rose)",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}><Ic icon={MapPin} size={12}/>Ship To</div>
                    <div style={{fontFamily:"var(--font-d)",fontSize:15,fontWeight:700,color:"var(--dark)",marginBottom:3}}>{sa.fullName||"—"}</div>
                    <div style={{fontSize:12,color:"var(--text2)",lineHeight:1.8}}>
                      {sa.address&&<div>{sa.address}</div>}
                      <div>{[sa.city,sa.state].filter(Boolean).join(", ")}{sa.pin?" — "+sa.pin:""}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8,padding:"6px 10px",background:"var(--roseL)",borderRadius:8}}>
                      <Ic icon={Phone} size={13} color="var(--rose)"/><span style={{fontWeight:700,fontSize:13}}>{sa.phone||"—"}</span>
                    </div>
                    {ord.user?.email&&(
                      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6,padding:"6px 10px",background:"var(--ivory3)",borderRadius:8}}>
                        <Ic icon={Mail} size={13} color="var(--muted)"/><span style={{fontSize:11,color:"var(--muted)",fontWeight:500,wordBreak:"break-all"}}>{ord.user.email}</span>
                      </div>
                    )}
                  </div>
                  {/* Payment */}
                  <div style={{background:"#fff",borderRadius:12,padding:14,border:"1.5px solid var(--border)"}}>
                    <div style={{fontSize:9,fontWeight:800,color:"var(--rose)",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}><Ic icon={CreditCard} size={12}/>Payment</div>
                    {[
                      ["Status",  ord.paymentId?"✅ Paid":"⏳ Pending"],
                      ["Method",  ord.paymentId?"Razorpay":"COD"],
                      ["Ref",     ord.paymentId?ord.paymentId.slice(-14):"—"],
                      ["Subtotal",fmt(ord.subtotal||ord.total)],
                      ...(ord.discount>0?[["Discount","−"+fmt(ord.discount)]]:[] ),
                      ["Delivery",ord.shipping===0?"FREE":fmt(ord.shipping)],
                      ["Total",   fmt(ord.total)],
                    ].map(([k,v])=>(
                      <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:11}}>
                        <span style={{color:"var(--muted)"}}>{k}</span>
                        <span style={{fontWeight:700,color:k==="Total"?"var(--rose)":k==="Discount"?"#16A34A":"var(--dark)"}}>{v}</span>
                      </div>
                    ))}
                    {ord.coupon&&<div style={{marginTop:6,padding:"4px 8px",background:"#FFF3E0",borderRadius:6,fontSize:10,fontWeight:700,color:"var(--saffron)"}}><Ic icon={Tag} size={12} style={{marginRight:4}}/>Coupon: {ord.coupon}</div>}
                  </div>
                  {/* Order Info */}
                  <div style={{background:"#fff",borderRadius:12,padding:14,border:"1.5px solid var(--border)"}}>
                    <div style={{fontSize:9,fontWeight:800,color:"var(--rose)",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}><Ic icon={FileText} size={12}/>Order Info</div>
                    {[
                      ["Order ID",  ord._id.slice(-8).toUpperCase()],
                      ["Placed On", new Date(ord.createdAt).toLocaleString("en-IN")],
                      ["Items",     ord.items.reduce((s,i)=>s+i.qty,0)+" item(s)"],
                    ].map(([k,v])=>(
                      <div key={k} style={{marginBottom:8}}>
                        <div style={{fontSize:9,color:"var(--muted)",fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{k}</div>
                        <div style={{fontWeight:700,fontSize:k==="Order ID"?13:12,fontFamily:k==="Order ID"?"monospace":"inherit",color:"var(--dark)"}}>{v}</div>
                      </div>
                    ))}
                    <div style={{marginTop:10}}>
                      <div style={{fontSize:9,color:"var(--muted)",fontWeight:600,textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Update Status</div>
                      <select value={ord.status} onChange={e=>updateSt(ord._id,e.target.value)}
                        style={{...iStyle,padding:"7px 10px",fontSize:12,borderRadius:8,background:"var(--ivory2)",width:"100%"}}>
                        {["pending","processing","shipped","delivered","cancelled"].map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                {/* Print + Delete */}
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <button onClick={()=>printShippingLabel(ord)}
                    style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 22px",
                      background:"linear-gradient(135deg,var(--dark),#3D1500)",border:"none",borderRadius:11,
                      color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:"0 4px 16px rgba(0,0,0,.2)"}}>
                    <span style={{display:"flex",alignItems:"center",gap:8}}><Ic icon={Printer} size={14}/>Print Shipping Label</span>
                  </button>
                  <button onClick={()=>setConfirmDel(ord)}
                    style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 22px",
                      background:"linear-gradient(135deg,#EF4444,#DC2626)",border:"none",borderRadius:11,
                      color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:"0 4px 16px rgba(239,68,68,.3)"}}>
                    <span style={{display:"flex",alignItems:"center",gap:8}}><Ic icon={Trash2} size={14}/>Delete Order</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* ── Delete Confirmation Modal ── */}
      {confirmDel&&(
        <div style={{position:"fixed",inset:0,background:"rgba(26,10,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,backdropFilter:"blur(4px)",padding:16}}>
          <div style={{background:"#fff",borderRadius:20,padding:28,maxWidth:380,width:"100%",textAlign:"center",boxShadow:"0 24px 64px rgba(0,0,0,.25)"}}>
            <div style={{fontSize:44,marginBottom:12}}><Ic icon={Trash2} size={44}/></div>
            <h3 style={{fontFamily:"var(--font-d)",fontSize:22,color:"var(--dark)",marginBottom:8,fontWeight:700}}>Delete Order?</h3>
            <p style={{color:"var(--muted)",fontSize:13,lineHeight:1.75,marginBottom:6}}>
              Permanently delete order <strong style={{color:"var(--rose)",fontFamily:"monospace"}}>#{confirmDel._id.slice(-8).toUpperCase()}</strong>?
            </p>
            <p style={{color:"#DC2626",fontSize:12,marginBottom:20,fontWeight:600}}>⚠ This cannot be undone.</p>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>setConfirmDel(null)}
                style={{padding:"11px 28px",borderRadius:12,background:"var(--ivory2)",border:"1.5px solid var(--border2)",fontWeight:700,fontSize:13,cursor:"pointer",color:"var(--text)"}}>Cancel</button>
              <button onClick={()=>deleteOrder(confirmDel._id)}
                style={{padding:"11px 28px",borderRadius:12,background:"linear-gradient(135deg,#EF4444,#DC2626)",border:"none",fontWeight:700,fontSize:13,cursor:"pointer",color:"#fff",boxShadow:"0 4px 16px rgba(239,68,68,.3)"}}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersList;