import React, { useState, useEffect, useRef } from "react";
import { useBreakpoint } from "../hooks";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useCatConfig } from "../store/catStore";
import { Ic, fmt, disc, thumb, COLORS_MAP, printShippingLabel } from "../utils/helpers";
import { apiGetProduct, apiCreateReview, apiMarkHelpful, apiToggleWishlist, apiGetWishlist } from "../api";
import Gallery from "../components/ui/Gallery";
import { Check, Heart, Home, Lock, Package, RefreshCw, Save, ShoppingCart, Star, TrendingUp, Truck, Zap } from "lucide-react";
import { Stars, Spinner } from "../components/ui/Common";

/* ── PRODUCT DETAIL ──────────────────────────────────────────────────────────── */
const ProductDetailPage = ({ productId, setPage, toast }) => {
  const {isMobile}=useBreakpoint();
  const {user}=useAuth();
  const {addToCart}=useCart();
  const [data,setData]=useState(null);
  const [revs,setRevs]=useState([]);
  const [loading,setLoading]=useState(true);
  const [selSize,setSelSize]=useState("");
  const [selColor,setSelColor]=useState("");
  const [qty,setQty]=useState(1);
  const [tab,setTab]=useState("description");
  const [newRev,setNewRev]=useState({rating:5,comment:""});
  const [revMsg,setRevMsg]=useState("");
  const [wished,setWished]=useState(false);

  useEffect(()=>{
    setLoading(true);
    apiGetProduct(productId).then(r=>{setData(r.data.product);setRevs(r.data.reviews);setSelColor(r.data.product.colors?.[0]||"");setSelSize(r.data.product.sizes?.[0]||"");}).catch(console.error).finally(()=>setLoading(false));
    if(user)apiGetWishlist().then(r=>setWished(r.data.wishlist.some(w=>(w._id||w)===productId))).catch(()=>{});
  },[productId,user]);

  const toggleWish=async()=>{
    if(!user){setPage("login");return;}
    const r=await apiToggleWishlist(productId);
    setWished(r.data.wishlist.includes(productId));
    toast(r.data.wishlist.includes(productId)?"Added to wishlist ♡":"Removed from wishlist");
  };

  const submitRev=async()=>{
    if(!user){setPage("login");return;}
    if(!newRev.comment.trim()){setRevMsg("Please write a comment.");return;}
    try{
      const r=await apiCreateReview({productId,...newRev});
      setRevs(p=>[r.data.review,...p]);
      setNewRev({rating:5,comment:""});
      setRevMsg("Review submitted! ★");
      setTimeout(()=>setRevMsg(""),3000);
    }catch(err){setRevMsg(err.response?.data?.message||"Error");}
  };

  const catCfg=useCatConfig();

  if(loading)return <div style={{background:"var(--ivory)",minHeight:"60vh"}}><Spinner/></div>;
  if(!data)return <div style={{textAlign:"center",padding:80,color:"var(--muted)"}}>Product not found</div>;
  const d=disc(data.originalPrice,data.price);
  const cfg=catCfg[data.category]||{grad:"linear-gradient(135deg,var(--rose),var(--saffron))",light:"var(--roseL)",icon:"👗"};
  const iStyle={background:"var(--ivory2)",border:"1.5px solid var(--border2)",color:"var(--text)",padding:"12px 14px",fontSize:13,borderRadius:12,outline:"none",width:"100%",fontWeight:500};

  return (
    <div style={{background:"var(--ivory)",minHeight:"100vh"}}>
      <div style={{maxWidth:1300,margin:"0 auto",padding:isMobile?"16px":"40px 80px"}}>
        <nav style={{display:"flex",gap:6,alignItems:"center",marginBottom:24,fontSize:12,color:"var(--muted)",fontWeight:600}}>
          <span onClick={()=>setPage("home")} style={{cursor:"pointer",color:"var(--rose)"}}>Home</span>
          <span>›</span>
          <span onClick={()=>setPage("shop")} style={{cursor:"pointer",color:"var(--rose)"}}>Shop</span>
          <span>›</span>
          <span style={{color:"var(--text)"}}>{data.name}</span>
        </nav>

        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?24:64,marginBottom:52}}>
          <Gallery images={data.images} name={data.name}/>

          <div>
            <div className="tag" style={{background:cfg.light,marginBottom:14,fontSize:11}}><span>{cfg.icon}</span><span style={{background:cfg.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:800}}>{data.category}</span></div>
            <h1 style={{fontFamily:"var(--font-d)",fontSize:isMobile?24:36,fontWeight:700,color:"var(--dark)",marginBottom:12,lineHeight:1.2}}>{data.name}</h1>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
              <Stars rating={data.rating||0} size={15}/>
              <span style={{fontWeight:700,fontSize:14,color:"var(--text)"}}>{(data.rating||0).toFixed(1)}</span>
              <span style={{color:"var(--muted)",fontSize:13}}>({data.numReviews||0} reviews)</span>
              {data.trending&&<span className="tag" style={{background:"var(--saffronL)",color:"var(--saffron)"}}><span style={{display:"flex",alignItems:"center",gap:4}}><Ic icon={TrendingUp} size={11}/>Trending</span></span>}
            </div>

            <div style={{display:"flex",alignItems:"baseline",gap:14,marginBottom:20,paddingBottom:20,borderBottom:"1.5px solid var(--border)"}}>
              <span style={{fontFamily:"var(--font-d)",fontSize:isMobile?30:40,fontWeight:700,background:"linear-gradient(135deg,var(--rose),var(--saffron))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{fmt(data.price)}</span>
              {data.originalPrice&&<span style={{fontSize:18,color:"var(--muted)",textDecoration:"line-through"}}>{fmt(data.originalPrice)}</span>}
              {d>0&&<span className="tag" style={{background:"#F0FDF4",color:"#16A34A",fontWeight:800}}>Save {fmt(data.originalPrice-data.price)}</span>}
            </div>

            {/* Colours */}
            {data.colors?.length>0&&(
              <div style={{marginBottom:18}}>
                <div style={{fontSize:12,fontWeight:700,color:"var(--text2)",marginBottom:10}}>Colour: <span style={{color:"var(--rose)"}}>{selColor}</span></div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {data.colors.map(c=>(
                    <button key={c} onClick={()=>setSelColor(c)} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 14px",borderRadius:10,border:`2px solid ${selColor===c?"var(--rose)":"var(--border2)"}`,background:selColor===c?"var(--roseL)":"#fff",cursor:"pointer",fontSize:12,fontWeight:600,color:selColor===c?"var(--rose)":"var(--text2)",transition:"all .2s"}}>
                      <div style={{width:13,height:13,borderRadius:"50%",background:COLORS_MAP[c]||"#999",border:"2px solid #fff",boxShadow:"0 1px 4px rgba(0,0,0,.15)"}}/>{c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {data.sizes?.length>0&&!["Free Size","One Size"].includes(data.sizes[0])&&(
              <div style={{marginBottom:20}}>
                <div style={{fontSize:12,fontWeight:700,color:"var(--text2)",marginBottom:10}}>Size: <span style={{color:"var(--rose)"}}>{selSize}</span></div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {data.sizes.map(s=>(
                    <button key={s} onClick={()=>setSelSize(s)} style={{width:46,height:44,borderRadius:10,border:`2px solid ${selSize===s?"var(--rose)":"var(--border2)"}`,background:selSize===s?"linear-gradient(135deg,var(--rose),var(--saffron))":"#fff",color:selSize===s?"#fff":"var(--text2)",cursor:"pointer",fontSize:13,fontWeight:700,transition:"all .2s"}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{display:"flex",gap:12,marginBottom:20,alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",border:"1.5px solid var(--border2)",borderRadius:12,overflow:"hidden"}}>
                <button onClick={()=>setQty(Math.max(1,qty-1))} style={{width:42,height:44,background:"var(--ivory2)",border:"none",fontSize:20,fontWeight:700,color:"var(--rose)",cursor:"pointer"}}>−</button>
                <span style={{padding:"0 18px",fontWeight:800,fontSize:16,color:"var(--text)"}}>{qty}</span>
                <button onClick={()=>setQty(Math.min(data.stock,qty+1))} style={{width:42,height:44,background:"var(--ivory2)",border:"none",fontSize:20,fontWeight:700,color:"var(--rose)",cursor:"pointer"}}>+</button>
              </div>
              <span className="tag" style={{background:data.stock>0?(data.stock<=7?"#FEF3C7":"#F0FDF4"):"#FEF2F2",color:data.stock>0?(data.stock<=7?"#D97706":"#16A34A"):"#DC2626",fontWeight:800}}>
                {data.stock>0?(data.stock<=7?`Only ${data.stock} left!`:"In Stock"):"Out of Stock"}
              </span>
            </div>

            <div style={{display:"flex",gap:10,marginBottom:22}}>
              <button className="btn btn-rose" onClick={()=>{addToCart(data,qty,selSize,selColor);toast(`${data.name} added!`);}} style={{flex:1,padding:"15px 0",fontSize:14}}>
                Add to Bag
              </button>
              <button onClick={toggleWish} style={{width:52,background:wished?"var(--roseL)":"var(--ivory2)",border:`2px solid ${wished?"var(--rose)":"var(--border2)"}`,borderRadius:12,color:wished?"var(--rose)":"var(--muted)",fontSize:22,cursor:"pointer",transition:"all .2s"}}>
                {wished?<Ic icon={Heart} size={18} color="var(--rose)" style={{fill:"var(--rose)"}}/>:<Ic icon={Heart} size={18}/>}
              </button>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[["Fabric",data.fabric],["Occasion",data.occasion],["Care",data.care],["Category",data.category]].map(([k,v])=>(
                <div key={k} style={{padding:"12px 14px",background:"#fff",borderRadius:12,border:"1.5px solid var(--border)"}}>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:"var(--muted)",textTransform:"uppercase",marginBottom:3}}>{k}</div>
                  <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{v||"—"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",borderBottom:"2px solid var(--border)",marginBottom:28,overflowX:"auto",gap:2}}>
          {["description","reviews","size guide","shipping"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"12px 20px",background:tab===t?"var(--roseL)":"transparent",border:"none",borderBottom:tab===t?"3px solid var(--rose)":"3px solid transparent",borderRadius:"10px 10px 0 0",color:tab===t?"var(--rose)":"var(--muted)",fontWeight:700,cursor:"pointer",fontSize:12,whiteSpace:"nowrap",marginBottom:-2,transition:"all .2s",textTransform:"capitalize"}}>
              {t}
            </button>
          ))}
        </div>

        {tab==="description"&&<p style={{color:"var(--text2)",lineHeight:2,fontSize:15,maxWidth:680,fontWeight:400}}>{data.description}</p>}

        {tab==="reviews"&&(
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"200px 1fr",gap:isMobile?24:44}}>
            <div style={{padding:24,borderRadius:"20px",background:"linear-gradient(135deg,var(--roseL),var(--saffronL))",textAlign:"center",height:"fit-content",border:"1.5px solid var(--border)"}}>
              <div style={{fontFamily:"var(--font-d)",fontSize:54,fontWeight:700,background:"linear-gradient(135deg,var(--rose),var(--saffron))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1}}>{(data.rating||0).toFixed(1)}</div>
              <Stars rating={data.rating||0} size={20}/>
              <div style={{color:"var(--muted)",fontSize:12,marginTop:6,fontWeight:600}}>{data.numReviews||0} reviews</div>
            </div>
            <div>
              {revs.length===0&&<p style={{color:"var(--muted)",fontStyle:"italic"}}>No reviews yet. Be the first!</p>}
              {revs.map(r=>(
                <div key={r._id} style={{borderBottom:"1.5px solid var(--border)",paddingBottom:18,marginBottom:18}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:36,height:36,background:"linear-gradient(135deg,var(--rose),var(--saffron))",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:14}}>{r.userName?.[0]}</div>
                      <div>
                        <div style={{fontWeight:700,fontSize:14,color:"var(--text)"}}>{r.userName} {r.verified&&<span style={{color:"#16A34A",fontSize:11}}>✓ Verified</span>}</div>
                        <div style={{fontSize:11,color:"var(--muted)"}}>{new Date(r.createdAt).toLocaleDateString("en-IN")}</div>
                      </div>
                    </div>
                    <Stars rating={r.rating} size={13}/>
                  </div>
                  <p style={{color:"var(--text2)",fontSize:13,lineHeight:1.8,paddingLeft:46}}>{r.comment}</p>
                  <button onClick={()=>apiMarkHelpful(r._id)} style={{marginLeft:46,marginTop:8,background:"var(--ivory2)",border:"1.5px solid var(--border)",padding:"4px 14px",borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:600,color:"var(--text2)",transition:"all .2s"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="var(--rose)"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
                    <Ic icon={Check} size={13}/> Helpful ({r.helpful})
                  </button>
                </div>
              ))}
              <div style={{padding:isMobile?18:26,borderRadius:"20px",background:"linear-gradient(135deg,var(--roseL),var(--saffronL))",border:"1.5px solid var(--border)"}}>
                <h4 style={{fontFamily:"var(--font-d)",color:"var(--dark)",margin:"0 0 14px",fontSize:20,fontWeight:700}}>Write a Review</h4>
                <Stars rating={newRev.rating} size={30} interactive onRate={r=>setNewRev(v=>({...v,rating:r}))}/>
                <textarea value={newRev.comment} onChange={e=>setNewRev(v=>({...v,comment:e.target.value}))} placeholder="Share your experience with this product…"
                  style={{width:"100%",minHeight:88,padding:"12px 14px",background:"#fff",border:"1.5px solid var(--border2)",fontSize:13,resize:"vertical",outline:"none",marginTop:12,color:"var(--text)",borderRadius:12,boxSizing:"border-box",fontFamily:"var(--font-b)"}}/>
                {revMsg&&<div style={{color:revMsg.includes("★")?"#16A34A":"#DC2626",fontSize:13,marginTop:6,fontWeight:700}}>{revMsg}</div>}
                <button className="btn btn-rose" onClick={submitRev} style={{marginTop:12,padding:"12px 28px",fontSize:13}}>Submit Review</button>
              </div>
            </div>
          </div>
        )}

        {tab==="size guide"&&(
          <div style={{overflowX:"auto"}}>
            <table style={{borderCollapse:"separate",borderSpacing:0,fontSize:13,minWidth:360,borderRadius:"14px",overflow:"hidden",border:"1.5px solid var(--border)"}}>
              <thead><tr style={{background:"linear-gradient(135deg,var(--rose),var(--saffron))"}}>{["Size","Chest","Waist","Hip"].map(h=><th key={h} style={{padding:"13px 22px",textAlign:"left",color:"#fff",fontSize:11,fontWeight:700,letterSpacing:1}}>{h} (in)</th>)}</tr></thead>
              <tbody>{[["XS","32","26","34"],["S","34","28","36"],["M","36","30","38"],["L","38","32","40"],["XL","40","34","42"],["XXL","42","36","44"]].map((row,i)=>(
                <tr key={row[0]} style={{background:i%2===0?"#fff":"var(--ivory2)"}}>
                  {row.map((c,j)=><td key={j} style={{padding:"12px 22px",color:j===0?"var(--rose)":"var(--text2)",fontWeight:j===0?800:400,borderBottom:"1px solid var(--border)"}}>{c}</td>)}
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {tab==="shipping"&&(
          <div style={{maxWidth:600}}>
            {[[Truck,"Standard Delivery","3–5 business days","Free above ₹2000 · ₹99 otherwise"],[Zap,"Express","1–2 business days","₹199"],[RefreshCw,"Free Returns","Within 7 days","Free pickup from door"],[Lock,"Secure Payment","Razorpay","UPI · Cards · EMI · NetBanking"]].map(([DIcon,t,sub,val])=>(
              <div key={t} style={{display:"flex",gap:16,padding:"18px 0",borderBottom:"1.5px solid var(--border)",alignItems:"flex-start"}}>
                <div style={{width:46,height:46,background:"var(--roseL)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic icon={DIcon} size={22} color="var(--rose)"/></div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,color:"var(--text)",fontSize:14}}>{t}</div>
                  <div style={{color:"var(--muted)",fontSize:12,marginTop:2}}>{sub}</div>
                </div>
                <div style={{fontSize:13,fontWeight:700,color:"var(--rose)",textAlign:"right",flexShrink:0}}>{val}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;