import React, { useState, useEffect, useRef } from "react";
import { useTopbarData } from "../../store/contentStore";
import { useBreakpoint } from "../../hooks";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { Ic } from "../../utils/helpers";
import { Heart, User, Menu, LogOut, Package, Home, Shirt, Info as InfoIcon } from "lucide-react";

const Header = ({ page, setPage }) => {
  const {isMobile}=useBreakpoint();
  const {user,logout}=useAuth();
  const {cartCount}=useCart();
  const topbar=useTopbarData();
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
      {/* Announcement bar — admin-editable via Admin → Marquee Banner */}
      {topbar.active!==false&&(
      <div style={{background:"linear-gradient(90deg,var(--rose),var(--saffron),var(--rose))",backgroundSize:"200% 100%",animation:"shimmer 4s linear infinite",padding:"8px 0",overflow:"hidden"}}>
        <div style={{display:"flex",animation:`marquee ${topbar.speed||22}s linear infinite`,whiteSpace:"nowrap",width:"max-content"}}>
          {Array(5).fill((topbar.text||"✦ BanyanVision — Handcrafted Indian Fashion")+"   ").map((t,i)=>(
            <span key={i} style={{fontSize:11,fontWeight:700,color:"#fff",paddingRight:40,letterSpacing:.8}}>{t}</span>
          ))}
        </div>
      </div>
      )}

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

export default Header;