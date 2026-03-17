import React, { useState, useEffect } from "react";
import { useBreakpoint } from "../../hooks";
import { useSettings } from "../../store/contentStore";
import { Ic } from "../../utils/helpers";
import { Mail, Phone, Instagram, Facebook, Youtube, Twitter } from "lucide-react";

/* ── WHATSAPP FLOATING BUTTON ─────────────────────────────────────────────────── */
const WhatsAppButton = () => {
  const [show,setShow]=useState(false);
  const st=useSettings();
  useEffect(()=>{const t=setTimeout(()=>setShow(true),2000);return()=>clearTimeout(t);},[]);
  if(!show)return null;
  const waUrl=`https://wa.me/${st.whatsapp}?text=${encodeURIComponent(st.whatsappMsg||"Hi BanyanVision!")}`;
  return(
    <a href={waUrl} target="_blank" rel="noopener noreferrer" title="Chat with us on WhatsApp"
      style={{position:"fixed",bottom:28,right:28,zIndex:8000,width:58,height:58,background:"#25D366",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 6px 24px rgba(37,211,102,.45)",textDecoration:"none",animation:"waFloat 2.5s ease-in-out infinite",transition:"transform .2s"}}
      onMouseEnter={e=>e.currentTarget.style.transform="scale(1.15)"}
      onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    </a>
  );
};

/* ── COOKIE CONSENT BANNER ───────────────────────────────────────────────────── */
const CookieBanner = () => {
  const [show,setShow]=useState(()=>!localStorage.getItem("bv_cookie_ok"));
  if(!show)return null;
  const accept=()=>{localStorage.setItem("bv_cookie_ok","1");setShow(false);};
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:7999,background:"rgba(26,10,0,.96)",backdropFilter:"blur(8px)",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,borderTop:"2px solid var(--rose)"}}>
      <p style={{margin:0,fontSize:12,color:"rgba(255,255,255,.8)",lineHeight:1.6,flex:1,minWidth:240}}>
        We use cookies to improve your experience. By continuing, you agree to our <span style={{color:"var(--rose)",cursor:"pointer",fontWeight:700}}>Privacy Policy</span>.
      </p>
      <div style={{display:"flex",gap:10}}>
        <button onClick={accept} style={{padding:"9px 22px",background:"linear-gradient(135deg,var(--rose),var(--saffron))",border:"none",borderRadius:9,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>Accept All</button>
        <button onClick={accept} style={{padding:"9px 18px",background:"none",border:"1px solid rgba(255,255,255,.2)",borderRadius:9,color:"rgba(255,255,255,.6)",fontWeight:600,fontSize:12,cursor:"pointer"}}>Dismiss</button>
      </div>
    </div>
  );
};

/* ── FOOTER ─────────────────────────────────────────────────────────────────── */
const Footer = ({ setPage }) => {
  const {isMobile}=useBreakpoint();
  const st=useSettings();
  const lnk={marginBottom:10,fontSize:13,color:"rgba(255,255,255,.5)",cursor:"pointer",lineHeight:1.6,fontWeight:400,transition:"color .2s"};
  const hov=e=>e.currentTarget.style.color="var(--rose)";
  const unHov=e=>e.currentTarget.style.color="rgba(255,255,255,.5)";
  return(
    <footer style={{background:"var(--dark)",borderTop:"2px solid var(--dark2)"}}>
      <div style={{maxWidth:1440,margin:"0 auto",padding:isMobile?"44px 24px 24px":"64px 80px 28px"}}>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"2fr 1fr 1fr 1fr",gap:isMobile?28:48,marginBottom:44}}>

          {/* Brand */}
          <div style={{gridColumn:isMobile?"1/-1":"auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
              <img src="/bv.jpg" alt="BanyanVision" style={{width:52,height:52,objectFit:"contain",background:"transparent"}}/>
              <div>
                <div style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:700,color:"#fff",letterSpacing:.5}}>BanyanVision</div>
                <div style={{fontSize:8,fontWeight:700,letterSpacing:3,color:"rgba(255,255,255,.4)",textTransform:"uppercase"}}>Empowering Dreams, Inspiring Innovations</div>
              </div>
            </div>
            <p style={{fontSize:13,color:"rgba(255,255,255,.55)",lineHeight:1.85,maxWidth:280,fontWeight:400,marginBottom:16}}>
              India's finest handcrafted fashion. Every piece carries the legacy of master artisans.
            </p>
            {/* Contact */}
            <div style={{marginBottom:16}}>
              <a href={`mailto:${st.email}`} style={{display:"flex",alignItems:"center",gap:8,color:"rgba(255,255,255,.5)",textDecoration:"none",fontSize:12,marginBottom:8,transition:"color .2s"}}
                onMouseEnter={e=>e.currentTarget.style.color="var(--rose)"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,.5)"}>
                <Ic icon={Mail} size={13} style={{marginRight:4}}/>{st.email}
              </a>
              <a href={`https://wa.me/${st.whatsapp}?text=${encodeURIComponent(st.whatsappMsg||"")}`} target="_blank" rel="noopener noreferrer"
                style={{display:"flex",alignItems:"center",gap:8,color:"rgba(255,255,255,.5)",textDecoration:"none",fontSize:12,marginBottom:8,transition:"color .2s"}}
                onMouseEnter={e=>e.currentTarget.style.color="#25D366"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,.5)"}>
                WhatsApp Us
              </a>
              <a href={`tel:${st.phone}`}
                style={{display:"flex",alignItems:"center",gap:8,color:"rgba(255,255,255,.5)",textDecoration:"none",fontSize:12,transition:"color .2s"}}
                onMouseEnter={e=>e.currentTarget.style.color="var(--gold)"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,.5)"}>
                <Ic icon={Phone} size={13} style={{marginRight:4}}/>{st.phone}
              </a>
            </div>
            {/* Social */}
            <div style={{display:"flex",gap:10,marginBottom:16}}>
              {[
                {Icon:Instagram,label:"Instagram",url:st.instagram},
                {Icon:Facebook, label:"Facebook", url:st.facebook},
                {Icon:Youtube,  label:"YouTube",  url:st.youtube},
                {Icon:Twitter,  label:"Twitter",  url:st.twitter},
              ].filter(s=>s.url).map(s=>(
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" title={s.label}
                  style={{width:34,height:34,background:"rgba(255,255,255,.07)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none",transition:"all .2s",border:"1px solid rgba(255,255,255,.08)"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--rose)"}
                  onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.07)"}>
                  <Ic icon={s.Icon} size={16} color="rgba(255,255,255,.7)"/>
                </a>
              ))}
            </div>
            {/* Trust badges */}
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["Secure Pay","Free Delivery","Easy Returns","★ 4.8 Rating"].map(b=>(
                <div key={b} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",padding:"4px 10px",borderRadius:8,fontSize:10,color:"rgba(255,255,255,.55)",fontWeight:600}}>{b}</div>
              ))}
            </div>
          </div>

          {/* Shop links */}
          <div>
            <div style={{fontSize:10,letterSpacing:2.5,color:"var(--rose)",textTransform:"uppercase",fontWeight:800,marginBottom:16}}>Shop</div>
            {["Kurtas & Sets","Sarees","Lehengas","Western Wear","Accessories","Men's Wear","Bags","Fancy Jewelry"].map(link=>(
              <div key={link} onClick={()=>setPage("shop")} style={lnk} onMouseEnter={hov} onMouseLeave={unHov}>{link}</div>
            ))}
          </div>

          {/* Company */}
          <div>
            <div style={{fontSize:10,letterSpacing:2.5,color:"var(--rose)",textTransform:"uppercase",fontWeight:800,marginBottom:16}}>Company</div>
            {[["About Us","about"],["Our Story","about"],["Contact Us","contact"]].map(([l,p])=>(
              <div key={l} onClick={()=>setPage(p)} style={lnk} onMouseEnter={hov} onMouseLeave={unHov}>{l}</div>
            ))}
          </div>

          {/* Help */}
          <div>
            <div style={{fontSize:10,letterSpacing:2.5,color:"var(--rose)",textTransform:"uppercase",fontWeight:800,marginBottom:16}}>Help</div>
            {[["Privacy Policy","privacy"],["Terms of Service","terms"],["Refund & Returns","refund"],["Shipping Policy","shipping"],["Track Your Order","orders"]].map(([l,p])=>(
              <div key={l} onClick={()=>setPage(p)} style={lnk} onMouseEnter={hov} onMouseLeave={unHov}>{l}</div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{borderTop:"1px solid rgba(255,255,255,.07)",paddingTop:22,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,.3)",fontWeight:400}}>
            {`© 2025 BanyanVision. Empowering Dreams, Inspiring Innovations.${st.gst?" | GST: "+st.gst:""}`}
          </div>
          <div style={{display:"flex",gap:16,fontSize:11,color:"rgba(255,255,255,.3)"}}>
            {[["Privacy Policy","privacy"],["Terms","terms"],["Refund Policy","refund"],["Shipping","shipping"]].map(([t,p])=>(
              <span key={t} onClick={()=>setPage(p)} style={{cursor:"pointer",transition:"color .2s"}}
                onMouseEnter={e=>e.target.style.color="var(--rose)"}
                onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.3)"}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
export { WhatsAppButton, CookieBanner };