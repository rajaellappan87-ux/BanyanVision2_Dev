import React, { useState, useEffect, useCallback } from "react";
import { useBreakpoint } from "../hooks";
import { useAuth } from "../context/AuthContext";
import { useCatConfig } from "../store/catStore";
import { Ic, fmt, printShippingLabel, COLORS_MAP } from "../utils/helpers";
import {
  apiAdminStats, apiGetAllOrders, apiGetProducts, apiAdminUsers, apiGetCoupons,
  apiCreateProduct, apiUpdateProduct, apiDeleteProduct, apiDeleteProductImage,
  apiUpdateStatus, apiCreateCoupon, apiDeleteCoupon, apiAdminStockUpdate,
} from "../api";
import { Spinner } from "../components/ui/Common";
import { ImageUploader } from "../components/ui/ImageCropModal";
import AdminOrdersList  from "./AdminOrders";
import AdminInventory   from "./AdminInventory";
import AdminCustomers   from "./AdminCustomers";
import SiteSettings     from "./SiteSettings";
import CategoryManager  from "./CategoryManager";
import PromoBannerEditor from "./PromoBannerEditor";
import MarqueeBannerEditor from "./MarqueeBannerEditor";
import LogViewer from "./LogViewer";
import AboutPageEditor  from "./AboutPageEditor";
import { BarChart2, Edit, FileText, Gift, Layers, LayoutDashboard, Package, Percent, PlusCircle, Save, Settings, ShoppingBag, Tag, TrendingUp, Users, Warehouse, Zap } from "lucide-react";

const AdminDashboard = ({ setPage, toast }) => {
  const {isMobile}=useBreakpoint();
  const [tab,setTab]=useState("overview");
  const [drawer,setDrawer]=useState(false);
  const liveCat=useCatConfig();
  const [stats,setStats]=useState(null);
  const [orders,setOrders]=useState([]);
  const [products,setProducts]=useState([]);
  const [users,setUsers]=useState([]);
  const [coupons,setCoupons]=useState([]);
  const [loading,setLoading]=useState(true);
  const [pf,setPf]=useState({name:"",description:"",price:"",originalPrice:"",category:"Kurtas & Sets",fabric:"",occasion:"",care:"",stock:"",badge:"",featured:false,trending:false});
  const [pSizes,setPSizes]=useState([]);
  const [pColors,setPColors]=useState([]);
  const [pFiles,setPFiles]=useState([]);
  const [editId,setEditId]=useState(null);
  const [exImgs,setExImgs]=useState([]);
  const [saving,setSaving]=useState(false);
  const [cf,setCf]=useState({code:"",type:"percent",discount:"",desc:"",minOrder:0});

  const reload=useCallback(()=>{
    setLoading(true);
    Promise.all([apiAdminStats(),apiGetAllOrders(),apiGetProducts({limit:50}),apiAdminUsers(),apiGetCoupons()])
      .then(([s,o,p,u,c])=>{setStats(s?.data?.stats||{});setOrders(Array.isArray(o?.data?.orders)?o.data.orders:[]);setProducts(Array.isArray(p?.data?.products)?p.data.products:[]);setUsers(Array.isArray(u?.data?.users)?u.data.users:[]);setCoupons(Array.isArray(c?.data?.coupons)?c.data.coupons:[]);})
      .catch(console.error).finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{reload();},[reload]);

  const saveProd=async()=>{
    setSaving(true);
    try{
      const fd=new FormData();
      Object.entries(pf).forEach(([k,v])=>fd.append(k,v));
      fd.append("sizes",JSON.stringify(pSizes));fd.append("colors",JSON.stringify(pColors));
      pFiles.forEach(f=>fd.append("images",f));
      if(editId){await apiUpdateProduct(editId,fd);toast("Product updated!");}
      else{await apiCreateProduct(fd);toast("Product created!");}
      const r=await apiGetProducts({limit:50});setProducts(Array.isArray(r?.data?.products)?r.data.products:[]);resetP();
    }catch(err){toast(err.response?.data?.message||"Save failed","error");}
    setSaving(false);
  };

  const resetP=()=>{setPf({name:"",description:"",price:"",originalPrice:"",category:Object.keys(liveCat)[0]||"Kurtas & Sets",fabric:"",occasion:"",care:"",stock:"",badge:"",featured:false,trending:false});setPSizes([]);setPColors([]);setPFiles([]);setEditId(null);setExImgs([]);};
  const editProd=p=>{setPf({name:p.name,description:p.description,price:p.price,originalPrice:p.originalPrice||"",category:p.category,fabric:p.fabric||"",occasion:p.occasion||"",care:p.care||"",stock:p.stock,badge:p.badge||"",featured:p.featured,trending:p.trending});setPSizes(p.sizes||[]);setPColors(p.colors||[]);setExImgs(p.images||[]);setEditId(p._id);setPFiles([]);setTab("add-product");window.scrollTo({top:0,behavior:"smooth"});};
  const delProd=async id=>{if(!window.confirm("Delete?"))return;await apiDeleteProduct(id);setProducts(ps=>ps.filter(p=>p._id!==id));toast("Deleted");};
  const updateSt=async(id,status)=>{await apiUpdateStatus(id,status);setOrders(os=>os.map(o=>o._id===id?{...o,status}:o));toast(`→ ${status}`);};
  const delImg=async pid=>{await apiDeleteProductImage(editId,pid);setExImgs(imgs=>imgs.filter(i=>i.public_id!==pid));toast("Image removed");};
  const createCoupon=async()=>{try{const r=await apiCreateCoupon({...cf,discount:Number(cf.discount),minOrder:Number(cf.minOrder)});setCoupons(c=>[r.data.coupon,...c]);setCf({code:"",type:"percent",discount:"",desc:"",minOrder:0});toast("Coupon created!");}catch(err){toast(err.response?.data?.message||"Error","error");}};
  const delCoupon=async id=>{await apiDeleteCoupon(id);setCoupons(cs=>cs.filter(c=>c._id!==id));toast("Deleted");};

  const goTab=k=>{setTab(k);if(isMobile)setDrawer(false);};
  const SIDE=[["overview",LayoutDashboard,"Overview"],["orders",ShoppingBag,"Orders"],["products",Package,"Products"],["add-product",PlusCircle,"Add Product"],["inventory",Warehouse,"Inventory"],["customers",Users,"Customers"],["analytics",BarChart2,"Analytics"],["coupons",Tag,"Coupons"],["categories",Layers,"Categories"],["promo",Gift,"Offer Banner"],["marquee",Zap,"Marquee Banner"],["about-editor",FileText,"About Page"],["settings",Settings,"Site Settings"],["logs",BarChart2,"Log Audit"]];
  const iStyle={background:"var(--ivory2)",border:"1.5px solid var(--border2)",color:"var(--text)",padding:"10px 12px",fontSize:13,borderRadius:12,outline:"none",width:"100%",boxSizing:"border-box",fontWeight:500};
  const lStyle={display:"block",fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:.5,textTransform:"uppercase",marginBottom:6};

  return(
    <div style={{display:"flex",minHeight:"calc(100vh - 80px)",background:"var(--ivory)"}}>
      {isMobile&&<button onClick={()=>setDrawer(!drawer)} style={{position:"fixed",bottom:20,right:20,zIndex:600,background:"linear-gradient(135deg,var(--rose),var(--saffron))",border:"none",width:50,height:50,borderRadius:"50%",fontSize:20,color:"#fff",boxShadow:"0 6px 24px rgba(194,24,91,.4)"}}><Ic icon={Settings} size={20}/></button>}

      {(!isMobile||drawer)&&(
        <div style={{width:isMobile?"100vw":220,background:"#fff",borderRight:"1.5px solid var(--border)",paddingTop:20,flexShrink:0,position:isMobile?"fixed":"sticky",inset:isMobile?0:undefined,top:isMobile?0:80,height:isMobile?"100vh":"calc(100vh - 80px)",zIndex:isMobile?999:1,overflowY:"auto"}}>
          {isMobile&&<button onClick={()=>setDrawer(false)} style={{position:"absolute",top:16,right:16,background:"none",border:"none",color:"var(--muted)",fontSize:24,cursor:"pointer"}}>×</button>}
          <div style={{padding:"0 20px 16px",fontSize:9,letterSpacing:3,color:"var(--rose)",textTransform:"uppercase",fontWeight:800}}>Admin Console</div>
          {SIDE.map(([key,icon,label])=>(
            <button key={key} onClick={()=>goTab(key)} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 20px",background:tab===key?"var(--roseL)":"transparent",borderLeft:`3px solid ${tab===key?"var(--rose)":"transparent"}`,border:"none",color:tab===key?"var(--rose)":"var(--muted)",cursor:"pointer",fontSize:13,fontWeight:tab===key?700:500,textAlign:"left",transition:"all .2s"}}>
              <Ic icon={icon} size={15}/>{label}
            </button>
          ))}
        </div>
      )}

      <div style={{flex:1,padding:isMobile?"16px 14px":28,overflowX:"hidden",background:"var(--ivory2)"}}>
        {loading&&<Spinner/>}

        {/* OVERVIEW */}
        {!loading&&tab==="overview"&&stats&&(
          <div>
            <h2 style={{fontFamily:"var(--font-d)",color:"var(--dark)",marginBottom:24,fontSize:30,fontWeight:700}}>Dashboard Overview</h2>
            <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:12,marginBottom:24}}>
              {[["Total Revenue",fmt(stats.totalRevenue),"linear-gradient(135deg,var(--teal),#26A69A)",TrendingUp],["Orders",stats.totalOrders,"linear-gradient(135deg,var(--rose),var(--saffron))",ShoppingBag],["Customers",stats.totalUsers,"linear-gradient(135deg,var(--purple),#AB47BC)",Users],["Products",stats.totalProducts,"linear-gradient(135deg,#1565C0,#1976D2)",Package]].map(([label,val,grad,SIcon])=>(
                <div key={label} style={{background:"#fff",borderRadius:"14px",padding:isMobile?"16px":"20px 22px",border:"1.5px solid var(--border)",boxShadow:"0 4px 24px rgba(194,24,91,0.08)"}}>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:"var(--muted)",textTransform:"uppercase",marginBottom:8}}>{label}</div>
                  <div style={{fontFamily:"var(--font-d)",fontSize:isMobile?20:26,fontWeight:700,background:grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{background:"#fff",borderRadius:"20px",border:"1.5px solid var(--border)",overflow:"hidden",boxShadow:"0 4px 24px rgba(194,24,91,0.08)"}}>
              <div style={{padding:"14px 18px",borderBottom:"1px solid var(--border)",background:"linear-gradient(135deg,var(--roseL),var(--saffronL))"}}>
                <h3 style={{fontFamily:"var(--font-d)",margin:0,color:"var(--dark)",fontSize:18,fontWeight:700}}>Recent Orders</h3>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:520}}>
                  <thead><tr style={{background:"var(--ivory2)"}}>
                    {["Order","Customer","Total","Status","Date"].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:9,fontWeight:800,color:"var(--rose)",textTransform:"uppercase",letterSpacing:1.5}}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {orders.slice(0,8).map(ord=>(
                      <tr key={ord._id} style={{borderBottom:"1px solid var(--border)"}}>
                        <td style={{padding:"10px 14px",fontWeight:700,color:"var(--text)",fontFamily:"monospace",fontSize:11}}>#{ord._id.slice(-6).toUpperCase()}</td>
                        <td style={{padding:"10px 14px",color:"var(--text2)",fontSize:12}}>{ord.user?.name||"—"}</td>
                        <td style={{padding:"10px 14px",fontFamily:"var(--font-d)",fontWeight:700,fontSize:14,background:"linear-gradient(135deg,var(--rose),var(--saffron))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{fmt(ord.total)}</td>
                        <td style={{padding:"10px 14px"}}>
                          <select value={ord.status} onChange={e=>updateSt(ord._id,e.target.value)} style={{...iStyle,width:"auto",padding:"4px 8px",fontSize:11}}>
                            {["pending","processing","shipped","delivered","cancelled"].map(s=><option key={s}>{s}</option>)}
                          </select>
                        </td>
                        <td style={{padding:"10px 14px",color:"var(--muted)",fontSize:11}}>{new Date(ord.createdAt).toLocaleDateString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ORDERS */}
        {!loading&&tab==="orders"&&(
          <AdminOrdersList orders={orders} setOrders={setOrders} isMobile={isMobile} iStyle={iStyle} updateSt={updateSt} toast={toast}/>
        )}

        {/* PRODUCTS */}
        {!loading&&tab==="products"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h2 style={{fontFamily:"var(--font-d)",color:"var(--dark)",margin:0,fontSize:30,fontWeight:700}}>Products ({products.length})</h2>
              <button className="btn btn-rose" onClick={()=>{resetP();setTab("add-product");}} style={{padding:"10px 20px",fontSize:12}}>+ Add Product</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
              {products.map(p=>(
                <div key={p._id} style={{background:"#fff",borderRadius:"14px",border:"1.5px solid var(--border)",display:"flex",gap:14,padding:16,boxShadow:"0 4px 24px rgba(194,24,91,0.08)"}}>
                  <div style={{position:"relative",flexShrink:0}}>
                    <img src={p.images?.[0]?.url||`https://placehold.co/72x88/FDF8F3/C2185B?text=P`} alt={p.name} loading="lazy" style={{width:72,height:88,objectFit:"contain",background:"var(--ivory2)",borderRadius:10}}/>
                    {p.images?.length>1&&<div style={{position:"absolute",bottom:3,right:3,background:"rgba(0,0,0,.7)",color:"#F9A825",fontSize:9,padding:"2px 5px",borderRadius:4,fontWeight:700}}>+{p.images.length-1}</div>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"var(--font-d)",fontWeight:700,color:"var(--text)",fontSize:15,marginBottom:2}}>{p.name}</div>
                    <div style={{fontSize:10,color:"var(--rose)",marginTop:2,fontWeight:700,letterSpacing:.5}}>{p.category}</div>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginTop:6,flexWrap:"wrap"}}>
                      <span style={{fontFamily:"var(--font-d)",fontWeight:700,fontSize:15,background:"linear-gradient(135deg,var(--rose),var(--saffron))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{fmt(p.price)}</span>
                      <span style={{fontSize:11,color:p.stock<=5?"#DC2626":"#16A34A",fontWeight:700}}>Stock: {p.stock}</span>
                    </div>
                    <div style={{display:"flex",gap:8,marginTop:10}}>
                      <button onClick={()=>editProd(p)} style={{background:"var(--ivory2)",border:"1.5px solid var(--border2)",padding:"5px 14px",borderRadius:8,fontSize:11,cursor:"pointer",color:"var(--text)",fontWeight:600}}>✏ Edit</button>
                      <button onClick={()=>delProd(p._id)} style={{background:"#FEF2F2",border:"1.5px solid #FECACA",padding:"5px 14px",borderRadius:8,fontSize:11,cursor:"pointer",color:"#DC2626",fontWeight:600}}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADD/EDIT PRODUCT */}
        {tab==="add-product"&&(
          <div>
            <h2 style={{fontFamily:"var(--font-d)",color:"var(--dark)",marginBottom:20,fontSize:30,fontWeight:700}}>{editId?"Edit":"Add"} Product</h2>
            <div style={{background:"#fff",borderRadius:"20px",border:"1.5px solid var(--border)",padding:isMobile?18:28,boxShadow:"0 4px 24px rgba(194,24,91,0.08)"}}>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16,marginBottom:16}}>
                {[["Product Name","name"],["Price (₹)","price"],["Original Price (₹)","originalPrice"],["Stock","stock"],["Fabric","fabric"],["Occasion","occasion"],["Care","care"],["Badge","badge"]].map(([label,key])=>(
                  <div key={key}>
                    <label style={lStyle}>{label}</label>
                    <input value={pf[key]} onChange={e=>setPf(f=>({...f,[key]:e.target.value}))} style={iStyle}/>
                  </div>
                ))}
              </div>
              <div style={{marginBottom:16}}>
                <label style={lStyle}>Category</label>
                <select value={pf.category} onChange={e=>setPf(f=>({...f,category:e.target.value}))} style={iStyle}>
                  {Object.keys(liveCat).map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{marginBottom:16}}>
                <label style={lStyle}>Description</label>
                <textarea value={pf.description} onChange={e=>setPf(f=>({...f,description:e.target.value}))} rows={3} style={{...iStyle,resize:"vertical",fontFamily:"var(--font-b)"}}/>
              </div>
              <div style={{display:"flex",gap:24,marginBottom:18}}>
                {[["featured","Featured"],["trending","Trending"]].map(([key,label])=>(
                  <label key={key} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:"var(--text2)",fontWeight:600}}>
                    <input type="checkbox" checked={pf[key]} onChange={e=>setPf(f=>({...f,[key]:e.target.checked}))} style={{accentColor:"var(--rose)",width:16,height:16}}/>{label}
                  </label>
                ))}
              </div>
              <div style={{marginBottom:18}}>
                <label style={lStyle}>Sizes</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {["XS","S","M","L","XL","XXL","Free Size","One Size"].map(s=>(
                    <button key={s} onClick={()=>setPSizes(ps=>ps.includes(s)?ps.filter(x=>x!==s):[...ps,s])} style={{padding:"7px 16px",border:`2px solid ${pSizes.includes(s)?"var(--rose)":"var(--border2)"}`,borderRadius:10,background:pSizes.includes(s)?"linear-gradient(135deg,var(--rose),var(--saffron))":"#fff",color:pSizes.includes(s)?"#fff":"var(--text2)",cursor:"pointer",fontSize:12,fontWeight:700}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:20}}>
                <label style={lStyle}>Colours</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {Object.keys(COLORS_MAP).map(c=>(
                    <button key={c} onClick={()=>setPColors(pc=>pc.includes(c)?pc.filter(x=>x!==c):[...pc,c])} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",border:`2px solid ${pColors.includes(c)?"var(--rose)":"var(--border2)"}`,borderRadius:10,background:pColors.includes(c)?"var(--roseL)":"#fff",cursor:"pointer",fontSize:12,fontWeight:600,color:pColors.includes(c)?"var(--rose)":"var(--text2)"}}>
                      <div style={{width:12,height:12,borderRadius:"50%",background:COLORS_MAP[c],border:"2px solid #fff",boxShadow:"0 1px 3px rgba(0,0,0,.15)"}}/>{c}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:24,padding:20,background:"var(--ivory2)",borderRadius:"14px",border:"1.5px solid var(--border)"}}>
                <ImageUploader existingImages={exImgs} onFilesChange={setPFiles} onDeleteExisting={delImg}/>
              </div>
              <div style={{display:"flex",gap:12}}>
                <button className="btn btn-rose" onClick={saveProd} disabled={saving} style={{flex:2,padding:"14px 0",fontSize:14,opacity:saving?.75:1}}>{saving?"Saving…":editId?"Update Product":"Create Product"}</button>
                <button className="btn btn-ghost" onClick={resetP} style={{flex:1,padding:"14px 0",fontSize:14}}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMERS */}
        {!loading&&tab==="customers"&&(
          <AdminCustomers users={users} setUsers={setUsers} toast={toast} isMobile={isMobile}/>
        )}

        {/* ANALYTICS */}
        {!loading&&tab==="analytics"&&stats&&(
          <div>
            <h2 style={{fontFamily:"var(--font-d)",color:"var(--dark)",marginBottom:20,fontSize:30,fontWeight:700}}>Analytics</h2>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
              <div style={{background:"#fff",borderRadius:"20px",border:"1.5px solid var(--border)",padding:22,boxShadow:"0 4px 24px rgba(194,24,91,0.08)"}}>
                <h3 style={{fontFamily:"var(--font-d)",color:"var(--dark)",margin:"0 0 18px",fontSize:18,fontWeight:700}}>Revenue by Category</h3>
                {stats.categoryRevenue.map(c=>{
                  const max=stats.categoryRevenue[0]?.revenue||1;
                  return(
                    <div key={c._id} style={{marginBottom:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4,fontWeight:600}}>
                        <span style={{color:"var(--text2)"}}>{c._id}</span>
                        <span style={{color:"var(--rose)"}}>{fmt(c.revenue)}</span>
                      </div>
                      <div style={{height:6,background:"var(--ivory3)",borderRadius:3}}>
                        <div style={{height:"100%",width:`${(c.revenue/max)*100}%`,background:"linear-gradient(90deg,var(--rose),var(--saffron))",borderRadius:3}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{background:"#fff",borderRadius:"20px",border:"1.5px solid var(--border)",padding:22,boxShadow:"0 4px 24px rgba(194,24,91,0.08)"}}>
                <h3 style={{fontFamily:"var(--font-d)",color:"var(--dark)",margin:"0 0 18px",fontSize:18,fontWeight:700}}>Order Status</h3>
                {stats.statusBreakdown.map(s=>{
                  const col={delivered:"#16A34A",shipped:"#6D28D9",processing:"#2563EB",pending:"#D97706",cancelled:"#DC2626"};
                  const tot=stats.totalOrders||1;
                  return(
                    <div key={s._id} style={{marginBottom:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4,fontWeight:600}}>
                        <span style={{color:"var(--text2)",textTransform:"capitalize"}}>{s._id}</span>
                        <span style={{color:col[s._id]||"var(--muted)"}}>{s.count} ({Math.round((s.count/tot)*100)}%)</span>
                      </div>
                      <div style={{height:6,background:"var(--ivory3)",borderRadius:3}}>
                        <div style={{height:"100%",width:`${(s.count/tot)*100}%`,background:col[s._id]||"var(--muted)",borderRadius:3}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{background:"#fff",borderRadius:"20px",border:"1.5px solid var(--border)",padding:22,boxShadow:"0 4px 24px rgba(194,24,91,0.08)"}}>
                <h3 style={{fontFamily:"var(--font-d)",color:"var(--dark)",margin:"0 0 18px",fontSize:18,fontWeight:700}}>Top Products</h3>
                {stats.topProducts.map((p,i)=>(
                  <div key={p._id} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:"1px solid var(--border)"}}>
                    <span style={{fontFamily:"var(--font-d)",fontWeight:900,width:24,fontSize:18,background:"linear-gradient(135deg,var(--rose),var(--saffron))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>#{i+1}</span>
                    <img src={p.images?.[0]?.url||`https://placehold.co/36x44/FDF8F3/C2185B?text=P`} alt={p.name} loading="lazy" style={{width:36,height:44,objectFit:"contain",background:"var(--ivory2)",borderRadius:8}}/>
                    <div style={{flex:1,overflow:"hidden"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                      <div style={{fontSize:11,color:"var(--muted)",fontWeight:500}}>{p.numReviews} reviews · ★{(p.rating||0).toFixed(1)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* COUPONS */}
        {!loading&&tab==="coupons"&&(
          <div>
            <h2 style={{fontFamily:"var(--font-d)",color:"var(--dark)",marginBottom:20,fontSize:30,fontWeight:700}}>Coupon Manager</h2>
            <div style={{background:"#fff",borderRadius:"20px",border:"1.5px solid var(--border)",padding:isMobile?16:24,marginBottom:24,boxShadow:"0 4px 24px rgba(194,24,91,0.08)"}}>
              <h3 style={{fontFamily:"var(--font-d)",color:"var(--dark)",margin:"0 0 18px",fontSize:18,fontWeight:700}}>Create Coupon</h3>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:12}}>
                {[["Code","code"],["Discount","discount"],["Description","desc"],["Min Order","minOrder"]].map(([label,key])=>(
                  <div key={key}>
                    <label style={lStyle}>{label}</label>
                    <input value={cf[key]} onChange={e=>setCf(f=>({...f,[key]:key==="code"?e.target.value.toUpperCase():e.target.value}))} style={iStyle}/>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:12,alignItems:"flex-end"}}>
                <div>
                  <label style={lStyle}>Type</label>
                  <select value={cf.type} onChange={e=>setCf(f=>({...f,type:e.target.value}))} style={{...iStyle,width:"auto"}}>
                    <option value="percent">Percent %</option>
                    <option value="flat">Flat ₹</option>
                  </select>
                </div>
                <button className="btn btn-rose" onClick={createCoupon} style={{padding:"10px 24px",fontSize:12}}>Create</button>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(3,1fr)",gap:12}}>
              {coupons.map(c=>(
                <div key={c._id} style={{background:"linear-gradient(135deg,var(--roseL),var(--saffronL))",borderRadius:"14px",border:"1.5px solid var(--border)",padding:isMobile?16:22,position:"relative"}}>
                  <div style={{fontFamily:"monospace",fontSize:isMobile?14:17,fontWeight:900,color:"var(--dark)",marginBottom:6,letterSpacing:1.5}}>{c.code}</div>
                  <div style={{fontFamily:"var(--font-d)",fontSize:isMobile?22:30,fontWeight:700,background:"linear-gradient(135deg,var(--rose),var(--saffron))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:6}}>
                    {c.type==="flat"?`₹${c.discount} OFF`:`${c.discount*100}% OFF`}
                  </div>
                  <div style={{fontSize:11,color:"var(--muted)",marginBottom:4,fontWeight:500}}>{c.desc}</div>
                  <div style={{fontSize:10,color:"var(--muted)"}}>Used: {c.usedCount||0}×</div>
                  <button onClick={()=>delCoupon(c._id)} style={{position:"absolute",top:10,right:10,background:"none",border:"none",cursor:"pointer",color:"#DC2626",fontSize:20,fontWeight:700}}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INVENTORY */}
        {tab==="inventory"&&(
          <AdminInventory toast={toast}/>
        )}

        {/* CATEGORIES */}
        {tab==="categories"&&(
          <CategoryManager toast={toast} liveCat={liveCat}/>
        )}

        {/* OFFER BANNER */}
        {tab==="promo"&&(
          <PromoBannerEditor toast={toast}/>
        )}

        {/* MARQUEE BANNER */}
        {tab==="marquee"&&(
          <MarqueeBannerEditor toast={toast}/>
        )}

        {/* ABOUT PAGE */}
        {tab==="about-editor"&&(
          <AboutPageEditor toast={toast}/>
        )}

        {/* SITE SETTINGS */}
        {tab==="settings"&&(
          <SiteSettings toast={toast}/>
        )}

        {/* LOG AUDIT */}
        {tab==="logs"&&(
          <LogViewer toast={toast}/>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
