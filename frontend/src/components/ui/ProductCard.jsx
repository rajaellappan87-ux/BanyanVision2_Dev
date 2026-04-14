import React, { useEffect, useState } from "react";
import { useBreakpoint } from "../../hooks";
import { useCart } from "../../context/CartContext";
import { useCatConfig } from "../../store/catStore";
import { Ic, fmt, disc, thumb, COLORS_MAP } from "../../utils/helpers";
import { Copy, Heart, Home, LogOut, Menu, Package, Shirt, Share2, User } from "lucide-react";
import { Stars } from "../../components/ui/Common";
import { useAuth } from "../../context/AuthContext";

/* ── Product Card ────────────────────────────────────────────────────────────── */
const ProductCard = ({ p, setPage, toast }) => {
  const {isMobile}=useBreakpoint();
  const {addToCart}=useCart();
  const catCfg=useCatConfig();
  const [hov,setHov]=useState(false);
  const [imgIdx,setImgIdx]=useState(0);
  const [copied,setCopied]=useState(false);

  const copyProductLink=e=>{
    e.stopPropagation();
    const url=`${window.location.origin}/?product=${p._id}`;
    navigator.clipboard.writeText(url).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});
  };

  const shareProductWhatsApp=e=>{
    e.stopPropagation();
    const url=`${window.location.origin}/?product=${p._id}`;
    const msg=encodeURIComponent(`Check out "${p.name}" on BanyanVision!\n${url}`);
    window.open(`https://wa.me/?text=${msg}`,"_blank");
  };
  const d=disc(p.originalPrice,p.price);
  const imgs=p.images||[];
  const cfg=catCfg[p.category]||{grad:"linear-gradient(135deg,var(--rose),var(--saffron))",light:"#FCE4EC",icon:"👗"};

  return (
    <div className="card-base card-hover"
      onMouseEnter={()=>{setHov(true);if(imgs.length>1)setImgIdx(1);}}
      onMouseLeave={()=>{setHov(false);setImgIdx(0);}}>
      {/* Image */}
      <div style={{position:"relative",borderRadius:"20px 20px 0 0",overflow:"hidden",background:cfg.light}}>
        {p.badge&&<div className="tag" style={{position:"absolute",top:12,left:12,background:cfg.grad,color:"#fff",zIndex:2,fontSize:10}}>{p.badge}</div>}
        {d>0&&<div className="tag" style={{position:"absolute",top:12,right:12,background:"linear-gradient(135deg,#EF4444,#F97316)",color:"#fff",zIndex:2,fontSize:10}}>−{d}%</div>}
        <div onClick={()=>setPage(`product-${p._id}`)} style={{overflow:"hidden",aspectRatio:"9/11",width:"100%"}}>
          <img src={imgs[imgIdx]?.url||`https://placehold.co/900x1100/${cfg.light.replace("#","")}/C2185B?text=${encodeURIComponent(p.name)}`} alt={p.name}
            loading="lazy"
            style={{width:"100%",height:"100%",objectFit:"contain",objectPosition:"center",background:cfg.light,transition:"transform .6s cubic-bezier(.25,.46,.45,.94)",transform:hov?"scale(1.04)":"scale(1)"}}/>
        </div>
        {/* Share icons — appear on hover, top-right */}
        <div style={{position:"absolute",top:12,left:12,display:"flex",flexDirection:"column",gap:6,opacity:hov?1:0,transform:hov?"translateX(0)":"translateX(-8px)",transition:"all .25s",zIndex:3}}>
          <button onClick={copyProductLink} title={copied?"Copied!":"Copy link"} style={{width:32,height:32,borderRadius:8,background:copied?"var(--rose)":"rgba(255,255,255,.92)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,.15)",transition:"all .2s"}}>
            <Ic icon={Copy} size={14} color={copied?"#fff":"var(--rose)"}/>
          </button>
          <button onClick={shareProductWhatsApp} title="Share on WhatsApp" style={{width:32,height:32,borderRadius:8,background:"rgba(255,255,255,.92)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,.15)",transition:"all .2s"}}
            onMouseEnter={e=>e.currentTarget.style.background="#25D366"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.92)"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </button>
        </div>

        {/* Quick add */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"10px 12px",background:"linear-gradient(to top,rgba(26,10,0,.75) 0%,transparent 100%)",transform:hov?"translateY(0)":"translateY(110%)",transition:"transform .3s cubic-bezier(.25,.46,.45,.94)"}}>
          <button className="btn btn-rose" onClick={e=>{e.stopPropagation();addToCart(p,1,p.sizes?.[0]||"",p.colors?.[0]||"");toast("Added to bag ✓");}}
            style={{width:"100%",padding:"10px 0",fontSize:12,borderRadius:10}}>Add to Bag</button>
        </div>
        {imgs.length>1&&(
          <div style={{position:"absolute",bottom:hov?48:10,left:"50%",transform:"translateX(-50%)",display:"flex",gap:4,transition:"bottom .3s"}}>
            {imgs.map((_,i)=><div key={i} style={{width:i===imgIdx?14:5,height:5,background:i===imgIdx?"#fff":"rgba(255,255,255,.5)",borderRadius:99,transition:"all .3s"}}/>)}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{padding:isMobile?"10px 12px":"14px 16px"}} onClick={()=>setPage(`product-${p._id}`)}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:.5,marginBottom:4,background:cfg.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{p.category}</div>
        <div style={{fontFamily:"var(--font-d)",fontSize:isMobile?14:16,fontWeight:600,color:"var(--text)",marginBottom:5,lineHeight:1.3}}>{p.name}</div>
        <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}>
          <Stars rating={p.rating||0} size={11}/>
          <span style={{color:"var(--muted)",fontSize:10,fontWeight:500}}>({p.numReviews||0})</span>
        </div>
        <div style={{display:"flex",gap:4,marginBottom:8}}>
          {(p.colors||[]).slice(0,5).map(c=>(
            <div key={c} title={c} style={{width:11,height:11,borderRadius:"50%",background:COLORS_MAP[c]||"#999",border:"2px solid #fff",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"baseline",gap:7}}>
            <span style={{fontFamily:"var(--font-d)",fontSize:isMobile?17:21,fontWeight:700,background:"linear-gradient(135deg,var(--rose),var(--saffron))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{fmt(p.price)}</span>
            {p.originalPrice&&<span style={{fontSize:11,color:"var(--muted)",textDecoration:"line-through"}}>{fmt(p.originalPrice)}</span>}
          </div>
          {p.stock<=7&&<span className="tag" style={{background:"#FEF2F2",color:"#DC2626",fontSize:9,padding:"3px 8px"}}>Only {p.stock} left</span>}
        </div>
      </div>
    </div>
  );
};

/* ── HEADER ──────────────────────────────────────────────────────────────────── */
const Header = ({ page, setPage }) => {
  const {isMobile}=useBreakpoint();
  const {user,logout}=useAuth();
  const {cartCount}=useCart();
  const [scrolled,setScrolled]=useState(false);
  const [mob,setMob]=useState(false);
  const [uMenu,setUMenu]=useState(false);

  useEffect(()=>{
    const h=()=>setScrolled(window.scrollY>50);
    window.addEventListener("scroll",h);return()=>window.removeEventListener("scroll",h);
  },[]);

  const go=p=>{setPage(p);setMob(false);setUMenu(false);window.scrollTo({top:0,behavior:"smooth"});};

  return (
    <>
      {/* Announcement */}
      <div style={{background:"linear-gradient(90deg,var(--rose),var(--saffron),var(--rose))",backgroundSize:"200% 100%",animation:"shimmer 4s linear infinite",padding:"8px 0",overflow:"hidden"}}>
        <div style={{display:"flex",animation:"marquee 22s linear infinite",whiteSpace:"nowrap",width:"max-content"}}>
          {Array(5).fill("✦ FREE SHIPPING ABOVE ₹2000   ✦   WELCOME20 — 20% OFF YOUR FIRST ORDER   ✦   BRIDAL COLLECTION NOW LIVE   ✦   HANDCRAFTED BY 25+ MASTER ARTISANS   ").map((t,i)=>(
            <span key={i} style={{fontSize:11,fontWeight:700,color:"#fff",paddingRight:40,letterSpacing:.8}}>{t}</span>
          ))}
        </div>
      </div>

      <header style={{
        position:"sticky",top:0,zIndex:1000,
        background: scrolled?"rgba(253,248,243,.96)":"rgba(253,248,243,.98)",
        backdropFilter:"blur(20px)",
        borderBottom:`2px solid ${scrolled?"var(--border2)":"var(--border)"}`,
        boxShadow:scrolled?"0 4px 28px rgba(194,24,91,.08)":"none",
        transition:"all .3s"
      }}>
        <div style={{maxWidth:1440,margin:"0 auto",padding:isMobile?"0 16px":"0 48px",display:"flex",alignItems:"center",height:isMobile?62:74,gap:16}}>

          {/* Mobile hamburger */}
          {isMobile&&(
            <button onClick={()=>setMob(!mob)} style={{background:"none",border:"none",display:"flex",flexDirection:"column",gap:5,padding:4}}>
              {[0,1,2].map(i=>(
                <span key={i} style={{display:"block",width:i===1?14:22,height:2,background:"var(--rose)",borderRadius:2,transition:"all .3s",transform:mob?(i===0?"rotate(45deg) translate(5px,5px)":i===2?"rotate(-45deg) translate(5px,-5px)":"scaleX(0)"):"none"}}/>
              ))}
            </button>
          )}

          {/* Logo */}
          <div onClick={()=>go("home")} style={{cursor:"pointer",flex:isMobile?1:"none",display:"flex",alignItems:"center",justifyContent:isMobile?"center":"flex-start",gap:10}}>
            <img src="/bv.jpg" alt="BanyanVision" style={{width:isMobile?48:56,height:isMobile?48:56,objectFit:"contain",borderRadius:0,background:"transparent"}}/>
            {!isMobile&&(
              <div>
                <div style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:700,color:"var(--dark)",lineHeight:1,letterSpacing:.5}}>
                  Banyan<span className="rose-text">Vision</span>
                </div>
                <div style={{fontSize:8,fontWeight:700,letterSpacing:3,color:"var(--muted)",textTransform:"uppercase",marginTop:2}}>Empowering Dreams, Inspiring Innovations</div>
              </div>
            )}
          </div>

          {/* Nav */}
          {!isMobile&&(
            <nav style={{flex:1,display:"flex",justifyContent:"center",gap:2}}>
              {[["Home","home"],["Collections","shop"],["About","about"]].map(([l,p])=>(
                <button key={p} onClick={()=>go(p)} style={{background:page===p?"var(--roseL)":"transparent",border:"none",padding:"9px 20px",borderRadius:10,fontSize:13,fontWeight:600,color:page===p?"var(--rose)":"var(--text2)",transition:"all .2s",letterSpacing:.2}}
                  onMouseEnter={e=>{if(page!==p){e.currentTarget.style.background="var(--ivory3)";e.currentTarget.style.color="var(--rose)";}}}
                  onMouseLeave={e=>{if(page!==p){e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--text2)";}}}>
                  {l}
                </button>
              ))}
              {user?.role==="admin"&&(
                <button onClick={()=>go("admin")} style={{background:"var(--purpleL)",border:"none",padding:"7px 16px",borderRadius:10,fontSize:12,fontWeight:700,color:"var(--purple)",marginLeft:8}}>Admin</button>
              )}
            </nav>
          )}

          {/* Actions */}
          <div style={{display:"flex",alignItems:"center",gap:isMobile?4:8}}>
            {!isMobile&&(
              <button onClick={()=>go("wishlist")} title="Wishlist" style={{background:"none",border:"none",fontSize:20,padding:8,lineHeight:1,color:"var(--muted)",transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.color="var(--rose)";e.currentTarget.style.transform="scale(1.15)";}}
                onMouseLeave={e=>{e.currentTarget.style.color="var(--muted)";e.currentTarget.style.transform="scale(1)";}}><Ic icon={Heart} size={20}/></button>
            )}
            <button onClick={()=>go("cart")} style={{position:"relative",background:cartCount>0?"var(--roseL)":"var(--ivory3)",border:cartCount>0?"1.5px solid var(--rose)":"1.5px solid var(--border2)",borderRadius:12,padding:"8px 10px",transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="var(--roseL)";e.currentTarget.style.borderColor="var(--rose)";}}
              onMouseLeave={e=>{e.currentTarget.style.background=cartCount>0?"var(--roseL)":"var(--ivory3)";e.currentTarget.style.borderColor=cartCount>0?"var(--rose)":"var(--border2)";}}>
              <svg width="20" height="20" fill="none" stroke={cartCount>0?"var(--rose)":"var(--text2)"} strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {cartCount>0&&<span style={{position:"absolute",top:-6,right:-6,background:"linear-gradient(135deg,var(--rose),var(--saffron))",color:"#fff",borderRadius:"50%",width:19,height:19,fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid var(--ivory)"}}>{cartCount}</span>}
            </button>

            {user?(
              <div style={{position:"relative"}}>
                <button onClick={()=>setUMenu(!uMenu)} style={{display:"flex",alignItems:"center",gap:8,background:"var(--ivory2)",border:"1.5px solid var(--border2)",padding:isMobile?"6px 10px":"7px 14px",borderRadius:12,transition:"all .2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--rose)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=uMenu?"var(--rose)":"var(--border2)";}}>
                  <div style={{width:28,height:28,background:"linear-gradient(135deg,var(--rose),var(--saffron))",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff"}}>{user.name?.[0]}</div>
                  {!isMobile&&<span style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{user.name?.split(" ")[0]}</span>}
                </button>
                {uMenu&&(
                  <div style={{position:"absolute",right:0,top:"calc(100% + 8px)",minWidth:210,zIndex:2000,background:"#fff",borderRadius:"14px",boxShadow:"0 12px 48px rgba(26,10,0,.15)",border:"1.5px solid var(--border)",overflow:"hidden"}}>
                    <div style={{padding:"14px 16px",background:"linear-gradient(135deg,var(--roseL),var(--saffronL))",borderBottom:"1px solid var(--border)"}}>
                      <div style={{fontFamily:"var(--font-d)",fontWeight:700,color:"var(--text)",fontSize:15}}>{user.name}</div>
                      <div style={{color:"var(--muted)",fontSize:12,marginTop:2}}>{user.email}</div>
                    </div>
                    {[{Icon:User,l:"Profile",p:"profile"},{Icon:Package,l:"My Orders",p:"orders"},{Icon:Heart,l:"Wishlist",p:"wishlist"}].map(({Icon,l,p})=>(
                      <button key={p} onClick={()=>go(p)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px 16px",background:"none",border:"none",borderBottom:"1px solid var(--border)",fontSize:13,color:"var(--text2)",cursor:"pointer",textAlign:"left",fontWeight:500,transition:"all .15s"}}
                        onMouseEnter={e=>{e.currentTarget.style.background="var(--roseL)";e.currentTarget.style.color="var(--rose)";}}
                        onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color="var(--text2)";}}>
                        <Ic icon={Icon} size={16}/> {l}
                      </button>
                    ))}
                    {user.role==="admin"&&<button onClick={()=>go("admin")} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px 16px",background:"none",border:"none",borderBottom:"1px solid var(--border)",fontSize:13,color:"var(--purple)",fontWeight:700,cursor:"pointer"}}>Admin Panel</button>}
                    <button onClick={()=>{logout();go("home");}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px 16px",background:"none",border:"none",fontSize:13,color:"#EF4444",fontWeight:600,cursor:"pointer"}}><span style={{display:"flex",alignItems:"center",gap:8}}><Ic icon={LogOut} size={14}/>Sign Out</span></button>
                  </div>
                )}
              </div>
            ):(
              <button className="btn btn-rose" onClick={()=>go("login")} style={{padding:isMobile?"8px 14px":"9px 22px",fontSize:13}}>Sign In</button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobile&&mob&&(
          <div style={{borderTop:"1px solid var(--border)",background:"#fff",paddingBottom:12}}>
            {[{Icon:Home,l:"Home",p:"home"},{Icon:Shirt,l:"Collections",p:"shop"},{Icon:InfoIcon,l:"About",p:"about"},{Icon:Heart,l:"Wishlist",p:"wishlist"},{Icon:Package,l:"Orders",p:"orders"}].map(({Icon,l,p})=>(
              <button key={p} onClick={()=>go(p)} style={{display:"flex",alignItems:"center",gap:12,width:"100%",textAlign:"left",padding:"13px 20px",background:page===p?"var(--roseL)":"none",border:"none",fontSize:13,fontWeight:600,color:page===p?"var(--rose)":"var(--text2)",borderBottom:"1px solid var(--border)"}}>
                <Ic icon={Icon} size={18}/> {l}
              </button>
            ))}
          </div>
        )}
      </header>
    </>
  );
};

export default ProductCard;