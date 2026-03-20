import React, { useState, useEffect } from "react";
import { useBreakpoint } from "../hooks";
import { useCatConfig } from "../store/catStore";
import { Ic, fmt } from "../utils/helpers";
import { apiAdminInventory, apiAdminStockUpdate } from "../api";
import { Edit, Minus, Plus, RefreshCw, Search } from "lucide-react";

/* ── ADMIN INVENTORY ─────────────────────────────────────────────────────────── */
const AdminInventory = ({ toast }) => {
  const { isMobile } = useBreakpoint();
  const [products, setProducts]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [search,   setSearch]     = useState("");
  const [catF,     setCatF]       = useState("all");
  const [stockF,   setStockF]     = useState("all");
  const [sortBy,   setSortBy]     = useState("stock_asc");
  const [editing,  setEditing]    = useState(null);   // { product, mode: "set"|"add"|"remove" }
  const [adjVal,   setAdjVal]     = useState("");
  const [saving,   setSaving]     = useState(false);
  const catConfig = useCatConfig();

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiAdminInventory();
      setProducts(Array.isArray(r?.data?.products)?r.data.products:[]);
    } catch { toast("Failed to load inventory","error"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Derived categories list from actual products
  const cats = ["all", ...Array.from(new Set(products.map(p => p.category))).sort()];

  const sorted = [...products]
    .filter(p => {
      const q = search.toLowerCase();
      const mQ = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      const mC = catF === "all" || p.category === catF;
      const mS = stockF === "all"
        || (stockF === "out"  && p.stock === 0)
        || (stockF === "low"  && p.stock > 0  && p.stock <= 10)
        || (stockF === "ok"   && p.stock > 10 && p.stock <= 50)
        || (stockF === "high" && p.stock > 50);
      return mQ && mC && mS;
    })
    .sort((a, b) => {
      if (sortBy === "stock_asc")  return a.stock - b.stock;
      if (sortBy === "stock_desc") return b.stock - a.stock;
      if (sortBy === "name")       return a.name.localeCompare(b.name);
      if (sortBy === "cat")        return a.category.localeCompare(b.category);
      return 0;
    });

  const stockBadge = (s) => {
    if (s === 0)   return { label:"Out of Stock", bg:"#FEF2F2", c:"#DC2626", dot:"#DC2626" };
    if (s <= 10)   return { label:"Low Stock",    bg:"#FFF7ED", c:"#D97706", dot:"#F59E0B" };
    if (s <= 50)   return { label:"In Stock",     bg:"#F0FDF4", c:"#16A34A", dot:"#22C55E" };
    return           { label:"Well Stocked",  bg:"#EFF6FF", c:"#2563EB", dot:"#3B82F6" };
  };

  const openEdit = (p, mode) => {
    setEditing({ product: p, mode });
    setAdjVal(mode === "set" ? String(p.stock) : "");
  };

  const applyUpdate = async () => {
    if (!adjVal || isNaN(adjVal)) { toast("Enter a valid number","error"); return; }
    const val = Number(adjVal);
    if (val < 0 && editing.mode !== "remove") { toast("Use Remove mode for negative values","error"); return; }
    setSaving(true);
    try {
      let body = {};
      if (editing.mode === "set")    body = { stock: val };
      if (editing.mode === "add")    body = { adjustment: +val };
      if (editing.mode === "remove") body = { adjustment: -val };
      const r = await apiAdminStockUpdate(editing.product._id, body);
      setProducts(ps => ps.map(p => p._id === editing.product._id ? { ...p, stock: r.data.product.stock } : p));
      toast(`Stock updated → ${r.data.product.stock} units ✓`);
      setEditing(null);
      setAdjVal("");
    } catch(err) { toast(err.response?.data?.message || "Update failed","error"); }
    setSaving(false);
  };

  // Summary stats
  const totalUnits  = products.reduce((s,p) => s + p.stock, 0);
  const outOfStock  = products.filter(p => p.stock === 0).length;
  const lowStock    = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const totalSKUs   = products.length;

  const iS = { background:"#fff", border:"1.5px solid var(--border2)", color:"var(--text)", padding:"9px 13px", fontSize:13, borderRadius:10, outline:"none", fontWeight:500 };

  return (
    <div>
      {/* ── Header ── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{fontFamily:"var(--font-d)",color:"var(--dark)",margin:"0 0 8px",fontSize:28,fontWeight:700}}>📦 Inventory</h2>
          <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
            {[
              ["Total SKUs",   totalSKUs,  "var(--rose)"],
              ["Total Units",  totalUnits, "var(--teal)"],
              ["Out of Stock", outOfStock, "#DC2626"],
              ["Low Stock",    lowStock,   "#D97706"],
            ].map(([l,v,col]) => (
              <div key={l} style={{textAlign:"center"}}>
                <div style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:800,color:col}}>{v}</div>
                <div style={{fontSize:10,color:"var(--muted)",fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <button onClick={load} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"10px 18px",background:"var(--ivory2)",border:"1.5px solid var(--border2)",borderRadius:11,fontWeight:700,fontSize:13,cursor:"pointer",color:"var(--text)"}}>
          <span style={{display:"flex",alignItems:"center",gap:6}}><Ic icon={RefreshCw} size={14}/>Refresh</span>
        </button>
      </div>

      {/* ── Alert banners ── */}
      {outOfStock > 0 && (
        <div style={{background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:12,padding:"10px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:10,fontSize:13,color:"#DC2626",fontWeight:600}}>
          {outOfStock} product{outOfStock>1?"s are":" is"} out of stock — restock immediately to avoid lost sales.
          <button onClick={()=>setStockF("out")} style={{marginLeft:"auto",padding:"4px 10px",borderRadius:7,background:"#DC2626",border:"none",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>View</button>
        </div>
      )}
      {lowStock > 0 && (
        <div style={{background:"#FFF7ED",border:"1.5px solid #FED7AA",borderRadius:12,padding:"10px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10,fontSize:13,color:"#D97706",fontWeight:600}}>
          {lowStock} product{lowStock>1?"s are":" is"} running low (≤10 units).
          <button onClick={()=>setStockF("low")} style={{marginLeft:"auto",padding:"4px 10px",borderRadius:7,background:"#D97706",border:"none",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>View</button>
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search product or category…"
          style={{...iS,flex:1,minWidth:180}}/>
        <select value={catF} onChange={e=>setCatF(e.target.value)} style={{...iS,width:"auto"}}>
          {cats.map(c=><option key={c} value={c}>{c==="all"?"All Categories":c}</option>)}
        </select>
        <select value={stockF} onChange={e=>setStockF(e.target.value)} style={{...iS,width:"auto"}}>
          <option value="all">All Stock Levels</option>
          <option value="out">Out of Stock</option>
          <option value="low">Low (1–10)</option>
          <option value="ok">OK (11–50)</option>
          <option value="high">High (51+)</option>
        </select>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{...iS,width:"auto"}}>
          <option value="stock_asc">Stock: Low → High</option>
          <option value="stock_desc">Stock: High → Low</option>
          <option value="name">Name A–Z</option>
          <option value="cat">Category</option>
        </select>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div style={{textAlign:"center",padding:60,color:"var(--muted)",fontSize:15}}>Loading inventory…</div>
      ) : (
        <div style={{background:"#fff",borderRadius:16,border:"1.5px solid var(--border)",overflow:"hidden",boxShadow:"0 4px 24px rgba(194,24,91,.06)"}}>
          {/* Table header — desktop only */}
          {!isMobile && (
            <div style={{display:"grid",gridTemplateColumns:"2.5fr 1.5fr 80px 120px 180px",padding:"10px 18px",background:"linear-gradient(135deg,var(--roseL),var(--saffronL))",borderBottom:"1.5px solid var(--border)"}}>
              {["Product","Category","Price","Stock","Actions"].map(h=>(
                <div key={h} style={{fontSize:10,fontWeight:800,color:"var(--rose)",letterSpacing:1,textTransform:"uppercase"}}>{h}</div>
              ))}
            </div>
          )}

          {sorted.length === 0 ? (
            <div style={{textAlign:"center",padding:"48px 0",color:"var(--muted)",fontSize:14}}>No products match the current filter.</div>
          ) : sorted.map((p, idx) => {
            const sb = stockBadge(p.stock);
            return isMobile ? (
              /* ── Mobile card ── */
              <div key={p._id} style={{padding:"14px 16px",borderBottom:"1px solid var(--border)",background:p.stock===0?"#FEF2F2":p.stock<=10?"#FFFBF0":"#fff"}}>
                <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:10}}>
                  <img src={p.images?.[0]?.url||"https://placehold.co/48x58/FDF8F3/C2185B?text=P"} alt={p.name}
                    loading="lazy" style={{width:48,height:58,objectFit:"contain",background:"var(--ivory2)",borderRadius:8,flexShrink:0,border:"1px solid var(--border)"}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:13,color:"var(--dark)",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                    <div style={{fontSize:11,color:"var(--rose)",fontWeight:600,marginBottom:4}}>{p.category}</div>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <span style={{fontFamily:"var(--font-d)",fontSize:14,fontWeight:800,color:"var(--dark)"}}>₹{p.price.toLocaleString("en-IN")}</span>
                      <span style={{padding:"2px 10px",borderRadius:99,fontSize:10,fontWeight:800,background:sb.bg,color:sb.c}}>
                        <span style={{color:sb.dot}}>●</span> {p.stock} units
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  {[["add","#16A34A","Add",Plus],["set","var(--rose)","Set",Edit],["remove","#DC2626","Remove",Minus]].map(([mode,col,label,BtnIcon])=>(
                    <button key={mode} onClick={()=>openEdit(p,mode)}
                      style={{flex:1,padding:"6px 0",borderRadius:8,fontSize:11,fontWeight:700,border:"none",cursor:"pointer",
                        background:mode==="add"?"#F0FDF4":mode==="set"?"var(--roseL)":"#FEF2F2",color:col}}>
                      {<><Ic icon={BtnIcon} size={11}/> {label}</>}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* ── Desktop row ── */
              <div key={p._id} style={{display:"grid",gridTemplateColumns:"2.5fr 1.5fr 80px 120px 180px",padding:"12px 18px",borderBottom:"1px solid var(--border)",alignItems:"center",
                background:p.stock===0?"#FFF5F5":p.stock<=10?"#FFFCF0":idx%2===0?"#fff":"#FAFAFA",transition:"background .15s"}}
                onMouseEnter={e=>e.currentTarget.style.background="var(--roseL)"}
                onMouseLeave={e=>e.currentTarget.style.background=p.stock===0?"#FFF5F5":p.stock<=10?"#FFFCF0":idx%2===0?"#fff":"#FAFAFA"}>

                {/* Product */}
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <img src={p.images?.[0]?.url||"https://placehold.co/40x48/FDF8F3/C2185B?text=P"} alt={p.name}
                    loading="lazy" style={{width:40,height:48,objectFit:"contain",background:"var(--ivory2)",borderRadius:7,flexShrink:0,border:"1px solid var(--border)"}}/>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:"var(--dark)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:240}}>{p.name}</div>
                    {p.badge&&<span style={{fontSize:9,fontWeight:800,color:"var(--saffron)",background:"#FFF3E0",padding:"1px 6px",borderRadius:4,letterSpacing:.3}}>{p.badge}</span>}
                  </div>
                </div>

                {/* Category */}
                <div style={{fontSize:12,color:"var(--rose)",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.category}</div>

                {/* Price */}
                <div style={{fontFamily:"var(--font-d)",fontSize:13,fontWeight:800,color:"var(--dark)"}}>₹{p.price.toLocaleString("en-IN")}</div>

                {/* Stock */}
                <div style={{display:"flex",flexDirection:"column",gap:3}}>
                  <span style={{fontFamily:"var(--font-d)",fontSize:17,fontWeight:800,color:sb.c}}>{p.stock}</span>
                  <span style={{padding:"2px 8px",borderRadius:99,fontSize:9,fontWeight:800,background:sb.bg,color:sb.c,width:"fit-content"}}>
                    <span style={{color:sb.dot}}>●</span> {sb.label}
                  </span>
                </div>

                {/* Actions */}
                <div style={{display:"flex",gap:5}}>
                  <button onClick={()=>openEdit(p,"add")}
                    style={{padding:"5px 10px",borderRadius:8,fontSize:11,fontWeight:700,border:"none",cursor:"pointer",background:"#F0FDF4",color:"#16A34A",transition:"opacity .15s"}}
                    onMouseEnter={e=>e.currentTarget.style.opacity=".75"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                    <span style={{display:"flex",alignItems:"center",gap:4}}><Ic icon={Plus} size={12}/>Add</span>
                  </button>
                  <button onClick={()=>openEdit(p,"remove")}
                    style={{padding:"5px 10px",borderRadius:8,fontSize:11,fontWeight:700,border:"none",cursor:"pointer",background:"#FEF2F2",color:"#DC2626",transition:"opacity .15s"}}
                    onMouseEnter={e=>e.currentTarget.style.opacity=".75"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                    <span style={{display:"flex",alignItems:"center",gap:4}}><Ic icon={Minus} size={12}/>Remove</span>
                  </button>
                  <button onClick={()=>openEdit(p,"set")}
                    style={{padding:"5px 10px",borderRadius:8,fontSize:11,fontWeight:700,border:"1.5px solid var(--border2)",cursor:"pointer",background:"#fff",color:"var(--muted)",transition:"all .15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--rose)";e.currentTarget.style.color="var(--rose)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.color="var(--muted)";}}>
                    <span style={{display:"flex",alignItems:"center",gap:4}}><Ic icon={Edit} size={12}/>Set</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Footer summary */}
          <div style={{padding:"10px 18px",background:"var(--ivory2)",borderTop:"1.5px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
            <span style={{fontSize:11,color:"var(--muted)",fontWeight:500}}>
              Showing {sorted.length} of {products.length} products
            </span>
            <span style={{fontSize:11,color:"var(--muted)",fontWeight:500}}>
              Filtered total: <strong style={{color:"var(--dark)"}}>{sorted.reduce((s,p)=>s+p.stock,0).toLocaleString("en-IN")} units</strong>
            </span>
          </div>
        </div>
      )}

      {/* ── Stock Update Modal ── */}
      {editing && (
        <div style={{position:"fixed",inset:0,background:"rgba(26,10,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,backdropFilter:"blur(4px)",padding:16}}>
          <div style={{background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:400,boxShadow:"0 24px 64px rgba(0,0,0,.22)"}}>
            {/* Modal header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div>
                <div style={{fontSize:10,fontWeight:800,letterSpacing:1,textTransform:"uppercase",color:"var(--muted)",marginBottom:4}}>
                  {editing.mode==="add"?<span style={{display:"flex",alignItems:"center",gap:4}}><Ic icon={Plus} size={12}/>Add Stock</span>:editing.mode==="remove"?<span style={{display:"flex",alignItems:"center",gap:4}}><Ic icon={Minus} size={12}/>Remove Stock</span>:<span style={{display:"flex",alignItems:"center",gap:4}}><Ic icon={Edit} size={12}/>Set Exact Stock</span>}
                </div>
                <h3 style={{fontFamily:"var(--font-d)",fontSize:19,color:"var(--dark)",fontWeight:700,margin:0,lineHeight:1.3}}>{editing.product.name}</h3>
              </div>
              <button onClick={()=>setEditing(null)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"var(--muted)",lineHeight:1,flexShrink:0}}>×</button>
            </div>

            {/* Product info strip */}
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:"var(--ivory2)",borderRadius:12,marginBottom:20,border:"1.5px solid var(--border)"}}>
              <img src={editing.product.images?.[0]?.url||"https://placehold.co/44x54/FDF8F3/C2185B?text=P"} alt=""
                style={{width:44,height:54,objectFit:"contain",background:"var(--ivory2)",borderRadius:8,border:"1px solid var(--border)"}}/>
              <div>
                <div style={{fontSize:11,color:"var(--muted)",fontWeight:600}}>{editing.product.category}</div>
                <div style={{fontSize:13,fontWeight:700,color:"var(--dark)"}}>
                  Current stock: <span style={{color:stockBadge(editing.product.stock).c,fontFamily:"var(--font-d)",fontSize:16}}>{editing.product.stock}</span> units
                </div>
              </div>
            </div>

            {/* Mode switcher */}
            <div style={{display:"flex",gap:6,marginBottom:16}}>
              {[["add","Add",Plus],["remove","Remove",Minus],["set","Set Exact",Edit]].map(([m,lbl,MIcon])=>(
                <button key={m} onClick={()=>{setEditing(e=>({...e,mode:m}));setAdjVal("");}}
                  style={{flex:1,padding:"8px 0",borderRadius:9,fontSize:11,fontWeight:700,cursor:"pointer",transition:"all .2s",
                    background:editing.mode===m?"linear-gradient(135deg,var(--rose),var(--saffron))":"var(--ivory2)",
                    border:editing.mode===m?"none":"1.5px solid var(--border2)",
                    color:editing.mode===m?"#fff":"var(--muted)"}}>
                  {<><Ic icon={MIcon} size={11}/> {lbl}</>}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{marginBottom:10}}>
              <label style={{display:"block",fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:.5,textTransform:"uppercase",marginBottom:8}}>
                {editing.mode==="set"?"New Stock Count":"Units to "+editing.mode.charAt(0).toUpperCase()+editing.mode.slice(1)}
              </label>
              <input type="number" min="0" value={adjVal} onChange={e=>setAdjVal(e.target.value)}
                placeholder={editing.mode==="set"?`Current: ${editing.product.stock}`:"Enter quantity…"}
                style={{...iS,width:"100%",fontSize:20,fontWeight:800,textAlign:"center",padding:"14px",borderRadius:12,letterSpacing:1}}
                onFocus={e=>e.target.style.borderColor="var(--rose)"}
                onBlur={e=>e.target.style.borderColor="var(--border2)"}
                onKeyDown={e=>e.key==="Enter"&&applyUpdate()}
                autoFocus/>
            </div>

            {/* Preview of result */}
            {adjVal && !isNaN(adjVal) && (
              <div style={{marginBottom:18,padding:"8px 14px",borderRadius:10,background:"var(--ivory2)",fontSize:12,fontWeight:700,color:"var(--text)",textAlign:"center"}}>
                {editing.mode==="set"  && <>Stock will be set to <span style={{color:"var(--rose)",fontSize:15,fontFamily:"var(--font-d)"}}>{Math.max(0,Number(adjVal))}</span> units</>}
                {editing.mode==="add"  && <>Stock will increase: {editing.product.stock} → <span style={{color:"#16A34A",fontSize:15,fontFamily:"var(--font-d)"}}>{editing.product.stock+Math.max(0,Number(adjVal))}</span></>}
                {editing.mode==="remove"&&<>Stock will decrease: {editing.product.stock} → <span style={{color:"#DC2626",fontSize:15,fontFamily:"var(--font-d)"}}>{Math.max(0,editing.product.stock-Math.max(0,Number(adjVal)))}</span></>}
              </div>
            )}

            {/* Buttons */}
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setEditing(null)}
                style={{flex:1,padding:"12px 0",borderRadius:11,background:"var(--ivory2)",border:"1.5px solid var(--border2)",fontWeight:600,fontSize:13,cursor:"pointer",color:"var(--muted)"}}>
                Cancel
              </button>
              <button onClick={applyUpdate} disabled={saving||!adjVal}
                style={{flex:2,padding:"12px 0",borderRadius:11,fontWeight:700,fontSize:13,cursor:saving||!adjVal?"not-allowed":"pointer",border:"none",color:"#fff",
                  background:editing.mode==="remove"?"linear-gradient(135deg,#EF4444,#DC2626)":editing.mode==="add"?"linear-gradient(135deg,#16A34A,#15803D)":"linear-gradient(135deg,var(--rose),var(--saffron))",
                  opacity:saving||!adjVal?.6:1,boxShadow:"0 4px 16px rgba(0,0,0,.15)"}}>
                {saving?"Updating…":editing.mode==="add"?"Add Stock":editing.mode==="remove"?"Remove Stock":"Update Stock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;