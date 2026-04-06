import React, { useState, useEffect } from "react";
import { useBreakpoint } from "../hooks";
import { useCatConfig } from "../store/catStore";
import { usePromoData, useMarqueeData, useSettings } from "../store/contentStore";
import { Ic, fmt, getIcon } from "../utils/helpers";
import { apiGetProducts, apiGetTopReviews } from "../api";
import ProductCard from "../components/ui/ProductCard";
import { Leaf, Palette, Zap, Heart } from "lucide-react";
import { Spinner, SecLabel } from "../components/ui/Common";

/* ── HOME ────────────────────────────────────────────────────────────────────── */
const HomePage = ({ setPage, toast }) => {
  const {isMobile}=useBreakpoint();
  const catCfg=useCatConfig();
  const promo=usePromoData();
  const marquee=useMarqueeData();
  const st=useSettings();
  const [featured,setFeatured]=useState([]);
  const [trending,setTrending]=useState([]);
  const [loading,setLoading]=useState(true);
  const [topReviews,setTopReviews]=useState([]);

  useEffect(()=>{
    Promise.all([
      apiGetProducts({featured:true,limit:4}),
      apiGetProducts({trending:true,limit:4}),
      apiGetTopReviews(5),
    ])
      .then(([f,t,r])=>{
        setFeatured(Array.isArray(f?.data?.products) ? f.data.products : []);
        setTrending(Array.isArray(t?.data?.products) ? t.data.products : []);
        setTopReviews(Array.isArray(r?.data?.reviews) ? r.data.reviews : []);
      })
      .catch(()=>{ setFeatured([]); setTrending([]); })
      .finally(()=>setLoading(false));
  },[]);

  return (
    <div>
      {/* ─ HERO ─ */}
      <section style={{background:"linear-gradient(160deg,var(--ivory) 0%,var(--roseL) 40%,var(--saffronL) 80%,var(--ivory) 100%)",minHeight:isMobile?"auto":"94vh",display:"flex",alignItems:"center",position:"relative",overflow:"hidden"}}>
        {/* Decorative circles */}
        <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(194,24,91,.07) 0%,transparent 70%)",top:-100,right:-100,pointerEvents:"none"}}/>
        <div style={{position:"absolute",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(230,81,0,.06) 0%,transparent 70%)",bottom:0,left:"10%",pointerEvents:"none",animation:"float 7s ease-in-out infinite"}}/>
        <div style={{position:"absolute",top:0,bottom:0,left:isMobile?8:36,width:1,background:"linear-gradient(to bottom,transparent,var(--border2),transparent)"}}/>
        <div style={{position:"absolute",top:0,bottom:0,right:isMobile?8:36,width:1,background:"linear-gradient(to bottom,transparent,var(--border2),transparent)"}}/>

        <div style={{maxWidth:1440,margin:"0 auto",padding:isMobile?"72px 24px 56px":"0 80px",width:"100%",display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?48:80,alignItems:"center"}}>
          {/* Text */}
          <div>
            <div className="u1">
              <SecLabel>New Arrivals 2025</SecLabel>
            </div>
            <h1 className="u2" style={{fontFamily:"var(--font-d)",fontSize:isMobile?"clamp(40px,11vw,56px)":"clamp(50px,5vw,80px)",fontWeight:700,lineHeight:1.05,color:"var(--dark)",marginTop:14,marginBottom:22,letterSpacing:-.5}}>
              Wear India's<br/>
              <em style={{color:"var(--rose)",fontStyle:"italic"}}>Soul</em> in<br/>
              Every Thread
            </h1>
            <p className="u3" style={{fontSize:isMobile?14:16,color:"var(--text2)",lineHeight:1.85,maxWidth:400,marginBottom:32,fontWeight:400}}>
              Handpicked from master artisans — Varanasi silk, Rajasthan block prints, Jaipur embroidery. Heritage made wearable.
            </p>
            <div className="u4" style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:40}}>
              <button className="btn btn-rose" onClick={()=>setPage("shop")} style={{padding:isMobile?"13px 26px":"15px 36px",fontSize:15}}>
                Shop Collection
              </button>
              <button className="btn btn-ghost" onClick={()=>setPage("about")} style={{padding:isMobile?"13px 26px":"15px 36px",fontSize:15}}>
                Our Story ↗
              </button>
            </div>
            {/* Stats row */}
            <div className="u5" style={{display:"flex",gap:isMobile?20:36,paddingTop:28,borderTop:`1.5px solid var(--border2)`,flexWrap:"wrap"}}>
              {[["12K+","Curated Styles"],["98%","Happy Clients"],["25+","Artisans"],...(st.returnsEnabled?[["Free","Easy Returns"]]:[])].map(([v,l])=>(
                <div key={l}>
                  <div style={{fontFamily:"var(--font-d)",fontSize:isMobile?20:26,fontWeight:700,background:"linear-gradient(135deg,var(--rose),var(--saffron))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1}}>{v}</div>
                  <div style={{fontSize:10,color:"var(--muted)",fontWeight:600,letterSpacing:.5,marginTop:3,textTransform:"uppercase"}}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Product mosaic */}
          {!isMobile&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gridTemplateRows:"auto auto",gap:14,paddingTop:20}}>
              {(loading?Array(4).fill(null):featured.slice(0,4)).map((p,i)=>(
                <div key={i} onClick={()=>p&&setPage(`product-${p._id}`)}
                  style={{height:i%2===0?290:220,borderRadius:"20px",overflow:"hidden",cursor:"pointer",position:"relative",background:"var(--ivory3)",border:"1.5px solid var(--border)",marginTop:i%2!==0?30:0,transition:"all .4s cubic-bezier(.25,.46,.45,.94)"}}
                  onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.04) rotate(-.8deg)";e.currentTarget.style.boxShadow="0 16px 48px rgba(194,24,91,.2)";e.currentTarget.style.borderColor="var(--rose)";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";e.currentTarget.style.borderColor="var(--border)";}}>
                  {p?.images?.[0]
                    ?<img src={p.images[0].url} alt={p.name} loading="lazy" style={{width:"100%",height:"100%",objectFit:"contain",objectPosition:"center",background:"var(--ivory2)"}}/>
                    :<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--rose)",fontFamily:"var(--font-d)",fontSize:13,fontWeight:600}}>{p?.name||"Loading…"}</div>
                  }
                  {p&&<div style={{position:"absolute",bottom:0,left:0,right:0,padding:"20px 14px 14px",background:"linear-gradient(to top,rgba(26,10,0,.85),transparent)"}}>
                    <div style={{fontFamily:"var(--font-d)",fontSize:13,color:"#fff",fontWeight:600}}>{p.name}</div>
                    <div style={{fontSize:12,color:"#F9A825",fontWeight:700,marginTop:3}}>{fmt(p.price)}</div>
                  </div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scroll hint */}
        {!isMobile&&(
          <div style={{position:"absolute",bottom:28,left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
            <span style={{fontSize:9,fontWeight:700,letterSpacing:3,color:"var(--muted)",textTransform:"uppercase"}}>Scroll</span>
            <div style={{width:1.5,height:36,background:"linear-gradient(to bottom,var(--rose),transparent)",animation:"float 2s ease-in-out infinite"}}/>
          </div>
        )}
      </section>

      {/* ─ CRAFT STRIP — admin-editable via Admin → Marquee Banner ─ */}
      {marquee.active!==false&&(
      <div style={{background:"linear-gradient(90deg,var(--rose),var(--saffron),var(--purple),var(--rose))",
                   backgroundSize:"300% 100%",animation:"shimmer 6s linear infinite",
                   padding:"13px 0",overflow:"hidden",position:"relative"}}>
        <div className="bv-marquee-track"
             style={{animation:`marquee ${marquee.speed||32}s linear infinite`}}>
          {[0,1].map(copy=>(
            <span key={copy} style={{display:"inline-flex",alignItems:"center",flexShrink:0}}>
              {(Array.isArray(marquee.items)&&marquee.items.length>0
                ? marquee.items
                : ["BanyanVision — Handcrafted Indian Fashion"]
              ).map((t,i)=>(
                <span key={i} style={{
                  fontSize:11,fontWeight:700,
                  color:"rgba(255,255,255,.95)",
                  padding:"0 24px",
                  letterSpacing:1.5,
                  whiteSpace:"nowrap",
                }}>
                  {marquee.separator||"✦"} {t}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
      )}

      {/* ─ CATEGORIES ─ */}
      <section style={{background:"var(--cream)",padding:isMobile?"52px 20px":"80px 80px"}}>
        <div style={{maxWidth:1440,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <SecLabel>Explore</SecLabel>
            <h2 style={{fontFamily:"var(--font-d)",fontSize:isMobile?28:44,fontWeight:700,color:"var(--dark)",marginTop:8,letterSpacing:-.3}}>
              Shop by <span className="rose-text">Category</span>
            </h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?3:6},1fr)`,gap:isMobile?10:16}}>
            {Object.entries(catCfg).map(([name,cfg])=>(
              <button key={name} onClick={()=>setPage("shop")}
                style={{padding:isMobile?"18px 8px":"28px 14px",borderRadius:"20px",border:"1.5px solid var(--border)",background:cfg.light,display:"flex",flexDirection:"column",alignItems:"center",gap:10,cursor:"pointer",transition:"all .3s cubic-bezier(.25,.46,.45,.94)",boxShadow:"0 2px 10px rgba(0,0,0,.04)"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-6px) scale(1.03)";e.currentTarget.style.boxShadow="0 16px 40px rgba(0,0,0,.1)";e.currentTarget.style.borderColor="var(--rose)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 2px 10px rgba(0,0,0,.04)";e.currentTarget.style.borderColor="var(--border)";}}>
                <div style={{width:isMobile?44:56,height:isMobile?44:56,borderRadius:"50%",background:cfg.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isMobile?22:28,boxShadow:"0 6px 20px rgba(0,0,0,.15)"}}>
                  {cfg.icon}
                </div>
                <div style={{fontSize:isMobile?9:11,fontWeight:700,color:"var(--dark)",letterSpacing:.5,textAlign:"center",lineHeight:1.3}}>{name}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─ TRENDING ─ */}
      <section style={{background:"var(--ivory)",padding:isMobile?"52px 20px":"80px 80px"}}>
        <div style={{maxWidth:1440,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:40,flexWrap:"wrap",gap:12}}>
            <div>
              <SecLabel>Hot Right Now</SecLabel>
              <h2 style={{fontFamily:"var(--font-d)",fontSize:isMobile?28:44,fontWeight:700,color:"var(--dark)",marginTop:8,letterSpacing:-.3}}>Trending <span className="rose-text">Picks</span></h2>
            </div>
            <button className="btn btn-outline" onClick={()=>setPage("shop")} style={{padding:"10px 22px",fontSize:13}}>View All →</button>
          </div>
          {loading?<Spinner/>:(
            <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:isMobile?10:20}}>
              {trending.map(p=><ProductCard key={p._id} p={p} setPage={setPage} toast={toast}/>)}
            </div>
          )}
        </div>
      </section>

      {/* ─ PROMO BANNER (admin-editable) ─ */}
      {promo.active&&(
      <section style={{margin:isMobile?"0 20px 52px":"0 80px 80px",borderRadius:"28px",background:"linear-gradient(135deg,var(--dark) 0%,var(--dark2) 40%,#3D1500 100%)",padding:isMobile?"44px 28px":"64px 80px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-60,right:-60,width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle,rgba(249,168,37,.12) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",bottom:-40,left:"40%",width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(194,24,91,.1) 0%,transparent 70%)"}}/>
        <div style={{position:"relative",display:"flex",flexDirection:isMobile?"column":"row",alignItems:"center",gap:isMobile?28:60}}>
          <div style={{flex:1,textAlign:isMobile?"center":"left"}}>
            <span className="tag" style={{background:"rgba(249,168,37,.15)",color:"#F9A825",border:"1px solid rgba(249,168,37,.25)",marginBottom:16}}>{promo.tag}</span>
            <h2 style={{fontFamily:"var(--font-d)",fontSize:isMobile?28:48,fontWeight:700,color:"#fff",marginTop:6,lineHeight:1.15,marginBottom:14}}>
              {promo.heading} —<br/><em style={{color:"var(--gold)"}}>{promo.subheading}</em>
            </h2>
            <p style={{color:"rgba(255,255,255,.7)",fontSize:14,lineHeight:1.75,maxWidth:420}}>
              {promo.body} <strong style={{background:"rgba(255,255,255,.12)",padding:"2px 10px",borderRadius:6,fontFamily:"monospace",color:"#F9A825",fontSize:15,letterSpacing:1}}>{promo.code}</strong> {promo.codeDesc}
            </p>
          </div>
          <button className="btn btn-saffron" onClick={()=>setPage("shop")} style={{padding:isMobile?"14px 30px":"16px 48px",fontSize:16,flexShrink:0,borderRadius:"20px"}}>
            {promo.btnLabel}
          </button>
        </div>
      </section>
      )}

      {/* ─ TOP REVIEWS ─ */}
      {topReviews.length>0&&(
      <section style={{background:"var(--ivory)",padding:isMobile?"52px 20px":"80px 80px",borderTop:"1.5px solid var(--border)"}}>
        <div style={{maxWidth:1440,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:40}}>
            <SecLabel>Happy Customers</SecLabel>
            <h2 style={{fontFamily:"var(--font-d)",fontSize:isMobile?26:40,fontWeight:700,color:"var(--dark)",marginTop:8}}>What Our <span className="rose-text">Customers Say</span></h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":topReviews.length>=3?"repeat(3,1fr)":topReviews.length===2?"repeat(2,1fr)":"1fr",gap:isMobile?14:24}}>
            {topReviews.map(rv=>(
              <div key={rv._id} style={{background:"#fff",borderRadius:20,padding:"24px 24px 20px",border:"1.5px solid var(--border)",boxShadow:"0 2px 16px rgba(194,24,91,.06)",display:"flex",flexDirection:"column",gap:10}}>
                {/* Stars */}
                <div style={{display:"flex",gap:3}}>
                  {[1,2,3,4,5].map(i=>(
                    <span key={i} style={{fontSize:15,color:i<=rv.rating?"#F9A825":"#e0d0c8"}}>★</span>
                  ))}
                </div>
                {/* Comment */}
                <p style={{fontSize:13,color:"var(--text2)",lineHeight:1.7,flex:1,margin:0,fontStyle:"italic"}}>
                  "{rv.comment}"
                </p>
                {/* Footer */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",borderTop:"1px solid var(--border)",paddingTop:12,marginTop:4}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:"var(--dark)"}}>{rv.userName||"Customer"}</div>
                    {rv.product?.name&&<div style={{fontSize:11,color:"var(--rose)",marginTop:1}}>{rv.product.name}</div>}
                  </div>
                  <span style={{fontSize:10,fontWeight:700,letterSpacing:.5,color:"#2E7D32",background:"#E8F5E9",padding:"3px 9px",borderRadius:6}}>✓ Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ─ FEATURED ─ */}
      <section style={{background:"var(--cream)",padding:isMobile?"52px 20px":"80px 80px"}}>
        <div style={{maxWidth:1440,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:40,flexWrap:"wrap",gap:12}}>
            <div>
              <SecLabel>Curated For You</SecLabel>
              <h2 style={{fontFamily:"var(--font-d)",fontSize:isMobile?28:44,fontWeight:700,color:"var(--dark)",marginTop:8,letterSpacing:-.3}}>Editor's <span className="rose-text">Picks</span></h2>
            </div>
            <button className="btn btn-outline" onClick={()=>setPage("shop")} style={{padding:"10px 22px",fontSize:13}}>All Products →</button>
          </div>
          {loading?<Spinner/>:(
            <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:isMobile?10:20}}>
              {featured.map(p=><ProductCard key={p._id} p={p} setPage={setPage} toast={toast}/>)}
            </div>
          )}
        </div>
      </section>

      {/* ─ WHY US ─ */}
      <section style={{background:"var(--ivory)",padding:isMobile?"52px 20px":"80px 80px",borderTop:"1.5px solid var(--border)"}}>
        <div style={{maxWidth:1440,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:40}}>
            <SecLabel>The Difference</SecLabel>
            <h2 style={{fontFamily:"var(--font-d)",fontSize:isMobile?26:40,fontWeight:700,color:"var(--dark)",marginTop:8}}>Why Choose <span className="rose-text">BanyanVision</span></h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:isMobile?14:1,background:isMobile?"transparent":"var(--border)",border:isMobile?"none":"1.5px solid var(--border)",borderRadius:isMobile?"none":"20px",overflow:"hidden"}}>
            {[[Palette,"Authentic","Verified Indian artisans only","var(--roseL)"],[Leaf,"Sustainable","Eco-conscious packaging","var(--tealL)"],[Zap,"Fast Delivery",`${st.standardDays||"3–7 business days"}`,"var(--saffronL)"],...(st.returnsEnabled?[[Heart,"Free Returns",`${st.returnDays||7}-day easy returns`,"var(--purpleL)"]]:[]) ].map(([HIcon,t,d,bg],i)=>(
              <div key={t} style={{padding:isMobile?"24px 16px":"40px 28px",textAlign:"center",background:isMobile?bg:"var(--cream)",transition:"background .2s"}}
                onMouseEnter={e=>e.currentTarget.style.background=bg}
                onMouseLeave={e=>e.currentTarget.style.background=isMobile?bg:"var(--cream)"}>
                <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><Ic icon={HIcon} size={isMobile?32:42} color="var(--rose)"/></div>
                <div style={{fontFamily:"var(--font-d)",fontSize:isMobile?16:20,fontWeight:700,color:"var(--dark)",marginBottom:8}}>{t}</div>
                <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.7,fontWeight:400}}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;