import React, { useState, useEffect, useCallback, useRef } from "react";
import { useBreakpoint } from "../hooks";
import { useAuth } from "../context/AuthContext";
import { useCatConfig } from "../store/catStore";
import { Ic, fmt, printShippingLabel, COLORS_MAP } from "../utils/helpers";
import {
  apiAdminStats, apiGetAllOrders, apiGetProducts, apiAdminUsers, apiGetCoupons,
  apiCreateProduct, apiUpdateProduct, apiDeleteProduct, apiDeleteProductImage,
  apiUpdateStatus, apiCreateCoupon, apiDeleteCoupon, apiAdminStockUpdate,
  apiSendProductPromo,
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
import { BarChart2, Edit, FileText, Gift, Layers, LayoutDashboard, Mail, Package, Percent, PlusCircle, Save, Settings, ShoppingBag, Tag, TrendingUp, Users, Warehouse, Zap } from "lucide-react";

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
  const [pf,setPf]=useState({name:"",description:"",price:"",originalPrice:"",category:"Kurtas & Sets",subCategory:"",fabric:"",occasion:"",care:"",stock:"",badge:"",featured:false,trending:false});
  const [pSizes,setPSizes]=useState([]);
  const [pColors,setPColors]=useState([]);
  const [pFiles,setPFiles]=useState([]);
  const pFilesRef=useRef([]); // always current — avoids stale closure on save
  const [editId,setEditId]=useState(null);
  const [exImgs,setExImgs]=useState([]);
  const [saving,setSaving]=useState(false);
  const setFilesSync = (files) => { pFilesRef.current = files; setPFiles(files); };
  const [cf,setCf]=useState({code:"",type:"percent",discount:"",desc:"",minOrder:0});
  const [promoMail,setPromoMail]=useState(null);       // product object | null
  const [promoUsers,setPromoUsers]=useState([]);        // all eligible users
  const [promoChecked,setPromoChecked]=useState({});    // { userId: true/false }
  const [promoSearch,setPromoSearch]=useState("");      // filter by name/email
  const [promoLoading,setPromoLoading]=useState(false); // fetching users
  const [promoSending,setPromoSending]=useState(false);
  const [promoResult,setPromoResult]=useState(null);    // { sent, failed, message }

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
      const filesToUpload = pFilesRef.current;
      filesToUpload.forEach(f=>fd.append("images",f));
      // Tell backend which existing images to keep (those not deleted via × button)
      if(editId) fd.append("keptImages", JSON.stringify(exImgs));
      if(editId){
        await apiUpdateProduct(editId,fd);
        toast("Product updated! ✓");
        const r=await apiGetProducts({limit:50});
        setProducts(Array.isArray(r?.data?.products)?r.data.products:[]);
        resetP();
        setTab("products"); // ← go back to products list after update
      } else {
        await apiCreateProduct(fd);
        toast("Product created! ✓");
        const r=await apiGetProducts({limit:50});
        setProducts(Array.isArray(r?.data?.products)?r.data.products:[]);
        resetP(); // ← clear all fields and images for next creation
        // stay on add-product tab ready for next product
      }
    }catch(err){toast(err.response?.data?.message||"Save failed","error");}
    setSaving(false);
  };

  const resetP=()=>{setPf({name:"",description:"",price:"",originalPrice:"",category:Object.keys(liveCat)[0]||"Kurtas & Sets",subCategory:"",fabric:"",occasion:"",care:"",stock:"",badge:"",featured:false,trending:false});setPSizes([]);setPColors([]);setFilesSync([]);setEditId(null);setExImgs([]);};
  const editProd=p=>{setPf({name:p.name,description:p.description,price:p.price,originalPrice:p.originalPrice||"",category:p.category,subCategory:p.subCategory||"",fabric:p.fabric||"",occasion:p.occasion||"",care:p.care||"",stock:p.stock,badge:p.badge||"",featured:p.featured,trending:p.trending});setPSizes(p.sizes||[]);setPColors(p.colors||[]);setExImgs(p.images||[]);setEditId(p._id);setFilesSync([]);setTab("add-product");window.scrollTo({top:0,behavior:"smooth"});};
  const delProd=async id=>{if(!window.confirm("Delete?"))return;await apiDeleteProduct(id);setProducts(ps=>ps.filter(p=>p._id!==id));toast("Deleted");};
  const updateSt=async(id,status)=>{await apiUpdateStatus(id,status);setOrders(os=>os.map(o=>o._id===id?{...o,status}:o));toast(`→ ${status}`);};
  const delImg=async pid=>{await apiDeleteProductImage(editId,pid);setExImgs(imgs=>imgs.filter(i=>i.public_id!==pid));toast("Image removed");};
  const createCoupon=async()=>{try{const r=await apiCreateCoupon({...cf,discount:Number(cf.discount),minOrder:Number(cf.minOrder)});setCoupons(c=>[r.data.coupon,...c]);setCf({code:"",type:"percent",discount:"",desc:"",minOrder:0});toast("Coupon created!");}catch(err){toast(err.response?.data?.message||"Error","error");}};
  const delCoupon=async id=>{await apiDeleteCoupon(id);setCoupons(cs=>cs.filter(c=>c._id!==id));toast("Deleted");};

  const openPromoModal=async(p)=>{
    setPromoMail(p);
    setPromoResult(null);
    setPromoSearch("");
    setPromoLoading(true);
    try{
      const r=await apiAdminUsers();
      const all=(r?.data?.users||[]).filter(u=>u.role!=="admin"&&u.email);
      setPromoUsers(all);
      // default: all checked
      const checked={};
      all.forEach(u=>{checked[u._id]=true;});
      setPromoChecked(checked);
    }catch{
      toast("Could not load users","error");
    }
    setPromoLoading(false);
  };

  const sendPromoMail=async()=>{
    if(!promoMail)return;
    const userIds=Object.entries(promoChecked).filter(([,v])=>v).map(([id])=>id);
    if(!userIds.length){toast("Select at least one user","error");return;}
    setPromoSending(true);
    setPromoResult(null);
    try{
      const r=await apiSendProductPromo(promoMail._id,userIds);
      setPromoResult(r.data);
      toast(`✉ ${r.data.message}`);
    }catch(err){
      toast(err.response?.data?.message||"Failed to send","error");
    }
    setPromoSending(false);
  };

  const closePromoModal=()=>{setPromoMail(null);setPromoUsers([]);setPromoChecked({});setPromoResult(null);setPromoSearch("");};

  const goTab=k=>{setTab(k);if(isMobile)setDrawer(false);};
  const SIDE=[["overview",LayoutDashboard,"Overview"],["orders",ShoppingBag,"Orders"],["products",Package,"Products"],["add-product",PlusCircle,"Add Product"],["inventory",Warehouse,"Inventory"],["customers",Users,"Customers"],["analytics",BarChart2,"Analytics"],["coupons",Tag,"Coupons"],["categories",Layers,"Categories"],["promo",Gift,"Offer Banner"],["marquee",Zap,"Marquee Banner"],["about-editor",FileText,"About Page"],["settings",Settings,"Site Settings"],["plaza",Store,"BV Plaza"],["logs",BarChart2,"Log Audit"]];
  const iStyle={background:"var(--ivory2)",border:"1.5px solid var(--border2)",color:"var(--text)",padding:"10px 12px",fontSize:13,borderRadius:12,outline:"none",width:"100%",boxSizing:"border-box",fontWeight:500};
  const lStyle={display:"block",fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:.5,textTransform:"uppercase",marginBottom:6};

  return(
    <><div style={{display:"flex",minHeight:"calc(100vh - 80px)",background:"var(--ivory)"}}>
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
                    <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
                      <button onClick={()=>editProd(p)} style={{background:"var(--ivory2)",border:"1.5px solid var(--border2)",padding:"5px 14px",borderRadius:8,fontSize:11,cursor:"pointer",color:"var(--text)",fontWeight:600}}>✏ Edit</button>
                      <button onClick={()=>delProd(p._id)} style={{background:"#FEF2F2",border:"1.5px solid #FECACA",padding:"5px 14px",borderRadius:8,fontSize:11,cursor:"pointer",color:"#DC2626",fontWeight:600}}>Delete</button>
                      <button onClick={()=>openPromoModal(p)}
                        style={{display:"flex",alignItems:"center",gap:5,background:"linear-gradient(135deg,#EFF6FF,#DBEAFE)",border:"1.5px solid #93C5FD",padding:"5px 14px",borderRadius:8,fontSize:11,cursor:"pointer",color:"#1D4ED8",fontWeight:700,transition:"all .2s"}}
                        onMouseEnter={e=>e.currentTarget.style.background="linear-gradient(135deg,#2563EB,#1D4ED8)"}
                        onMouseLeave={e=>e.currentTarget.style.background="linear-gradient(135deg,#EFF6FF,#DBEAFE)"}>
                        <Ic icon={Mail} size={12}/>Send Mail
                      </button>
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
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16,marginBottom:16}}>
                <div>
                  <label style={lStyle}>Category</label>
                  <select value={pf.category} onChange={e=>setPf(f=>({...f,category:e.target.value,subCategory:""}))} style={iStyle}>
                    {Object.keys(liveCat).map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lStyle}>Sub-Category</label>
                  <select value={pf.subCategory} onChange={e=>setPf(f=>({...f,subCategory:e.target.value}))} style={{...iStyle,color:pf.subCategory?"var(--text)":"var(--muted)"}}>
                    <option value="">— None —</option>
                    {(liveCat[pf.category]?.subs||[]).map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                  {(liveCat[pf.category]?.subs||[]).length===0&&(
                    <div style={{fontSize:10,color:"var(--muted)",marginTop:4,fontWeight:500}}>No sub-categories for this category yet</div>
                  )}
                </div>
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
                <ImageUploader existingImages={exImgs} onFilesChange={setFilesSync} onDeleteExisting={delImg}/>
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

        {/* BV PLAZA */}
        {tab==="plaza"&&(
          <div style={{padding:"28px 0"}}>
            <div style={{marginBottom:24}}>
              <h2 style={{fontSize:20,fontWeight:800,margin:"0 0 4px",color:"#1e293b"}}>BV Plaza Settings</h2>
              <p style={{fontSize:13,color:"#64748b",margin:0}}>Control BV Plaza visibility on the home page, manage stalls and withdrawals.</p>
            </div>
            <PlazaAdminSettings toast={toast}/>
          </div>
        )}

        {/* LOG AUDIT */}
        {tab==="logs"&&(
          <LogViewer toast={toast}/>
        )}

      </div>
    </div>

    {/* ── Promo Mail Modal ── */}
    {promoMail&&(()=>{
      const checkedIds=Object.entries(promoChecked).filter(([,v])=>v).map(([id])=>id);
      const filteredUsers=promoUsers.filter(u=>{
        const q=promoSearch.toLowerCase();
        return !q||u.name.toLowerCase().includes(q)||u.email.toLowerCase().includes(q);
      });
      const allFilteredChecked=filteredUsers.length>0&&filteredUsers.every(u=>promoChecked[u._id]);
      const toggleAll=()=>{
        const next={...promoChecked};
        filteredUsers.forEach(u=>{next[u._id]=!allFilteredChecked;});
        setPromoChecked(next);
      };
      return(
        <div style={{position:"fixed",inset:0,background:"rgba(26,10,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,backdropFilter:"blur(6px)",padding:16}}>
          <div style={{background:"#fff",borderRadius:24,width:"100%",maxWidth:520,boxShadow:"0 32px 80px rgba(0,0,0,.25)",display:"flex",flexDirection:"column",maxHeight:"90vh"}}>

            {/* ── Header ── */}
            <div style={{padding:"22px 24px 16px",borderBottom:"1.5px solid var(--border)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:1.2,textTransform:"uppercase",color:"#2563EB",marginBottom:5,display:"flex",alignItems:"center",gap:6}}>
                    <Ic icon={Mail} size={12}/>Promotional Email Blast
                  </div>
                  <h3 style={{fontFamily:"var(--font-d)",fontSize:19,color:"var(--dark)",fontWeight:700,margin:0,lineHeight:1.3}}>{promoMail.name}</h3>
                </div>
                <button onClick={closePromoModal} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"var(--muted)",lineHeight:1,flexShrink:0}}>×</button>
              </div>

              {/* Product strip */}
              <div style={{display:"flex",gap:12,padding:"10px 12px",background:"var(--ivory2)",borderRadius:12,border:"1.5px solid var(--border)"}}>
                <img src={promoMail.images?.[0]?.url||"https://placehold.co/48x58/FDF8F3/C2185B?text=P"} alt=""
                  style={{width:48,height:58,objectFit:"contain",borderRadius:8,border:"1px solid var(--border)",flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:9,color:"var(--rose)",fontWeight:700,letterSpacing:.5,textTransform:"uppercase",marginBottom:2}}>{promoMail.category}</div>
                  <div style={{fontSize:13,fontWeight:700,color:"var(--dark)",marginBottom:4,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{promoMail.name}</div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontFamily:"var(--font-d)",fontSize:15,fontWeight:800,color:"var(--rose)"}}>₹{promoMail.price?.toLocaleString("en-IN")}</span>
                    {promoMail.originalPrice&&<span style={{fontSize:11,color:"var(--muted)",textDecoration:"line-through"}}>₹{promoMail.originalPrice?.toLocaleString("en-IN")}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* ── User list section ── */}
            {!promoResult&&!promoSending&&(
              <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",padding:"16px 24px 0"}}>

                {/* Search + Select All row */}
                <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center"}}>
                  <input
                    value={promoSearch}
                    onChange={e=>setPromoSearch(e.target.value)}
                    placeholder="Search by name or email…"
                    style={{flex:1,padding:"8px 12px",border:"1.5px solid var(--border2)",borderRadius:9,fontSize:12,outline:"none",color:"var(--text)",background:"var(--ivory2)"}}/>
                  {!promoLoading&&filteredUsers.length>0&&(
                    <button onClick={toggleAll}
                      style={{padding:"8px 14px",borderRadius:9,border:"1.5px solid var(--border2)",background:allFilteredChecked?"var(--roseL)":"var(--ivory2)",color:allFilteredChecked?"var(--rose)":"var(--text2)",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",transition:"all .2s"}}>
                      {allFilteredChecked?"Deselect All":"Select All"}
                    </button>
                  )}
                </div>

                {/* Stats bar */}
                {!promoLoading&&(
                  <div style={{display:"flex",gap:12,marginBottom:10,fontSize:11,fontWeight:600}}>
                    <span style={{color:"var(--muted)"}}>{promoUsers.length} total users</span>
                    <span style={{color:"#2563EB"}}>{checkedIds.length} selected</span>
                    {filteredUsers.length!==promoUsers.length&&<span style={{color:"var(--rose)"}}>{filteredUsers.length} shown</span>}
                  </div>
                )}

                {/* Scrollable user checklist */}
                <div style={{flex:1,overflowY:"auto",border:"1.5px solid var(--border)",borderRadius:12,marginBottom:14}}>
                  {promoLoading?(
                    <div style={{textAlign:"center",padding:"28px 0",color:"var(--muted)",fontSize:13}}>
                      <div style={{width:28,height:28,border:"3px solid var(--border2)",borderTop:"3px solid #2563EB",borderRadius:"50%",animation:"spin .7s linear infinite",margin:"0 auto 10px"}}/>
                      Loading users…
                    </div>
                  ):filteredUsers.length===0?(
                    <div style={{textAlign:"center",padding:"28px 0",color:"var(--muted)",fontSize:13}}>No users found</div>
                  ):filteredUsers.map((u,idx)=>(
                    <label key={u._id}
                      style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",cursor:"pointer",borderBottom:idx<filteredUsers.length-1?"1px solid var(--border)":"none",
                        background:promoChecked[u._id]?"#EFF6FF":"#fff",transition:"background .15s"}}
                      onMouseEnter={e=>{if(!promoChecked[u._id])e.currentTarget.style.background="var(--ivory2)";}}
                      onMouseLeave={e=>{e.currentTarget.style.background=promoChecked[u._id]?"#EFF6FF":"#fff";}}>
                      <input type="checkbox" checked={!!promoChecked[u._id]}
                        onChange={e=>setPromoChecked(c=>({...c,[u._id]:e.target.checked}))}
                        style={{width:16,height:16,accentColor:"#2563EB",flexShrink:0,cursor:"pointer"}}/>
                      <div style={{width:30,height:30,background:"linear-gradient(135deg,var(--rose),var(--saffron))",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff",flexShrink:0}}>
                        {u.name?.[0]?.toUpperCase()||"?"}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,color:"var(--dark)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name}</div>
                        <div style={{fontSize:11,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</div>
                      </div>
                      {promoChecked[u._id]&&<span style={{fontSize:10,fontWeight:700,color:"#2563EB",background:"#DBEAFE",padding:"2px 8px",borderRadius:99,flexShrink:0}}>✓</span>}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ── Sending state ── */}
            {promoSending&&(
              <div style={{textAlign:"center",padding:"32px 24px"}}>
                <div style={{width:40,height:40,border:"3px solid var(--border2)",borderTop:"3px solid #2563EB",borderRadius:"50%",animation:"spin .7s linear infinite",margin:"0 auto 14px"}}/>
                <div style={{fontSize:14,fontWeight:600,color:"#2563EB"}}>Sending to {checkedIds?.length||0} users…</div>
                <div style={{fontSize:12,color:"var(--muted)",marginTop:4}}>This may take a moment</div>
              </div>
            )}

            {/* ── Result ── */}
            {promoResult&&(
              <div style={{padding:"24px"}}>
                <div style={{padding:"20px",borderRadius:14,background:promoResult.failed?"#FFFBF0":"#F0FDF4",border:`1.5px solid ${promoResult.failed?"#FED7AA":"#BBF7D0"}`,marginBottom:16,textAlign:"center"}}>
                  <div style={{fontSize:28,marginBottom:8}}>{promoResult.failed?"⚠️":"✅"}</div>
                  <div style={{fontWeight:700,fontSize:15,color:promoResult.failed?"#D97706":"#16A34A",marginBottom:12}}>
                    {promoResult.failed?"Sent with some failures":"All emails sent successfully!"}
                  </div>
                  <div style={{display:"flex",justifyContent:"center",gap:32}}>
                    <div>
                      <div style={{fontFamily:"var(--font-d)",fontSize:32,fontWeight:800,color:"#16A34A"}}>{promoResult.sent}</div>
                      <div style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.5}}>Delivered</div>
                    </div>
                    {promoResult.failed>0&&(
                      <div>
                        <div style={{fontFamily:"var(--font-d)",fontSize:32,fontWeight:800,color:"#DC2626"}}>{promoResult.failed}</div>
                        <div style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.5}}>Failed</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Footer buttons ── */}
            <div style={{padding:"0 24px 22px",display:"flex",gap:10}}>
              <button onClick={closePromoModal}
                style={{flex:1,padding:"12px 0",borderRadius:11,background:"var(--ivory2)",border:"1.5px solid var(--border2)",fontWeight:600,fontSize:13,cursor:"pointer",color:"var(--muted)"}}>
                {promoResult?"Close":"Cancel"}
              </button>
              {!promoResult&&(
                <button onClick={sendPromoMail} disabled={promoSending||promoLoading||checkedIds.length===0}
                  style={{flex:2,padding:"12px 0",borderRadius:11,fontWeight:700,fontSize:13,border:"none",color:"#fff",
                    background:"linear-gradient(135deg,#2563EB,#1D4ED8)",
                    opacity:(promoSending||promoLoading||checkedIds.length===0)?.55:1,
                    cursor:(promoSending||promoLoading||checkedIds.length===0)?"not-allowed":"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                    boxShadow:"0 4px 16px rgba(37,99,235,.35)"}}>
                  <Ic icon={Mail} size={14}/>
                  {promoSending?"Sending…":`Send to ${checkedIds.length} User${checkedIds.length!==1?"s":""}`}
                </button>
              )}
            </div>

          </div>
        </div>
      );
    })()}
    </>
  );
};

export default AdminDashboard;
