import React, { useState, useEffect, useRef, useCallback } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider, useCart } from "./context/CartContext";
import { useBreakpoint, useToast } from "./hooks";
import {
  apiGetProducts, apiGetProduct, apiCreateProduct, apiUpdateProduct,
  apiDeleteProduct, apiDeleteProductImage,
  apiCreateReview, apiMarkHelpful,
  apiCreatePayment, apiCreateOrder, apiGetMyOrders, apiGetAllOrders, apiUpdateStatus,
  apiToggleWishlist, apiGetWishlist,
  apiValidateCoupon, apiGetCoupons, apiCreateCoupon, apiDeleteCoupon,
  apiAdminStats, apiAdminUsers, apiAdminCreateUser, apiAdminToggleUser, apiAdminChangeRole, apiAdminDeleteUser,
  apiAdminInventory, apiAdminStockUpdate, apiUpdateProfile,
} from "./api";

/* ─── GLOBAL STYLES ──────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,900;1,400;1,600&family=DM+Sans:wght@300;400;500;600;700&display=swap');

  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

  :root {
    --rose:    #C2185B;
    --rose2:   #E91E8C;
    --roseL:   #FCE4EC;
    --saffron: #E65100;
    --saffronL:#FFF3E0;
    --gold:    #F9A825;
    --goldL:   #FFF8E1;
    --teal:    #00695C;
    --tealL:   #E0F2F1;
    --purple:  #6A1B9A;
    --purpleL: #F3E5F5;
    --ivory:   #FDF8F3;
    --ivory2:  #FAF3EB;
    --ivory3:  #F5EDE0;
    --cream:   #FFFBF5;
    --dark:    #1A0A00;
    --dark2:   #2D1500;
    --text:    #1A0A00;
    --text2:   #5C3A1E;
    --muted:   #9E7B5A;
    --border:  #EDD9C5;
    --border2: #E0C9B0;
    --white:   #FFFFFF;
    --shadow:  0 4px 24px rgba(194,24,91,0.08);
    --shadow2: 0 8px 40px rgba(26,10,0,0.12);
    --shadow3: 0 20px 60px rgba(26,10,0,0.15);
    --r:       14px;
    --r2:      20px;
    --r3:      28px;
    --font-d:  'Playfair Display', Georgia, serif;
    --font-b:  'DM Sans', system-ui, sans-serif;
  }

  html{scroll-behavior:smooth}
  body{
    background:var(--ivory);
    color:var(--text);
    font-family:var(--font-b);
    font-weight:400;
    -webkit-font-smoothing:antialiased;
    overflow-x:hidden;
  }

  ::-webkit-scrollbar{width:5px}
  ::-webkit-scrollbar-track{background:var(--ivory3)}
  ::-webkit-scrollbar-thumb{background:linear-gradient(var(--rose),var(--saffron));border-radius:3px}

  button{font-family:var(--font-b);cursor:pointer}
  img{display:block}
  input,select,textarea{font-family:var(--font-b)}

  @keyframes spin    {to{transform:rotate(360deg)}}
  @keyframes fadeUp  {from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideIn {from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
  @keyframes marquee {from{transform:translateX(0)}to{transform:translateX(-50%)}}
  @keyframes float   {0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
  @keyframes glow    {0%,100%{box-shadow:0 0 20px rgba(194,24,91,0.3)}50%{box-shadow:0 0 40px rgba(194,24,91,0.6)}}
  @keyframes shimmer {0%{background-position:-200% center}100%{background-position:200% center}}
  @keyframes scaleIn {from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}

  .u1{animation:fadeUp .65s cubic-bezier(.16,1,.3,1) both}
  .u2{animation:fadeUp .65s .1s cubic-bezier(.16,1,.3,1) both}
  .u3{animation:fadeUp .65s .2s cubic-bezier(.16,1,.3,1) both}
  .u4{animation:fadeUp .65s .3s cubic-bezier(.16,1,.3,1) both}
  .u5{animation:fadeUp .65s .4s cubic-bezier(.16,1,.3,1) both}

  .rose-text{
    background:linear-gradient(135deg,var(--rose),var(--saffron));
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text
  }
  .gold-text{
    background:linear-gradient(135deg,var(--gold),var(--saffron));
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text
  }

  /* ── Buttons ── */
  .btn{border:none;border-radius:14px;font-weight:600;cursor:pointer;transition:all .25s cubic-bezier(.34,1.56,.64,1);position:relative;overflow:hidden;font-family:var(--font-b)}
  .btn::after{content:'';position:absolute;inset:0;background:rgba(255,255,255,0);transition:background .2s}
  .btn:hover::after{background:rgba(255,255,255,0.12)}

  .btn-rose{background:linear-gradient(135deg,var(--rose),var(--rose2));color:#fff;box-shadow:0 4px 20px rgba(194,24,91,0.35)}
  .btn-rose:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(194,24,91,0.45)}

  .btn-saffron{background:linear-gradient(135deg,var(--saffron),var(--gold));color:#fff;box-shadow:0 4px 20px rgba(230,81,0,0.3)}
  .btn-saffron:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(230,81,0,0.4)}

  .btn-outline{background:transparent;color:var(--rose);border:2px solid var(--rose)}
  .btn-outline:hover{background:var(--rose);color:#fff;transform:translateY(-2px)}

  .btn-ghost{background:rgba(255,255,255,0.9);color:var(--text);border:1.5px solid var(--border2)}
  .btn-ghost:hover{background:#fff;border-color:var(--rose);color:var(--rose);transform:translateY(-2px)}

  .btn-dark{background:var(--dark);color:#fff}
  .btn-dark:hover{background:var(--dark2);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.3)}

  /* ── Cards ── */
  .card-base{background:var(--white);border-radius:20px;border:1.5px solid var(--border);transition:all .35s cubic-bezier(.25,.46,.45,.94)}
  .card-hover:hover{transform:translateY(-8px);box-shadow:0 20px 60px rgba(26,10,0,0.15);border-color:var(--rose)}

  /* ── Tag/badge ── */
  .tag{display:inline-flex;align-items:center;gap:5px;padding:5px 13px;border-radius:99px;font-size:11px;font-weight:700;letter-spacing:.3px}

  input:focus,select:focus,textarea:focus{outline:none!important;border-color:var(--rose)!important;box-shadow:0 0 0 3px rgba(194,24,91,0.12)!important}
`;

/* ── Helpers ─────────────────────────────────────────────────────────────────── */
const fmt = n => `₹${Number(n).toLocaleString("en-IN")}`;
const disc = (o, c) => o ? Math.round((1 - c / o) * 100) : 0;
const thumb = p => p?.images?.[0]?.url || `https://placehold.co/600x800/FDF8F3/C2185B?text=${encodeURIComponent(p?.name || "Style")}`;

const COLORS_MAP = {
  "Ivory White":"#F5F0E8","Midnight Black":"#1a1a1a","Dusty Rose":"#D4A5A0",
  "Forest Green":"#2D5A3D","Royal Blue":"#2C4A7C","Saffron":"#E8890C",
  "Maroon":"#6B1F1F","Sage":"#6B7C5C","Gold":"#C9A96E"
};
// ── Dynamic category config (admin-editable, persisted to localStorage) ──────
const DEFAULT_CAT_CONFIG = {
  "Kurtas & Sets":  {icon:"👘", grad:"linear-gradient(135deg,#C2185B,#E91E8C)", light:"#FCE4EC", subs:["Anarkali","Straight Cut","Palazzo Set","Co-ord Set"]},
  "Sarees":         {icon:"🥻", grad:"linear-gradient(135deg,#6A1B9A,#AB47BC)", light:"#F3E5F5", subs:["Banarasi","Silk","Cotton","Chiffon","Designer"]},
  "Lehengas":       {icon:"💃", grad:"linear-gradient(135deg,#E65100,#F9A825)", light:"#FFF3E0", subs:["Bridal","Party Wear","Kids","Festive"]},
  "Western Wear":   {icon:"👗", grad:"linear-gradient(135deg,#00695C,#26A69A)", light:"#E0F2F1", subs:["Tops","Dresses","Jeans","Co-ords"]},
  "Accessories":    {icon:"📿", grad:"linear-gradient(135deg,#1565C0,#42A5F5)", light:"#E3F2FD", subs:["Dupattas","Stoles","Belts","Hair Accessories"]},
  "Men's Wear":    {icon:"🤵", grad:"linear-gradient(135deg,#2E7D32,#66BB6A)", light:"#E8F5E9", subs:["Kurtas","Sherwanis","Nehru Jackets","Casual"]},
  "Bags":           {icon:"👜", grad:"linear-gradient(135deg,#BF360C,#FF7043)", light:"#FBE9E7", subs:["Clutches","Tote Bags","Potli Bags","Sling Bags","Backpacks"]},
  "Fancy Jewelry":  {icon:"💎", grad:"linear-gradient(135deg,#880E4F,#F06292)", light:"#FCE4EC", subs:["Necklaces","Earrings","Bangles","Rings","Maang Tikka","Anklets"]},
};

const CAT_STORAGE_KEY = "bv_categories_v2";

const loadCatConfig = () => {
  try {
    const saved = localStorage.getItem(CAT_STORAGE_KEY);
    return saved ? { ...DEFAULT_CAT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CAT_CONFIG;
  } catch { return DEFAULT_CAT_CONFIG; }
};

const saveCatConfig = (cfg) => {
  try { localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(cfg)); } catch {}
};

// Singleton – updated by admin, triggers re-render via useCatConfig hook
let _globalCatConfig = loadCatConfig();
let _catListeners = [];
const subscribeCat = (fn) => { _catListeners.push(fn); return () => { _catListeners = _catListeners.filter(f => f !== fn); }; };
const updateGlobalCat = (cfg) => { _globalCatConfig = cfg; saveCatConfig(cfg); _catListeners.forEach(fn => fn(cfg)); };

const useCatConfig = () => {
  const [cfg, setCfg] = useState(_globalCatConfig);
  useEffect(() => subscribeCat(setCfg), []);
  return cfg;
};

// Static references for components that don't need reactivity
const CAT = _globalCatConfig;
const CATEGORIES = ["All", ...Object.keys(_globalCatConfig)];

// ── Editable content store (promo banner + about page) ───────────────────────
const DEFAULT_PROMO = {
  tag:"⏰ Limited Time",
  heading:"Bridal Season",
  subheading:"Up to 30% Off",
  body:"Use code",
  code:"BRIDAL30",
  codeDesc:"on all lehengas, sarees & jewellery sets.",
  btnLabel:"Shop Now",
  active:true,
};

const DEFAULT_ABOUT = {
  heroLabel:"Our Story",
  heroHeading:"Rooted in Heritage.",
  heroHeadingAccent:"Styled for Today.",
  heroBody:"BanyanVision bridges India's master artisans with modern wardrobes. Every piece carries centuries of craft tradition.",
  missionLabel:"Mission",
  missionHeading:"Why We Exist",
  missionP1:"Every piece on BanyanVision is handpicked from verified artisans — from Varanasi's silk lanes to Rajasthan's block-print studios.",
  missionP2:"When you shop with us, you sustain centuries-old craft traditions and support skilled artisan communities across India.",
  emoji:"🌿",
  features:[
    {icon:"🎨",title:"Authentic",desc:"Verified Indian artisans"},
    {icon:"🌱",title:"Sustainable",desc:"Eco-conscious packaging"},
    {icon:"⚡",title:"Fast Delivery",desc:"3–7 business days"},
    {icon:"💝",title:"Guaranteed",desc:"30-day return policy"},
  ],
};

const PROMO_KEY  = "bv_promo_v1";
const ABOUT_KEY  = "bv_about_v1";

const loadJSON = (key, def) => { try { const s=localStorage.getItem(key); return s?{...def,...JSON.parse(s)}:def; } catch { return def; } };
const saveJSON = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

let _promoData  = loadJSON(PROMO_KEY,  DEFAULT_PROMO);
let _aboutData  = loadJSON(ABOUT_KEY,  DEFAULT_ABOUT);
let _promoListeners = [];
let _aboutListeners = [];

const subscribePromo = fn => { _promoListeners.push(fn); return ()=>{ _promoListeners=_promoListeners.filter(f=>f!==fn); }; };
const subscribeAbout = fn => { _aboutListeners.push(fn); return ()=>{ _aboutListeners=_aboutListeners.filter(f=>f!==fn); }; };
const updatePromo = v => { _promoData=v; saveJSON(PROMO_KEY,v); _promoListeners.forEach(f=>f(v)); };
const updateAbout = v => { _aboutData=v; saveJSON(ABOUT_KEY,v); _aboutListeners.forEach(f=>f(v)); };

const usePromoData = () => { const [d,setD]=useState(_promoData); useEffect(()=>subscribePromo(setD),[]); return d; };
const useAboutData = () => { const [d,setD]=useState(_aboutData); useEffect(()=>subscribeAbout(setD),[]); return d; };


/* ── Stars ───────────────────────────────────────────────────────────────────── */
const Stars = ({ rating, size=13, interactive=false, onRate }) => {
  const [hov, setHov] = useState(0);
  return (
    <span style={{display:"inline-flex",gap:2}}>
      {[1,2,3,4,5].map(s => (
        <span key={s}
          onMouseEnter={()=>interactive&&setHov(s)}
          onMouseLeave={()=>interactive&&setHov(0)}
          onClick={()=>interactive&&onRate?.(s)}
          style={{fontSize:size,color:s<=(hov||rating)?"#F9A825":"#DDD",cursor:interactive?"pointer":"default",transition:"all .15s",transform:interactive&&hov===s?"scale(1.3)":"scale(1)",display:"inline-block"}}>★</span>
      ))}
    </span>
  );
};

/* ── Toast ───────────────────────────────────────────────────────────────────── */
const ToastBox = ({ toasts }) => (
  <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,display:"flex",flexDirection:"column",gap:8,pointerEvents:"none"}}>
    {toasts.map(t => (
      <div key={t.id} style={{
        padding:"13px 18px",borderRadius:"14px",fontSize:13,fontWeight:600,minWidth:240,
        background:"#fff",borderLeft:`4px solid ${t.type==="error"?"#EF4444":"var(--rose)"}`,
        color:t.type==="error"?"#B91C1C":"var(--text)",
        boxShadow:"0 8px 32px rgba(0,0,0,0.14)",
        animation:"scaleIn .3s cubic-bezier(.34,1.56,.64,1) both"
      }}>{t.message}</div>
    ))}
  </div>
);

/* ── Spinner ─────────────────────────────────────────────────────────────────── */
const Spinner = () => (
  <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:60,flexDirection:"column",gap:14}}>
    <div style={{width:40,height:40,border:"3px solid var(--border)",borderTop:"3px solid var(--rose)",borderRight:"3px solid var(--saffron)",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
    <span style={{fontSize:13,color:"var(--muted)",fontWeight:500}}>Loading…</span>
  </div>
);

/* ── Section Label ───────────────────────────────────────────────────────────── */
const SecLabel = ({ children }) => (
  <div style={{display:"inline-flex",alignItems:"center",gap:8,marginBottom:10}}>
    <div style={{width:28,height:2,background:"linear-gradient(90deg,var(--rose),var(--saffron))",borderRadius:2}}/>
    <span style={{fontSize:11,fontWeight:700,letterSpacing:2.5,color:"var(--rose)",textTransform:"uppercase"}}>{children}</span>
    <div style={{width:28,height:2,background:"linear-gradient(90deg,var(--saffron),var(--rose))",borderRadius:2}}/>
  </div>
);

/* ── Image Uploader ──────────────────────────────────────────────────────────── */
const ImageUploader = ({ existingImages=[], onFilesChange, onDeleteExisting }) => {
  const [previews,setPreviews]=useState([]);
  const [files,setFiles]=useState([]);
  const ref=useRef();
  const pick = e => {
    const sel=Array.from(e.target.files);
    if(existingImages.length+previews.length+sel.length>6){alert("Max 6");return;}
    setPreviews(p=>[...p,...sel.map(f=>({url:URL.createObjectURL(f)}))]);
    const nf=[...files,...sel];setFiles(nf);onFilesChange(nf);
  };
  const rem = i => {
    const nf=files.filter((_,j)=>j!==i);
    setPreviews(p=>p.filter((_,j)=>j!==i));
    setFiles(nf);onFilesChange(nf);
  };
  const tot=existingImages.length+previews.length;
  return (
    <div>
      <div style={{fontSize:12,fontWeight:700,color:"var(--rose)",marginBottom:10}}>Images ({tot}/6)</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        {existingImages.map((img,i)=>(
          <div key={i} style={{position:"relative",aspectRatio:"3/4",borderRadius:10,overflow:"hidden"}}>
            <img src={img.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            <button onClick={()=>onDeleteExisting?.(img.public_id)} style={{position:"absolute",top:5,right:5,background:"rgba(239,68,68,.9)",border:"none",color:"#fff",width:24,height:24,fontSize:14,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,105,92,.85)",fontSize:9,color:"#fff",padding:"3px 0",textAlign:"center",fontWeight:700,letterSpacing:1}}>SAVED</div>
          </div>
        ))}
        {previews.map((p,i)=>(
          <div key={i} style={{position:"relative",aspectRatio:"3/4",borderRadius:10,overflow:"hidden"}}>
            <img src={p.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            <button onClick={()=>rem(i)} style={{position:"absolute",top:5,right:5,background:"rgba(239,68,68,.9)",border:"none",color:"#fff",width:24,height:24,fontSize:14,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(194,24,91,.85)",fontSize:9,color:"#fff",padding:"3px 0",textAlign:"center",fontWeight:700,letterSpacing:1}}>NEW</div>
          </div>
        ))}
        {tot<6&&(
          <button onClick={()=>ref.current?.click()} style={{aspectRatio:"3/4",borderRadius:10,background:"var(--ivory2)",border:"2px dashed var(--rose)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"var(--rose)",gap:6,transition:"all .2s"}}>
            <span style={{fontSize:26}}>+</span>
            <span style={{fontSize:10,fontWeight:700}}>Add Photo</span>
          </button>
        )}
      </div>
      <input ref={ref} type="file" multiple accept="image/*" onChange={pick} style={{display:"none"}}/>
    </div>
  );
};

/* ── Product Gallery ─────────────────────────────────────────────────────────── */
const Gallery = ({ images, name }) => {
  const [active,setActive]=useState(0);
  const {isMobile}=useBreakpoint();
  if(!images?.length) return <div style={{background:"var(--ivory3)",borderRadius:"20px",height:isMobile?280:520,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)",fontSize:13}}>No images</div>;
  return (
    <div>
      <div style={{borderRadius:"20px",overflow:"hidden",position:"relative",background:"var(--ivory3)"}}>
        <img src={images[active]?.url} alt={name} style={{width:"100%",height:isMobile?310:530,objectFit:"cover",display:"block",transition:"opacity .3s"}}/>
        {images.length>1&&(
          <>
            <button onClick={()=>setActive(a=>Math.max(0,a-1))} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,.9)",border:"none",borderRadius:"50%",width:40,height:40,fontSize:20,boxShadow:"0 2px 12px rgba(0,0,0,.12)",color:"var(--rose)"}}>‹</button>
            <button onClick={()=>setActive(a=>Math.min(images.length-1,a+1))} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,.9)",border:"none",borderRadius:"50%",width:40,height:40,fontSize:20,boxShadow:"0 2px 12px rgba(0,0,0,.12)",color:"var(--rose)"}}>›</button>
            <div style={{position:"absolute",bottom:14,right:16,background:"rgba(26,10,0,.55)",color:"#fff",borderRadius:99,padding:"3px 10px",fontSize:11,fontWeight:700,backdropFilter:"blur(8px)"}}>{active+1}/{images.length}</div>
          </>
        )}
      </div>
      {images.length>1&&(
        <div style={{display:"flex",gap:8,marginTop:10}}>
          {images.map((img,i)=>(
            <img key={i} src={img.url} alt="" onClick={()=>setActive(i)}
              style={{width:70,height:84,objectFit:"cover",borderRadius:10,cursor:"pointer",border:`2.5px solid ${active===i?"var(--rose)":"transparent"}`,opacity:active===i?1:.55,transition:"all .2s"}}/>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Product Card ────────────────────────────────────────────────────────────── */
const ProductCard = ({ p, setPage, toast }) => {
  const {isMobile}=useBreakpoint();
  const {addToCart}=useCart();
  const catCfg=useCatConfig();
  const [hov,setHov]=useState(false);
  const [imgIdx,setImgIdx]=useState(0);
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
        <div onClick={()=>setPage(`product-${p._id}`)} style={{overflow:"hidden",height:isMobile?210:270}}>
          <img src={imgs[imgIdx]?.url||`https://placehold.co/600x800/${cfg.light.replace("#","")}/C2185B?text=${encodeURIComponent(p.name)}`} alt={p.name}
            style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform .6s cubic-bezier(.25,.46,.45,.94)",transform:hov?"scale(1.07)":"scale(1)"}}/>
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
                <button onClick={()=>go("admin")} style={{background:"var(--purpleL)",border:"none",padding:"7px 16px",borderRadius:10,fontSize:12,fontWeight:700,color:"var(--purple)",marginLeft:8}}>⚙ Admin</button>
              )}
            </nav>
          )}

          {/* Actions */}
          <div style={{display:"flex",alignItems:"center",gap:isMobile?4:8}}>
            {!isMobile&&(
              <button onClick={()=>go("wishlist")} title="Wishlist" style={{background:"none",border:"none",fontSize:20,padding:8,lineHeight:1,color:"var(--muted)",transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.color="var(--rose)";e.currentTarget.style.transform="scale(1.15)";}}
                onMouseLeave={e=>{e.currentTarget.style.color="var(--muted)";e.currentTarget.style.transform="scale(1)";}}>♡</button>
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
                    {[["👤","Profile","profile"],["📦","My Orders","orders"],["♡","Wishlist","wishlist"]].map(([icon,l,p])=>(
                      <button key={p} onClick={()=>go(p)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px 16px",background:"none",border:"none",borderBottom:"1px solid var(--border)",fontSize:13,color:"var(--text2)",cursor:"pointer",textAlign:"left",fontWeight:500,transition:"all .15s"}}
                        onMouseEnter={e=>{e.currentTarget.style.background="var(--roseL)";e.currentTarget.style.color="var(--rose)";}}
                        onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color="var(--text2)";}}>
                        <span style={{fontSize:15}}>{icon}</span>{l}
                      </button>
                    ))}
                    {user.role==="admin"&&<button onClick={()=>go("admin")} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px 16px",background:"none",border:"none",borderBottom:"1px solid var(--border)",fontSize:13,color:"var(--purple)",fontWeight:700,cursor:"pointer"}}>⚙ Admin Panel</button>}
                    <button onClick={()=>{logout();go("home");}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px 16px",background:"none",border:"none",fontSize:13,color:"#EF4444",fontWeight:600,cursor:"pointer"}}>↩ Sign Out</button>
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
            {[["🏠","Home","home"],["👗","Collections","shop"],["ℹ️","About","about"],["♡","Wishlist","wishlist"],["📦","Orders","orders"]].map(([icon,l,p])=>(
              <button key={p} onClick={()=>go(p)} style={{display:"flex",alignItems:"center",gap:12,width:"100%",textAlign:"left",padding:"13px 20px",background:page===p?"var(--roseL)":"none",border:"none",fontSize:13,fontWeight:600,color:page===p?"var(--rose)":"var(--text2)",borderBottom:"1px solid var(--border)"}}>
                {icon} {l}
              </button>
            ))}
          </div>
        )}
      </header>
    </>
  );
};

/* ── HOME ────────────────────────────────────────────────────────────────────── */
const HomePage = ({ setPage, toast }) => {
  const {isMobile}=useBreakpoint();
  const catCfg=useCatConfig();
  const promo=usePromoData();
  const [featured,setFeatured]=useState([]);
  const [trending,setTrending]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    Promise.all([apiGetProducts({featured:true,limit:4}),apiGetProducts({trending:true,limit:4})])
      .then(([f,t])=>{setFeatured(f.data.products);setTrending(t.data.products);})
      .catch(console.error).finally(()=>setLoading(false));
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
              {[["12K+","Curated Styles"],["98%","Happy Clients"],["25+","Artisans"],["Free","Easy Returns"]].map(([v,l])=>(
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
                    ?<img src={p.images[0].url} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
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

      {/* ─ CRAFT STRIP ─ */}
      <div style={{background:"linear-gradient(90deg,var(--rose),var(--saffron),var(--purple),var(--rose))",backgroundSize:"300% 100%",animation:"shimmer 6s linear infinite",padding:"13px 0",overflow:"hidden"}}>
        <div style={{display:"flex",animation:"marquee 26s linear infinite",whiteSpace:"nowrap",width:"max-content"}}>
          {Array(8).fill("✦ BANARASI SILK   ✦  BLOCK PRINT   ✦  HAND EMBROIDERY   ✦  ZARDOZI   ✦  PATOLA   ✦  KUNDAN   ✦  MIRROR WORK   ✦  KALAMKARI   ").map((t,i)=>(
            <span key={i} style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.9)",paddingRight:40,letterSpacing:2}}>{t}</span>
          ))}
        </div>
      </div>

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
            {[["🎨","Authentic","Verified Indian artisans only","var(--roseL)"],["🌱","Sustainable","Eco-conscious packaging","var(--tealL)"],["⚡","Fast Delivery","3–7 business days","var(--saffronL)"],["💝","Free Returns","30-day easy returns","var(--purpleL)"]].map(([icon,t,d,bg],i)=>(
              <div key={t} style={{padding:isMobile?"24px 16px":"40px 28px",textAlign:"center",background:isMobile?bg:"var(--cream)",transition:"background .2s"}}
                onMouseEnter={e=>e.currentTarget.style.background=bg}
                onMouseLeave={e=>e.currentTarget.style.background=isMobile?bg:"var(--cream)"}>
                <div style={{fontSize:isMobile?32:42,marginBottom:14}}>{icon}</div>
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

/* ── SHOP PAGE ───────────────────────────────────────────────────────────────── */
const ShopPage = ({ setPage, toast }) => {
  const {isMobile}=useBreakpoint();
  const catCfg=useCatConfig();
  const [prods,setProds]=useState([]);
  const [total,setTotal]=useState(0);
  const [loading,setLoading]=useState(true);
  const [cat,setCat]=useState("All");
  const [sort,setSort]=useState("newest");
  const [search,setSearch]=useState("");
  const [maxPrice,setMaxPrice]=useState(25000);
  const [showF,setShowF]=useState(false);

  useEffect(()=>{
    setLoading(true);
    const p={sort,limit:20};
    if(cat!=="All")p.category=cat;
    if(search)p.search=search;
    if(maxPrice<25000)p.maxPrice=maxPrice;
    apiGetProducts(p).then(r=>{setProds(r.data.products);setTotal(r.data.total);}).catch(console.error).finally(()=>setLoading(false));
  },[cat,sort,search,maxPrice]);

  const iStyle={background:"#fff",border:"1.5px solid var(--border2)",color:"var(--text)",padding:"11px 16px",fontSize:13,borderRadius:12,outline:"none",width:"100%",fontWeight:500};

  return (
    <div style={{background:"var(--ivory)",minHeight:"100vh"}}>
      <div style={{background:"linear-gradient(160deg,var(--roseL) 0%,var(--saffronL) 50%,var(--ivory) 100%)",borderBottom:"1.5px solid var(--border)",padding:isMobile?"36px 20px 28px":"52px 80px 36px"}}>
        <div style={{maxWidth:1440,margin:"0 auto"}}>
          <SecLabel>Shop</SecLabel>
          <h1 style={{fontFamily:"var(--font-d)",fontSize:isMobile?32:56,fontWeight:700,color:"var(--dark)",marginTop:8,letterSpacing:-.5}}>All <span className="rose-text">Collections</span></h1>
          <p style={{color:"var(--muted)",marginTop:8,fontSize:13,fontWeight:500}}>{total} styles available</p>
        </div>
      </div>

      <div style={{maxWidth:1440,margin:"0 auto",padding:isMobile?"20px":"28px 80px"}}>
        <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:150,position:"relative"}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--muted)",fontSize:16}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search styles, fabrics…" style={{...iStyle,paddingLeft:40}}/>
          </div>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{...iStyle,width:"auto"}}>
            <option value="newest">Newest</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
            <option value="rating">Top Rated</option>
          </select>
          <button onClick={()=>setShowF(!showF)} style={{background:showF?"linear-gradient(135deg,var(--rose),var(--saffron))":"#fff",color:showF?"#fff":"var(--rose)",border:"1.5px solid var(--rose)",padding:"11px 18px",borderRadius:12,fontSize:13,fontWeight:700,transition:"all .2s"}}>
            ⊞ Filter
          </button>
        </div>

        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
          {["All",...Object.keys(catCfg)].map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{padding:"8px 18px",borderRadius:99,border:`1.5px solid ${cat===c?"var(--rose)":"var(--border2)"}`,background:cat===c?"linear-gradient(135deg,var(--rose),var(--saffron))":"#fff",color:cat===c?"#fff":"var(--text2)",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .2s",boxShadow:cat===c?"0 4px 16px rgba(194,24,91,.3)":"none",whiteSpace:"nowrap"}}>
              {c}
            </button>
          ))}
        </div>

        {showF&&(
          <div style={{padding:"16px 20px",borderRadius:"14px",background:"#fff",marginBottom:12,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap",border:"1.5px solid var(--border)"}}>
            <span style={{fontSize:13,fontWeight:700,color:"var(--rose)",whiteSpace:"nowrap"}}>Max: {fmt(maxPrice)}</span>
            <input type="range" min={500} max={25000} step={500} value={maxPrice} onChange={e=>setMaxPrice(Number(e.target.value))} style={{flex:1,accentColor:"var(--rose)",minWidth:100}}/>
            <span style={{fontSize:12,color:"var(--muted)",fontWeight:500}}>₹25,000</span>
          </div>
        )}

        {loading?<Spinner/>:prods.length===0?(
          <div style={{textAlign:"center",padding:"80px 0"}}>
            <div style={{fontSize:60,marginBottom:16}}>🔍</div>
            <div style={{fontFamily:"var(--font-d)",fontSize:22,color:"var(--muted)"}}>No results found</div>
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:isMobile?10:20}}>
            {prods.map(p=><ProductCard key={p._id} p={p} setPage={setPage} toast={toast}/>)}
          </div>
        )}
      </div>
    </div>
  );
};

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
              {data.trending&&<span className="tag" style={{background:"var(--saffronL)",color:"var(--saffron)"}}>🔥 Trending</span>}
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
                {wished?"♥":"♡"}
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
                    👍 Helpful ({r.helpful})
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
            {[["🚚","Standard Delivery","3–5 business days","Free above ₹2000 · ₹99 otherwise"],["⚡","Express","1–2 business days","₹199"],["🔄","Free Returns","Within 7 days","Free pickup from door"],["🔒","Secure Payment","Razorpay","UPI · Cards · EMI · NetBanking"]].map(([icon,t,sub,val])=>(
              <div key={t} style={{display:"flex",gap:16,padding:"18px 0",borderBottom:"1.5px solid var(--border)",alignItems:"flex-start"}}>
                <div style={{width:46,height:46,background:"var(--roseL)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{icon}</div>
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

/* ── CART ────────────────────────────────────────────────────────────────────── */
const CartPage = ({ setPage, toast }) => {
  const {isMobile}=useBreakpoint();
  const {user}=useAuth();
  const {cart,updateCart,removeFromCart,subtotal,discountAmt,shipping,total,couponCode,setCouponCode,couponInfo,setCouponInfo}=useCart();
  const [cMsg,setCMsg]=useState("");

  const applyCoupon=async()=>{
    try{const r=await apiValidateCoupon(couponCode);setCouponInfo(r.data.coupon);toast(`✓ ${r.data.coupon.desc}`);setCMsg("");}
    catch(err){setCMsg(err.response?.data?.message||"Invalid coupon");setCouponInfo(null);}
  };

  const iStyle={background:"#fff",border:"1.5px solid var(--border2)",color:"var(--text)",padding:"10px 14px",fontSize:13,borderRadius:10,outline:"none",fontWeight:500};

  if(cart.length===0)return(
    <div style={{minHeight:"70vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,var(--roseL),var(--saffronL))",flexDirection:"column",gap:18}}>
      <div style={{fontFamily:"var(--font-d)",fontSize:64,color:"var(--border2)"}}>∅</div>
      <h2 style={{fontFamily:"var(--font-d)",color:"var(--dark)",fontSize:32,fontWeight:700}}>Your bag is empty</h2>
      <p style={{color:"var(--muted)",fontSize:14}}>Discover beautiful Indian fashion.</p>
      <button className="btn btn-rose" onClick={()=>setPage("shop")} style={{padding:"13px 32px",fontSize:14}}>Browse Collections</button>
    </div>
  );

  const Summary=()=>(
    <div style={{background:"#fff",borderRadius:"20px",border:"1.5px solid var(--border)",padding:isMobile?18:24,boxShadow:"0 4px 24px rgba(194,24,91,0.08)"}}>
      <h3 style={{fontFamily:"var(--font-d)",color:"var(--dark)",margin:"0 0 18px",fontSize:20,fontWeight:700}}>Order Summary</h3>
      {[["Subtotal",fmt(subtotal)],discountAmt>0?["Discount",`−${fmt(discountAmt)}`]:null,["Delivery",shipping===0?"FREE":fmt(shipping)]].filter(Boolean).map(([k,v])=>(
        <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:10,fontSize:13,color:k==="Discount"?"#16A34A":"var(--text2)",fontWeight:k==="Discount"?700:400}}><span>{k}</span><span>{v}</span></div>
      ))}
      {shipping>0&&<div style={{fontSize:11,color:"var(--saffron)",marginBottom:12,padding:"8px 12px",background:"var(--saffronL)",borderRadius:8,fontWeight:600}}>Add {fmt(2000-(subtotal-discountAmt))} more for FREE delivery</div>}
      <div style={{marginBottom:14}}>
        <div style={{display:"flex",gap:8,marginBottom:6}}>
          <input value={couponCode} onChange={e=>setCouponCode(e.target.value.toUpperCase())} placeholder="COUPON CODE" style={{...iStyle,flex:1,fontFamily:"monospace",fontWeight:700,letterSpacing:1}}/>
          <button className="btn btn-saffron" onClick={applyCoupon} style={{padding:"10px 14px",fontSize:12}}>Apply</button>
        </div>
        {couponInfo&&<div style={{fontSize:12,color:"#16A34A",fontWeight:700}}>✓ {couponInfo.desc}</div>}
        {cMsg&&<div style={{fontSize:12,color:"#DC2626",fontWeight:700}}>{cMsg}</div>}
        <div style={{fontSize:10,color:"var(--muted)",marginTop:5,letterSpacing:.3}}>Try: BANYAN10 · WELCOME20 · FLAT500</div>
      </div>
      <div style={{borderTop:"1.5px solid var(--border)",paddingTop:14,display:"flex",justifyContent:"space-between",fontFamily:"var(--font-d)",fontSize:24,fontWeight:700,marginBottom:16,color:"var(--dark)"}}>
        <span>Total</span>
        <span style={{background:"linear-gradient(135deg,var(--rose),var(--saffron))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{fmt(total)}</span>
      </div>
      <button className="btn btn-rose" onClick={()=>{if(!user){setPage("login");return;}setPage("checkout");}} style={{width:"100%",padding:"15px 0",fontSize:14,marginBottom:10}}>
        {user?"Proceed to Checkout →":"Login to Checkout"}
      </button>
      <div style={{textAlign:"center",fontSize:11,color:"var(--muted)",fontWeight:600,letterSpacing:.5}}>🔒 Secured by Razorpay</div>
    </div>
  );

  return(
    <div style={{background:"var(--ivory)",minHeight:"100vh",padding:isMobile?"20px 16px":"44px 80px"}}>
      <div style={{maxWidth:1100,margin:"0 auto"}}>
        <h1 style={{fontFamily:"var(--font-d)",color:"var(--dark)",fontSize:isMobile?28:44,fontWeight:700,marginBottom:24}}>Shopping Bag <span style={{fontSize:18,color:"var(--muted)",fontFamily:"var(--font-b)",fontWeight:500}}>({cart.length})</span></h1>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 340px",gap:18,alignItems:"start"}}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {cart.map(item=>(
              <div key={`${item._id}-${item.size}-${item.color}`} style={{background:"#fff",borderRadius:"20px",border:"1.5px solid var(--border)",padding:isMobile?14:20,display:"flex",gap:isMobile?12:16,alignItems:"flex-start",boxShadow:"0 4px 24px rgba(194,24,91,0.08)"}}>
                <img src={thumb(item)} alt={item.name} style={{width:isMobile?72:90,height:isMobile?88:110,objectFit:"cover",borderRadius:12,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:10,fontWeight:700,background:`linear-gradient(135deg,var(--rose),var(--saffron))`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:3,letterSpacing:.5}}>{item.category}</div>
                  <div style={{fontFamily:"var(--font-d)",fontWeight:700,color:"var(--text)",fontSize:isMobile?14:16,marginBottom:4,lineHeight:1.3}}>{item.name}</div>
                  <div style={{fontSize:11,color:"var(--muted)",marginBottom:10,fontWeight:500}}>{item.color} · {item.size}</div>
                  <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                    <div style={{display:"flex",alignItems:"center",border:"1.5px solid var(--border2)",borderRadius:10,overflow:"hidden"}}>
                      <button onClick={()=>updateCart(item._id,item.qty-1,item.size,item.color)} style={{width:34,height:34,background:"var(--ivory2)",border:"none",fontSize:18,fontWeight:700,color:"var(--rose)",cursor:"pointer"}}>−</button>
                      <span style={{padding:"0 14px",fontWeight:800,fontSize:14}}>{item.qty}</span>
                      <button onClick={()=>updateCart(item._id,item.qty+1,item.size,item.color)} style={{width:34,height:34,background:"var(--ivory2)",border:"none",fontSize:18,fontWeight:700,color:"var(--rose)",cursor:"pointer"}}>+</button>
                    </div>
                    <button onClick={()=>removeFromCart(item._id,item.size,item.color)} style={{fontSize:12,color:"#DC2626",background:"#FEF2F2",border:"none",cursor:"pointer",fontWeight:700,padding:"5px 12px",borderRadius:8}}>Remove</button>
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontFamily:"var(--font-d)",fontWeight:700,fontSize:isMobile?16:20,background:"linear-gradient(135deg,var(--rose),var(--saffron))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{fmt(item.price*item.qty)}</div>
                  <div style={{fontSize:11,color:"var(--muted)",fontWeight:500}}>{fmt(item.price)} each</div>
                </div>
              </div>
            ))}
            {isMobile&&<Summary/>}
          </div>
          {!isMobile&&<Summary/>}
        </div>
      </div>
    </div>
  );
};

/* ── CHECKOUT ────────────────────────────────────────────────────────────────── */
const CheckoutPage = ({ setPage, toast }) => {
  const {isMobile}=useBreakpoint();
  const {user}=useAuth();
  const {cart,subtotal,discountAmt,shipping,total,couponCode,clearCart}=useCart();
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({name:user?.name||"",email:user?.email||"",phone:user?.phone||"",address:user?.address||"",city:"",state:"",pin:""});
  const [errors,setErrors]=useState({});
  const [touched,setTouched]=useState({});
  const [processing,setProcessing]=useState(false);

  const REQUIRED={name:"Full Name",email:"Email",phone:"Phone",address:"Full Address",city:"City",state:"State",pin:"PIN Code"};

  const validate=()=>{
    const errs={};
    if(!form.name.trim())errs.name="Full Name is required";
    if(!form.email.trim())errs.email="Email is required";
    else if(!/^[^@]+@[^@]+\.[^@]+$/.test(form.email))errs.email="Enter a valid email";
    if(!form.phone.trim())errs.phone="Phone is required";
    else if(!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g,"")))errs.phone="Enter a valid 10-digit mobile number";
    if(!form.address.trim())errs.address="Address is required";
    if(!form.city.trim())errs.city="City is required";
    if(!form.state.trim())errs.state="State is required";
    if(!form.pin.trim())errs.pin="PIN Code is required";
    else if(!/^\d{6}$/.test(form.pin.trim()))errs.pin="Enter a valid 6-digit PIN";
    return errs;
  };

  const handleContinue=()=>{
    const errs=validate();
    setTouched(Object.keys(REQUIRED).reduce((a,k)=>({...a,[k]:true}),{}));
    if(Object.keys(errs).length>0){setErrors(errs);return;}
    setErrors({});
    setStep(2);
  };

  const loadRz=()=>new Promise(res=>{
    if(window.Razorpay){res(true);return;}
    const s=document.createElement("script");s.src="https://checkout.razorpay.com/v1/checkout.js";
    s.onload=()=>res(true);s.onerror=()=>res(false);document.body.appendChild(s);
  });

  const pay=async()=>{
    setProcessing(true);
    try{
      const ok=await loadRz();
      if(!ok){toast("Razorpay load failed","error");setProcessing(false);return;}
      const pr=await apiCreatePayment({total});
      const {orderId,amount,currency,keyId}=pr.data;
      const opts={
        key:keyId,amount,currency,name:"BanyanVision",order_id:orderId,
        handler:async res=>{
          try{
            const or=await apiCreateOrder({items:cart.map(i=>({product:i._id,name:i.name,image:thumb(i),price:i.price,qty:i.qty,size:i.size,color:i.color,category:i.category})),shippingAddress:{fullName:form.name,phone:form.phone,address:form.address,city:form.city,state:form.state,pin:form.pin},subtotal,discount:discountAmt,shipping,total,coupon:couponCode||null,paymentId:res.razorpay_payment_id,paymentOrderId:res.razorpay_order_id,paymentSignature:res.razorpay_signature});
            clearCart();setPage(`order-success-${or.data.order._id}`);
          }catch(err){toast(err.response?.data?.message||"Order failed","error");}
        },
        prefill:{name:form.name,email:form.email,contact:form.phone},
        theme:{color:"#C2185B"},
        modal:{ondismiss:()=>setProcessing(false)},
      };
      const rzp=new window.Razorpay(opts);
      rzp.on("payment.failed",()=>{toast("Payment failed","error");setProcessing(false);});
      rzp.open();
    }catch(err){toast(err.response?.data?.message||"Payment failed","error");setProcessing(false);}
  };

  const iStyle={background:"#fff",border:"1.5px solid var(--border2)",color:"var(--text)",padding:"12px 14px",fontSize:13,borderRadius:12,outline:"none",width:"100%",boxSizing:"border-box",fontWeight:500};

  return(
    <div style={{background:"var(--ivory)",minHeight:"100vh",padding:isMobile?"20px 16px":"44px 80px"}}>
      <div style={{maxWidth:900,margin:"0 auto"}}>
        <h1 style={{fontFamily:"var(--font-d)",color:"var(--dark)",fontSize:isMobile?28:44,fontWeight:700,marginBottom:24}}>Checkout</h1>
        {/* Steps */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
          {["Delivery Details","Review & Pay"].map((label,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,flex:i<1?1:"none"}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:i+1<=step?"linear-gradient(135deg,var(--rose),var(--saffron))":"#fff",border:`2px solid ${i+1<=step?"transparent":"var(--border2)"}`,color:i+1<=step?"#fff":"var(--muted)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,transition:"all .3s",boxShadow:i+1<=step?"0 4px 16px rgba(194,24,91,.3)":"none"}}>{i+1<step?"✓":i+1}</div>
              <span style={{fontSize:13,fontWeight:700,color:i+1===step?"var(--rose)":"var(--muted)",whiteSpace:"nowrap"}}>{label}</span>
              {i<1&&<div style={{flex:1,height:2,background:i+1<step?"linear-gradient(90deg,var(--rose),var(--saffron))":"var(--border)",borderRadius:2,marginLeft:8}}/>}
            </div>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 300px",gap:18,alignItems:"start"}}>
          <div style={{background:"#fff",borderRadius:"20px",border:"1.5px solid var(--border)",padding:isMobile?18:28,boxShadow:"0 4px 24px rgba(194,24,91,0.08)"}}>
            {step===1&&(
              <div>
                <h3 style={{fontFamily:"var(--font-d)",color:"var(--dark)",margin:"0 0 20px",fontSize:20,fontWeight:700}}>Delivery Address</h3>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
                  {[["Full Name","name"],["Email","email"],["Phone","phone"],["Full Address","address"],["City","city"],["State","state"],["PIN Code","pin"]].map(([label,key])=>(
                    <div key={key} style={{gridColumn:["name","address"].includes(key)&&!isMobile?"1/-1":"auto"}}>
                      <label style={{display:"block",fontSize:11,fontWeight:700,color:touched[key]&&errors[key]?"#DC2626":"var(--text2)",marginBottom:6,letterSpacing:.3}}>
                        {label} <span style={{color:"#DC2626"}}>*</span>
                      </label>
                      <input
                        value={form[key]}
                        onChange={e=>{setForm(f=>({...f,[key]:e.target.value}));if(touched[key])setErrors(er=>({...er,[key]:""}));}}
                        onBlur={()=>{setTouched(t=>({...t,[key]:true}));const errs=validate();setErrors(errs);}}
                        placeholder={label}
                        style={{...iStyle,borderColor:touched[key]&&errors[key]?"#DC2626":"var(--border2)",background:touched[key]&&errors[key]?"#FEF2F2":"#fff",boxShadow:touched[key]&&errors[key]?"0 0 0 3px rgba(220,38,38,0.1)":"none"}}
                      />
                      {touched[key]&&errors[key]&&(
                        <div style={{display:"flex",alignItems:"center",gap:4,marginTop:5,fontSize:11,color:"#DC2626",fontWeight:600}}>
                          <span>⚠</span><span>{errors[key]}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {step===2&&(
              <div>
                <h3 style={{fontFamily:"var(--font-d)",color:"var(--dark)",margin:"0 0 20px",fontSize:20,fontWeight:700}}>Review Order</h3>
                {cart.map((item,i)=>(
                  <div key={i} style={{display:"flex",gap:14,alignItems:"center",padding:"12px 0",borderBottom:"1px solid var(--border)"}}>
                    <img src={thumb(item)} alt={item.name} style={{width:52,height:64,objectFit:"cover",borderRadius:10}}/>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"var(--font-d)",fontWeight:700,color:"var(--text)",fontSize:14}}>{item.name}</div>
                      <div style={{fontSize:11,color:"var(--muted)",marginTop:2,fontWeight:500}}>{item.color} · {item.size} · Qty {item.qty}</div>
                    </div>
                    <div style={{fontFamily:"var(--font-d)",fontWeight:700,fontSize:15,background:"linear-gradient(135deg,var(--rose),var(--saffron))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{fmt(item.price*item.qty)}</div>
                  </div>
                ))}
                <div style={{marginTop:12,padding:"12px 14px",background:"var(--ivory2)",borderRadius:12,fontSize:12,color:"var(--text2)",lineHeight:1.7,fontWeight:500}}>
                  📍 {form.name} · {form.phone}<br/>{form.address}, {form.city}, {form.state} - {form.pin}
                </div>
                <div style={{marginTop:10,padding:"10px 14px",background:"var(--roseL)",borderRadius:12,fontSize:12,color:"var(--rose)",fontWeight:700}}>
                  🔒 Razorpay handles payment securely — your details are never stored.
                </div>
              </div>
            )}
            <div style={{display:"flex",gap:10,marginTop:22}}>
              {step>1&&<button className="btn btn-ghost" onClick={()=>setStep(1)} style={{flex:1,padding:"14px 0",fontSize:14}}>← Back</button>}
              <button onClick={step===2?pay:handleContinue} disabled={processing}
                style={{flex:2,padding:"15px 0",borderRadius:12,fontSize:14,fontWeight:700,border:"none",color:"#fff",background:step===2?"linear-gradient(135deg,#1565C0,#1976D2)":"linear-gradient(135deg,var(--rose),var(--saffron))",cursor:processing?"not-allowed":"pointer",opacity:processing?.75:1,boxShadow:step===2?"0 8px 24px rgba(21,101,192,.3)":"0 8px 24px rgba(194,24,91,.3)"}}>
                {processing?"Processing…":step===2?`🔒 Pay ${fmt(total)} via Razorpay`:"Continue →"}
              </button>
            </div>
          </div>
          {!isMobile&&(
            <div style={{background:"linear-gradient(160deg,var(--roseL),var(--saffronL))",borderRadius:"20px",border:"1.5px solid var(--border)",padding:22}}>
              <h4 style={{fontFamily:"var(--font-d)",color:"var(--dark)",margin:"0 0 16px",fontSize:18,fontWeight:700}}>Price Details</h4>
              {[["Subtotal",fmt(subtotal)],discountAmt>0?["Saving",`−${fmt(discountAmt)}`]:null,["Delivery",shipping===0?"FREE":fmt(shipping)]].filter(Boolean).map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:10,fontSize:13,color:k==="Saving"?"#16A34A":"var(--text2)",fontWeight:k==="Saving"?700:400}}><span>{k}</span><span>{v}</span></div>
              ))}
              <div style={{borderTop:"1.5px solid var(--border2)",paddingTop:14,display:"flex",justifyContent:"space-between",fontFamily:"var(--font-d)",fontSize:22,fontWeight:700}}>
                <span>Total</span>
                <span style={{background:"linear-gradient(135deg,var(--rose),var(--saffron))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{fmt(total)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── ORDER SUCCESS ───────────────────────────────────────────────────────────── */
const OrderSuccessPage = ({ orderId, setPage }) => {
  const [order,setOrder]=useState(null);
  useEffect(()=>{apiGetMyOrders().then(r=>{setOrder(r.data.orders.find(o=>o._id===orderId));}).catch(console.error);},[orderId]);
  return(
    <div style={{background:"linear-gradient(160deg,var(--roseL),var(--saffronL),var(--tealL))",minHeight:"80vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{textAlign:"center",maxWidth:480,width:"100%"}}>
        <div style={{width:90,height:90,borderRadius:"50%",background:"linear-gradient(135deg,var(--rose),var(--saffron))",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",fontSize:42,boxShadow:"0 12px 40px rgba(194,24,91,.35)",animation:"glow 2s ease-in-out infinite"}}>✓</div>
        <SecLabel>Order Confirmed</SecLabel>
        <h1 style={{fontFamily:"var(--font-d)",color:"var(--dark)",fontSize:44,fontWeight:700,marginTop:10}}>Thank You!</h1>
        {order&&(
          <div style={{padding:"18px 24px",margin:"20px 0",background:"#fff",borderRadius:"20px",border:"1.5px solid var(--border)",textAlign:"left",boxShadow:"0 4px 24px rgba(194,24,91,0.08)"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:12,fontWeight:700,color:"var(--muted)",letterSpacing:.5}}>ORDER #{order._id.slice(-8).toUpperCase()}</span>
              <span style={{fontFamily:"var(--font-d)",background:"linear-gradient(135deg,var(--rose),var(--saffron))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:700,fontSize:18}}>{fmt(order.total)}</span>
            </div>
            <div style={{fontSize:11,color:"var(--muted)",fontWeight:500}}>Payment ID: {order.paymentId}</div>
          </div>
        )}
        <p style={{color:"var(--text2)",fontSize:14,marginBottom:28,lineHeight:1.8,fontWeight:400}}>Payment verified. Your order is being lovingly prepared.</p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <button className="btn btn-rose" onClick={()=>setPage("orders")} style={{padding:"13px 28px",fontSize:14}}>Track Orders</button>
          <button className="btn btn-ghost" onClick={()=>setPage("shop")} style={{padding:"13px 28px",fontSize:14}}>Continue Shopping</button>
        </div>
      </div>
    </div>
  );
};

/* ── ORDERS ──────────────────────────────────────────────────────────────────── */
/* ── SHIPPING LABEL PRINT UTILITY ───────────────────────────────────────────── */
const printShippingLabel = (ord) => {
  const sa = ord.shippingAddress || {};
  const win = window.open("","_blank","width=420,height=580");
  win.document.write(`<!DOCTYPE html><html><head><title>Shipping Label</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Arial',sans-serif;background:#fff;padding:0;}
  .label{width:100mm;min-height:150mm;border:2px solid #000;padding:0;margin:0 auto;position:relative;}
  .header{background:#1A0A00;color:#fff;padding:10px 14px;display:flex;align-items:center;gap:10px;border-bottom:2px solid #000;}
  .logo-img{width:52px;height:52px;object-fit:contain;flex-shrink:0;}
  .brand{font-size:15px;font-weight:800;letter-spacing:.5px;}
  .brand-sub{font-size:8px;letter-spacing:2px;opacity:.6;text-transform:uppercase;}
  .section{padding:8px 14px;border-bottom:1px solid #ddd;}
  .label-sm{font-size:7px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#888;margin-bottom:3px;}
  .val{font-size:12px;font-weight:700;color:#111;line-height:1.4;}
  .val-lg{font-size:14px;font-weight:800;color:#000;line-height:1.4;}
  .order-id{font-family:monospace;font-size:18px;font-weight:800;letter-spacing:2px;color:#C2185B;}
  .items-table{width:100%;border-collapse:collapse;font-size:10px;}
  .items-table th{background:#f5f5f5;padding:4px 6px;text-align:left;font-size:8px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #ddd;}
  .items-table td{padding:4px 6px;border-bottom:1px dotted #eee;vertical-align:top;}
  .totals{display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;}
  .total-final{background:#1A0A00;color:#fff;display:flex;justify-content:space-between;padding:8px 14px;font-weight:800;font-size:13px;}
  .barcode{text-align:center;padding:8px;border-top:1px solid #ddd;}
  .barcode-bars{font-family:monospace;font-size:28px;letter-spacing:2px;color:#000;}
  .barcode-num{font-size:9px;letter-spacing:2px;color:#555;margin-top:2px;}
  .footer{text-align:center;padding:6px;font-size:8px;color:#888;border-top:1px solid #eee;}
  .badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;letter-spacing:.5px;}
  .fragile{border:1.5px solid #E65100;color:#E65100;}
  .handle{border:1.5px solid #2563EB;color:#2563EB;}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
</style></head><body>
<div class="label">
  <div class="header">
    <img class="logo-img" src="${window.location.origin}/bv.jpg" alt="BanyanVision"/>
    <div>
      <div class="brand">BanyanVision</div>
      <div class="brand-sub">Empowering Dreams, Inspiring Innovations</div>
    </div>
    <div style="margin-left:auto;text-align:right">
      <div style="font-size:8px;opacity:.6">ORDER</div>
      <div style="font-family:monospace;font-size:13px;font-weight:800;letter-spacing:1px">#${ord._id.slice(-8).toUpperCase()}</div>
    </div>
  </div>

  <div class="section" style="background:#fff9f0;">
    <div class="label-sm">📦 Ship To</div>
    <div class="val-lg">${sa.fullName||"—"}</div>
    <div class="val">${sa.address||""}</div>
    <div class="val">${sa.city||""}${sa.state?", "+sa.state:""} — ${sa.pin||""}</div>
    <div class="val" style="margin-top:4px">📱 ${sa.phone||"—"}</div>
  </div>

  <div class="section">
    <div class="label-sm">📤 Ship From</div>
    <div class="val" style="font-weight:700">BanyanVision</div>
    <div class="val">www.banyanvision.com</div>
  </div>

  <div class="section">
    <div class="label-sm">🛍 Items</div>
    <table class="items-table">
      <thead><tr><th>Item</th><th>Size</th><th>Qty</th><th>Price</th></tr></thead>
      <tbody>
        ${ord.items.map(it=>`<tr>
          <td>${it.name}</td>
          <td>${it.size||"—"}</td>
          <td style="text-align:center">${it.qty}</td>
          <td>₹${Number(it.price*it.qty).toLocaleString("en-IN")}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>

  ${ord.discount>0?`<div class="totals"><span>Subtotal</span><span>₹${Number(ord.subtotal).toLocaleString("en-IN")}</span></div>
  <div class="totals" style="color:green"><span>Discount</span><span>−₹${Number(ord.discount).toLocaleString("en-IN")}</span></div>`:""}
  <div class="totals"><span>Delivery</span><span>${ord.shipping===0?"FREE":"₹"+Number(ord.shipping).toLocaleString("en-IN")}</span></div>
  <div class="total-final"><span>TOTAL PAID</span><span>₹${Number(ord.total).toLocaleString("en-IN")}</span></div>

  <div class="barcode">
    <div class="label-sm" style="margin-bottom:4px">Scan / Order Ref</div>
    <div class="barcode-bars">||| || ||| | || |||</div>
    <div class="barcode-num">${ord._id.slice(-12).toUpperCase()}</div>
    <div style="margin-top:6px;display:flex;gap:6px;justify-content:center">
      <span class="badge fragile">⚠ FRAGILE</span>
      <span class="badge handle">☝ HANDLE WITH CARE</span>
    </div>
  </div>

  <div class="footer">
    Packed on: ${new Date(ord.createdAt).toLocaleDateString("en-IN")} · Payment: ${ord.paymentId?"Paid (Razorpay)":"COD"} · Thank you for shopping with BanyanVision — Empowering Dreams, Inspiring Innovations!
  </div>
</div>
<script>window.onload=function(){window.print();}<\/script>
</body></html>`);
  win.document.close();
};

const OrdersPage = ({ setPage }) => {
  const {isMobile}=useBreakpoint();
  const [orders,setOrders]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{apiGetMyOrders().then(r=>setOrders(r.data.orders)).catch(console.error).finally(()=>setLoading(false));},[]);

  // Status config — label, colour, icon, step number
  const STEPS=["pending","processing","shipped","delivered"];
  const SC={
    pending:  {bg:"#FEF3C7",c:"#D97706",icon:"🕐",label:"Order Placed"},
    processing:{bg:"#EFF6FF",c:"#2563EB",icon:"⚙️",label:"Being Prepared"},
    shipped:  {bg:"#F5F3FF",c:"#6D28D9",icon:"🚚",label:"Out for Delivery"},
    delivered:{bg:"#F0FDF4",c:"#16A34A",icon:"✅",label:"Delivered"},
    cancelled:{bg:"#FEF2F2",c:"#DC2626",icon:"❌",label:"Cancelled"},
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
          const sc=SC[s]||{bg:"#f1f5f9",c:"#64748b",icon:"📦",label:s};
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
                    <img src={item.image||`https://placehold.co/44x54/FDF8F3/C2185B?text=P`} alt={item.name} style={{width:44,height:54,objectFit:"cover",borderRadius:10,boxShadow:"0 2px 8px rgba(0,0,0,.08)"}}/>
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
                    <span style={{fontSize:22}}>❌</span>
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
                        <span>✅</span><span>Your order has been delivered. Thank you for shopping with BanyanVision — Empowering Dreams, Inspiring Innovations!</span>
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
const WishlistPage = ({ setPage, toast }) => {
  const {isMobile}=useBreakpoint();
  const [prods,setProds]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{apiGetWishlist().then(r=>setProds(r.data.wishlist)).catch(console.error).finally(()=>setLoading(false));},[]);
  return(
    <div style={{background:"var(--ivory)",minHeight:"100vh",padding:isMobile?"20px 16px":"44px 80px"}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <h1 style={{fontFamily:"var(--font-d)",color:"var(--dark)",fontSize:isMobile?28:44,fontWeight:700,marginBottom:24}}>
          My Wishlist <span style={{fontSize:18,color:"var(--rose)",fontFamily:"var(--font-b)",fontWeight:500}}>({prods.length})</span>
        </h1>
        {loading?<Spinner/>:prods.length===0?(
          <div style={{textAlign:"center",padding:"60px 0"}}>
            <div style={{fontSize:52,marginBottom:14}}>♡</div>
            <div style={{fontFamily:"var(--font-d)",fontSize:24,color:"var(--muted)",marginBottom:14}}>Nothing saved yet</div>
            <button className="btn btn-rose" onClick={()=>setPage("shop")} style={{padding:"12px 28px",fontSize:14}}>Browse Collections</button>
          </div>
        ):<div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:isMobile?10:20}}>{prods.map(p=><ProductCard key={p._id} p={p} setPage={setPage} toast={toast}/>)}</div>}
      </div>
    </div>
  );
};

/* ── PROFILE ─────────────────────────────────────────────────────────────────── */
const ProfilePage = ({ toast }) => {
  const {isMobile}=useBreakpoint();
  const {user,updateUser}=useAuth();
  const [form,setForm]=useState({name:user?.name||"",email:user?.email||"",phone:user?.phone||"",address:user?.address||""});
  const [saving,setSaving]=useState(false);
  const save=async()=>{setSaving(true);try{const r=await apiUpdateProfile(form);updateUser(r.data.user);toast("Profile saved! ✓");}catch(err){toast(err.response?.data?.message||"Error","error");}setSaving(false);};
  const iStyle={background:"var(--ivory2)",border:"1.5px solid var(--border2)",color:"var(--text)",padding:"12px 14px",fontSize:13,borderRadius:12,outline:"none",width:"100%",boxSizing:"border-box",fontWeight:500};
  return(
    <div style={{background:"var(--ivory)",minHeight:"100vh",padding:isMobile?"20px 16px":"44px 80px"}}>
      <div style={{maxWidth:520,margin:"0 auto"}}>
        <h1 style={{fontFamily:"var(--font-d)",color:"var(--dark)",fontSize:isMobile?28:44,fontWeight:700,marginBottom:24}}>My Profile</h1>
        <div style={{background:"#fff",borderRadius:"20px",border:"1.5px solid var(--border)",padding:isMobile?20:32,boxShadow:"0 4px 24px rgba(194,24,91,0.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24,paddingBottom:20,borderBottom:"1.5px solid var(--border)"}}>
            <div style={{width:60,height:60,background:"linear-gradient(135deg,var(--rose),var(--saffron))",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:"#fff",fontWeight:800,boxShadow:"0 6px 20px rgba(194,24,91,.3)"}}>{user?.name?.[0]}</div>
            <div>
              <div style={{fontFamily:"var(--font-d)",fontSize:20,fontWeight:700,color:"var(--dark)"}}>{user?.name}</div>
              <span className="tag" style={{background:user?.role==="admin"?"var(--purpleL)":"var(--tealL)",color:user?.role==="admin"?"var(--purple)":"var(--teal)",fontSize:10,marginTop:4}}>{user?.role==="admin"?"⚙ Admin":"✓ Customer"}</span>
            </div>
          </div>
          {[["Full Name","name","text"],["Email","email","email"],["Phone","phone","tel"],["Address","address","text"]].map(([label,key,type])=>(
            <div key={key} style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:11,fontWeight:700,color:"var(--text2)",marginBottom:6,letterSpacing:.3}}>{label}</label>
              <input type={type} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={iStyle}/>
            </div>
          ))}
          <button className="btn btn-rose" onClick={save} disabled={saving} style={{width:"100%",padding:"14px 0",fontSize:14,opacity:saving?.75:1}}>{saving?"Saving…":"Save Changes"}</button>
        </div>
      </div>
    </div>
  );
};

/* ── LOGIN ───────────────────────────────────────────────────────────────────── */
const LoginPage = ({ setPage, toast }) => {
  const {isMobile}=useBreakpoint();
  const {login,register}=useAuth();
  const [tab,setTab]=useState("login");
  const [form,setForm]=useState({name:"",email:"",password:""});
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  const handle=async()=>{
    setLoading(true);setErr("");
    try{
      if(tab==="login"){const u=await login(form.email,form.password);toast(`Welcome back, ${u.name}!`);setPage("home");}
      else{const u=await register(form.name,form.email,form.password);toast(`Welcome, ${u.name}!`);setPage("home");}
    }catch(e){setErr(e.response?.data?.message||"Something went wrong");}
    setLoading(false);
  };

  const iStyle={background:"var(--ivory2)",border:"1.5px solid var(--border2)",color:"var(--text)",padding:"14px 16px",fontSize:14,borderRadius:12,outline:"none",width:"100%",boxSizing:"border-box",fontWeight:500,transition:"border-color .2s"};

  return(
    <div style={{minHeight:"100vh",display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr"}}>
      {/* Left */}
      {!isMobile&&(
        <div style={{background:"linear-gradient(160deg,var(--rose) 0%,var(--saffron) 50%,var(--purple) 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:60,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-80,right:-80,width:300,height:300,borderRadius:"50%",background:"rgba(255,255,255,.07)"}}/>
          <div style={{position:"absolute",bottom:-60,left:-60,width:250,height:250,borderRadius:"50%",background:"rgba(255,255,255,.05)"}}/>
          <div style={{position:"relative",textAlign:"center",maxWidth:380}}>
            <img src="/bv.jpg" alt="BanyanVision" style={{width:120,height:120,objectFit:"contain",borderRadius:0,margin:"0 auto 16px",background:"transparent"}}/>
            <div style={{fontFamily:"var(--font-d)",fontSize:40,fontWeight:700,color:"#fff",marginBottom:6,letterSpacing:.5}}>BanyanVision</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.75)",letterSpacing:3,fontWeight:700,textTransform:"uppercase",marginBottom:32}}>Empowering Dreams, Inspiring Innovations</div>
            <p style={{color:"rgba(255,255,255,.8)",fontSize:15,lineHeight:1.85,marginBottom:32}}>India's finest handcrafted fashion destination. Real Razorpay payments, real artisans, real heritage.</p>
            <div style={{background:"rgba(255,255,255,.12)",borderRadius:"20px",padding:"20px 24px",textAlign:"left",backdropFilter:"blur(10px)",border:"1px solid rgba(255,255,255,.15)"}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,.75)",fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>Demo Credentials</div>
              {[["👑 Admin","admin@banyanvision.com","admin123"],["👤 User","user@test.com","user123"]].map(([role,email,pass])=>(
                <div key={role} style={{marginBottom:12,paddingBottom:12,borderBottom:"1px solid rgba(255,255,255,.15)"}}>
                  <div style={{fontSize:13,color:"#fff",fontWeight:700,marginBottom:3}}>{role}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,.75)",fontFamily:"monospace"}}>{email}<br/>{pass}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Right */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:isMobile?"48px 24px":60,background:"var(--ivory)"}}>
        <div style={{width:"100%",maxWidth:400}}>
          {isMobile&&(
            <div style={{textAlign:"center",marginBottom:28}}>
              <img src="/bv.jpg" alt="BanyanVision" style={{width:100,height:100,objectFit:"contain",borderRadius:0,margin:"0 auto 10px",background:"transparent"}}/>
              <div style={{fontFamily:"var(--font-d)",fontSize:26,fontWeight:700,color:"var(--dark)"}}>BanyanVision</div>
            </div>
          )}
          <h2 style={{fontFamily:"var(--font-d)",fontSize:28,fontWeight:700,color:"var(--dark)",marginBottom:6}}>{tab==="login"?"Welcome Back!":"Create Account"}</h2>
          <p style={{color:"var(--muted)",fontSize:13,marginBottom:24,fontWeight:500}}>{tab==="login"?"Sign in to your account":"Join thousands of happy shoppers"}</p>

          <div style={{display:"flex",gap:0,marginBottom:24,background:"var(--ivory3)",borderRadius:12,padding:4}}>
            {["login","register"].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"10px 0",background:tab===t?"#fff":"transparent",border:"none",borderRadius:10,color:tab===t?"var(--rose)":"var(--muted)",fontWeight:700,cursor:"pointer",fontSize:13,transition:"all .2s",boxShadow:tab===t?"0 2px 10px rgba(0,0,0,.08)":"none"}}>
                {t==="login"?"Sign In":"Register"}
              </button>
            ))}
          </div>

          {tab==="register"&&(
            <div style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:11,fontWeight:700,color:"var(--text2)",marginBottom:6}}>Full Name</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={iStyle} placeholder="Your name"/>
            </div>
          )}
          {[["Email","email","email"],["Password","password","password"]].map(([label,key,type])=>(
            <div key={key} style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:11,fontWeight:700,color:"var(--text2)",marginBottom:6}}>{label}</label>
              <input type={type} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&handle()} style={iStyle} placeholder={label}/>
            </div>
          ))}
          {err&&<div style={{color:"#DC2626",fontSize:13,marginBottom:14,fontWeight:600,padding:"10px 14px",background:"#FEF2F2",borderRadius:10,border:"1px solid #FECACA"}}>⚠ {err}</div>}
          <button className="btn btn-rose" onClick={handle} disabled={loading} style={{width:"100%",padding:"15px 0",fontSize:15,marginBottom:12,opacity:loading?.75:1}}>
            {loading?"Please wait…":tab==="login"?"Sign In →":"Create Account →"}
          </button>
          <button className="btn btn-ghost" onClick={()=>setPage("home")} style={{width:"100%",padding:"13px 0",fontSize:14}}>Continue as Guest</button>
        </div>
      </div>
    </div>
  );
};

/* ── ABOUT ───────────────────────────────────────────────────────────────────── */
const AboutPage = ({ setPage }) => {
  const {isMobile}=useBreakpoint();
  const ab=useAboutData();
  const FEAT_BGS=["var(--roseL)","var(--tealL)","var(--saffronL)","var(--purpleL)"];
  return(
    <div style={{background:"var(--ivory)"}}>
      <div style={{background:"linear-gradient(160deg,var(--roseL) 0%,var(--saffronL) 50%,var(--tealL) 100%)",padding:isMobile?"60px 24px":"100px 80px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-60,right:-60,width:280,height:280,borderRadius:"50%",background:"rgba(194,24,91,.07)"}}/>
        <div style={{maxWidth:800,position:"relative"}}>
          <SecLabel>{ab.heroLabel}</SecLabel>
          <h1 style={{fontFamily:"var(--font-d)",fontSize:isMobile?36:62,fontWeight:700,color:"var(--dark)",marginTop:10,lineHeight:1.1,marginBottom:18,letterSpacing:-.5}}>
            {ab.heroHeading}<br/><span className="rose-text">{ab.heroHeadingAccent}</span>
          </h1>
          <p style={{color:"var(--text2)",fontSize:isMobile?14:17,lineHeight:1.9,maxWidth:520,fontWeight:400}}>{ab.heroBody}</p>
        </div>
      </div>

      <div style={{maxWidth:1200,margin:"0 auto",padding:isMobile?"48px 24px":"80px 80px"}}>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?32:64,alignItems:"center",marginBottom:56}}>
          <div>
            <SecLabel>{ab.missionLabel}</SecLabel>
            <h2 style={{fontFamily:"var(--font-d)",fontSize:isMobile?26:38,fontWeight:700,color:"var(--dark)",marginTop:8,marginBottom:16,letterSpacing:-.3}}>Why We <span className="rose-text">Exist</span></h2>
            <p style={{color:"var(--text2)",lineHeight:1.9,fontSize:14,marginBottom:14}}>{ab.missionP1}</p>
            <p style={{color:"var(--text2)",lineHeight:1.9,fontSize:14}}>{ab.missionP2}</p>
          </div>
          <div style={{borderRadius:"28px",height:isMobile?200:320,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isMobile?80:110,background:"linear-gradient(135deg,var(--roseL),var(--saffronL))",border:"1.5px solid var(--border)"}}>{ab.emoji}</div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:isMobile?12:0,background:isMobile?"transparent":"var(--border)",border:isMobile?"none":`1.5px solid var(--border)`,borderRadius:isMobile?"none":"20px",overflow:"hidden",marginBottom:48}}>
          {(ab.features||[]).map((f,i)=>(
            <div key={i} style={{padding:isMobile?"24px 16px":"36px 28px",textAlign:"center",background:"var(--cream)",transition:"background .2s",cursor:"default"}}
              onMouseEnter={e=>e.currentTarget.style.background=FEAT_BGS[i%4]}
              onMouseLeave={e=>e.currentTarget.style.background="var(--cream)"}>
              <div style={{fontSize:isMobile?30:38,marginBottom:12}}>{f.icon}</div>
              <div style={{fontFamily:"var(--font-d)",fontSize:isMobile?15:19,fontWeight:700,color:"var(--dark)",marginBottom:8}}>{f.title}</div>
              <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.7}}>{f.desc}</div>
            </div>
          ))}
        </div>

        <div style={{textAlign:"center"}}>
          <button className="btn btn-rose" onClick={()=>setPage("shop")} style={{padding:"16px 44px",fontSize:16}}>Explore Collections</button>
        </div>
      </div>
    </div>
  );
};

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
      setProducts(r.data.products);
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
          ↻ Refresh
        </button>
      </div>

      {/* ── Alert banners ── */}
      {outOfStock > 0 && (
        <div style={{background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:12,padding:"10px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:10,fontSize:13,color:"#DC2626",fontWeight:600}}>
          🚨 {outOfStock} product{outOfStock>1?"s are":" is"} out of stock — restock immediately to avoid lost sales.
          <button onClick={()=>setStockF("out")} style={{marginLeft:"auto",padding:"4px 10px",borderRadius:7,background:"#DC2626",border:"none",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>View</button>
        </div>
      )}
      {lowStock > 0 && (
        <div style={{background:"#FFF7ED",border:"1.5px solid #FED7AA",borderRadius:12,padding:"10px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10,fontSize:13,color:"#D97706",fontWeight:600}}>
          ⚠️ {lowStock} product{lowStock>1?"s are":" is"} running low (≤10 units).
          <button onClick={()=>setStockF("low")} style={{marginLeft:"auto",padding:"4px 10px",borderRadius:7,background:"#D97706",border:"none",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>View</button>
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search product or category…"
          style={{...iS,flex:1,minWidth:180}}/>
        <select value={catF} onChange={e=>setCatF(e.target.value)} style={{...iS,width:"auto"}}>
          {cats.map(c=><option key={c} value={c}>{c==="all"?"All Categories":c}</option>)}
        </select>
        <select value={stockF} onChange={e=>setStockF(e.target.value)} style={{...iS,width:"auto"}}>
          <option value="all">All Stock Levels</option>
          <option value="out">🔴 Out of Stock</option>
          <option value="low">🟡 Low (1–10)</option>
          <option value="ok">🟢 OK (11–50)</option>
          <option value="high">🔵 High (51+)</option>
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
                    style={{width:48,height:58,objectFit:"cover",borderRadius:8,flexShrink:0,border:"1px solid var(--border)"}}/>
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
                  {[["➕ Add","add","#16A34A"],["✏️ Set","set","var(--rose)"],["➖ Remove","remove","#DC2626"]].map(([lbl,mode,col])=>(
                    <button key={mode} onClick={()=>openEdit(p,mode)}
                      style={{flex:1,padding:"6px 0",borderRadius:8,fontSize:11,fontWeight:700,border:"none",cursor:"pointer",
                        background:mode==="add"?"#F0FDF4":mode==="set"?"var(--roseL)":"#FEF2F2",color:col}}>
                      {lbl}
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
                    style={{width:40,height:48,objectFit:"cover",borderRadius:7,flexShrink:0,border:"1px solid var(--border)"}}/>
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
                    ➕ Add
                  </button>
                  <button onClick={()=>openEdit(p,"remove")}
                    style={{padding:"5px 10px",borderRadius:8,fontSize:11,fontWeight:700,border:"none",cursor:"pointer",background:"#FEF2F2",color:"#DC2626",transition:"opacity .15s"}}
                    onMouseEnter={e=>e.currentTarget.style.opacity=".75"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                    ➖ Remove
                  </button>
                  <button onClick={()=>openEdit(p,"set")}
                    style={{padding:"5px 10px",borderRadius:8,fontSize:11,fontWeight:700,border:"1.5px solid var(--border2)",cursor:"pointer",background:"#fff",color:"var(--muted)",transition:"all .15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--rose)";e.currentTarget.style.color="var(--rose)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.color="var(--muted)";}}>
                    ✏️ Set
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
                  {editing.mode==="add"?"➕ Add Stock":editing.mode==="remove"?"➖ Remove Stock":"✏️ Set Exact Stock"}
                </div>
                <h3 style={{fontFamily:"var(--font-d)",fontSize:19,color:"var(--dark)",fontWeight:700,margin:0,lineHeight:1.3}}>{editing.product.name}</h3>
              </div>
              <button onClick={()=>setEditing(null)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"var(--muted)",lineHeight:1,flexShrink:0}}>×</button>
            </div>

            {/* Product info strip */}
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:"var(--ivory2)",borderRadius:12,marginBottom:20,border:"1.5px solid var(--border)"}}>
              <img src={editing.product.images?.[0]?.url||"https://placehold.co/44x54/FDF8F3/C2185B?text=P"} alt=""
                style={{width:44,height:54,objectFit:"cover",borderRadius:8,border:"1px solid var(--border)"}}/>
              <div>
                <div style={{fontSize:11,color:"var(--muted)",fontWeight:600}}>{editing.product.category}</div>
                <div style={{fontSize:13,fontWeight:700,color:"var(--dark)"}}>
                  Current stock: <span style={{color:stockBadge(editing.product.stock).c,fontFamily:"var(--font-d)",fontSize:16}}>{editing.product.stock}</span> units
                </div>
              </div>
            </div>

            {/* Mode switcher */}
            <div style={{display:"flex",gap:6,marginBottom:16}}>
              {[["add","➕ Add"],["remove","➖ Remove"],["set","✏️ Set Exact"]].map(([m,lbl])=>(
                <button key={m} onClick={()=>{setEditing(e=>({...e,mode:m}));setAdjVal("");}}
                  style={{flex:1,padding:"8px 0",borderRadius:9,fontSize:11,fontWeight:700,cursor:"pointer",transition:"all .2s",
                    background:editing.mode===m?"linear-gradient(135deg,var(--rose),var(--saffron))":"var(--ivory2)",
                    border:editing.mode===m?"none":"1.5px solid var(--border2)",
                    color:editing.mode===m?"#fff":"var(--muted)"}}>
                  {lbl}
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

/* ── ADMIN CUSTOMERS ─────────────────────────────────────────────────────────── */
const AdminCustomers = ({ users, setUsers, toast, isMobile }) => {
  const [search,  setSearch]  = useState("");
  const [roleF,   setRoleF]   = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newUser, setNewUser] = useState({ name:"", email:"", password:"", phone:"", role:"user" });

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchQ = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q);
    const matchR = roleF==="all" || u.role===roleF;
    const matchS = statusF==="all" || (statusF==="active"?u.active!==false:u.active===false);
    return matchQ && matchR && matchS;
  });

  const toggleActive = async (id) => {
    try {
      const r = await apiAdminToggleUser(id);
      setUsers(us => us.map(u => u._id===id ? r.data.user : u));
      toast(r.data.user.active ? "Account activated ✓" : "Account deactivated");
    } catch(err) { toast(err.response?.data?.message||"Error","error"); }
  };

  const changeRole = async (id, role) => {
    try {
      const r = await apiAdminChangeRole(id, role);
      setUsers(us => us.map(u => u._id===id ? r.data.user : u));
      toast(`Role changed to ${role} ✓`);
    } catch(err) { toast(err.response?.data?.message||"Error","error"); }
  };

  const deleteUser = async (id) => {
    try {
      await apiAdminDeleteUser(id);
      setUsers(us => us.filter(u => u._id!==id));
      toast("User deleted");
      setConfirmDel(null);
    } catch(err) { toast(err.response?.data?.message||"Error","error"); }
  };

  const createUser = async () => {
    if(!newUser.name.trim()||!newUser.email.trim()||!newUser.password.trim()){
      toast("Name, email and password are required","error"); return;
    }
    setSaving(true);
    try {
      const r = await apiAdminCreateUser(newUser);
      setUsers(us => [r.data.user, ...us]);
      setNewUser({ name:"", email:"", password:"", phone:"", role:"user" });
      setShowAdd(false);
      toast(`${r.data.user.role==="admin"?"Admin":"Customer"} account created ✓`);
    } catch(err) { toast(err.response?.data?.message||"Error","error"); }
    setSaving(false);
  };

  const iS = { background:"#fff", border:"1.5px solid var(--border2)", color:"var(--text)", padding:"10px 13px", fontSize:13, borderRadius:10, outline:"none", width:"100%", boxSizing:"border-box", fontWeight:500 };

  const admins   = users.filter(u=>u.role==="admin").length;
  const active   = users.filter(u=>u.active!==false).length;
  const inactive = users.filter(u=>u.active===false).length;

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{fontFamily:"var(--font-d)",color:"var(--dark)",margin:"0 0 6px",fontSize:28,fontWeight:700}}>Customers & Users</h2>
          <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
            {[["Total",users.length,"var(--rose)"],["Admins",admins,"var(--purple)"],["Active",active,"#16A34A"],["Inactive",inactive,"#DC2626"]].map(([l,v,c])=>(
              <span key={l} style={{fontSize:12,fontWeight:700,color:"var(--muted)"}}>
                {l}: <span style={{color:c}}>{v}</span>
              </span>
            ))}
          </div>
        </div>
        <button onClick={()=>setShowAdd(true)}
          style={{display:"inline-flex",alignItems:"center",gap:6,padding:"11px 20px",background:"linear-gradient(135deg,var(--rose),var(--saffron))",border:"none",borderRadius:11,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:"0 4px 16px rgba(194,24,91,.3)"}}>
          ＋ Add User
        </button>
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search name, email, phone…"
          style={{...iS,flex:1,minWidth:180,padding:"9px 13px"}}/>
        <select value={roleF} onChange={e=>setRoleF(e.target.value)}
          style={{...iS,width:"auto",padding:"9px 13px"}}>
          <option value="all">All Roles</option>
          <option value="user">Customer</option>
          <option value="admin">Admin</option>
        </select>
        <select value={statusF} onChange={e=>setStatusF(e.target.value)}
          style={{...iS,width:"auto",padding:"9px 13px"}}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div style={{background:"#fff",borderRadius:"16px",border:"1.5px solid var(--border)",overflow:"hidden",boxShadow:"0 4px 24px rgba(194,24,91,.06)"}}>
        {/* Table header */}
        {!isMobile&&(
          <div style={{display:"grid",gridTemplateColumns:"2fr 2fr 1fr 1fr 1fr 1fr",gap:0,background:"linear-gradient(135deg,var(--roseL),var(--saffronL))",borderBottom:"1.5px solid var(--border)",padding:"10px 16px"}}>
            {["Name","Email","Phone","Role","Status","Actions"].map(h=>(
              <div key={h} style={{fontSize:10,fontWeight:800,color:"var(--rose)",letterSpacing:1,textTransform:"uppercase"}}>{h}</div>
            ))}
          </div>
        )}

        {filtered.length===0?(
          <div style={{textAlign:"center",padding:"48px 0",color:"var(--muted)",fontSize:14}}>No users match the current filter.</div>
        ):filtered.map((u,idx)=>{
          const isActive = u.active !== false;
          const isAdmin  = u.role === "admin";
          return isMobile ? (
            /* ── Mobile card ── */
            <div key={u._id} style={{padding:"14px 16px",borderBottom:"1px solid var(--border)",background:isActive?"#fff":"#FEF2F2"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                <div style={{width:40,height:40,borderRadius:"50%",flexShrink:0,
                  background:isAdmin?"linear-gradient(135deg,var(--purple),#AB47BC)":"linear-gradient(135deg,var(--rose),var(--saffron))",
                  display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:16}}>
                  {u.name?.[0]?.toUpperCase()||"?"}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,color:"var(--dark)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name}</div>
                  <div style={{fontSize:11,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</div>
                  {u.phone&&<div style={{fontSize:11,color:"var(--muted)"}}>{u.phone}</div>}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end"}}>
                  <span style={{padding:"2px 8px",borderRadius:99,fontSize:9,fontWeight:800,letterSpacing:.5,
                    background:isAdmin?"var(--purpleL)":"var(--tealL)",color:isAdmin?"var(--purple)":"var(--teal)"}}>
                    {isAdmin?"ADMIN":"CUSTOMER"}
                  </span>
                  <span style={{padding:"2px 8px",borderRadius:99,fontSize:9,fontWeight:800,
                    background:isActive?"#F0FDF4":"#FEF2F2",color:isActive?"#16A34A":"#DC2626"}}>
                    {isActive?"ACTIVE":"INACTIVE"}
                  </span>
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button onClick={()=>toggleActive(u._id)} style={{padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:700,border:"none",cursor:"pointer",
                  background:isActive?"#FEF2F2":"#F0FDF4",color:isActive?"#DC2626":"#16A34A"}}>
                  {isActive?"Deactivate":"Activate"}
                </button>
                <button onClick={()=>changeRole(u._id,isAdmin?"user":"admin")} style={{padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:700,border:"1.5px solid var(--border2)",cursor:"pointer",background:"#fff",color:"var(--text)"}}>
                  Make {isAdmin?"Customer":"Admin"}
                </button>
                <button onClick={()=>setConfirmDel(u)} style={{padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:700,border:"none",cursor:"pointer",background:"#FEF2F2",color:"#DC2626"}}>
                  Delete
                </button>
              </div>
            </div>
          ) : (
            /* ── Desktop table row ── */
            <div key={u._id} style={{display:"grid",gridTemplateColumns:"2fr 2fr 1fr 1fr 1fr 1fr",gap:0,padding:"12px 16px",borderBottom:"1px solid var(--border)",alignItems:"center",background:idx%2===0?"#fff":"#FAFAFA",transition:"background .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="var(--roseL)"}
              onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?"#fff":"#FAFAFA"}>

              {/* Name */}
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:34,height:34,borderRadius:"50%",flexShrink:0,
                  background:isAdmin?"linear-gradient(135deg,var(--purple),#AB47BC)":"linear-gradient(135deg,var(--rose),var(--saffron))",
                  display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:14}}>
                  {u.name?.[0]?.toUpperCase()||"?"}
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color:"var(--dark)"}}>{u.name}</div>
                  <div style={{fontSize:10,color:"var(--muted)"}}>{new Date(u.createdAt).toLocaleDateString("en-IN")}</div>
                </div>
              </div>

              {/* Email */}
              <div style={{fontSize:12,color:"var(--text2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingRight:8}}>{u.email}</div>

              {/* Phone */}
              <div style={{fontSize:12,color:"var(--muted)"}}>{u.phone||"—"}</div>

              {/* Role */}
              <div>
                <span style={{padding:"3px 10px",borderRadius:99,fontSize:9,fontWeight:800,letterSpacing:.5,
                  background:isAdmin?"var(--purpleL)":"var(--tealL)",color:isAdmin?"var(--purple)":"var(--teal)"}}>
                  {isAdmin?"ADMIN":"CUSTOMER"}
                </span>
              </div>

              {/* Status */}
              <div>
                <span style={{padding:"3px 10px",borderRadius:99,fontSize:9,fontWeight:800,
                  background:isActive?"#F0FDF4":"#FEF2F2",color:isActive?"#16A34A":"#DC2626"}}>
                  {isActive?"● ACTIVE":"● INACTIVE"}
                </span>
              </div>

              {/* Actions */}
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                <button title={isActive?"Deactivate account":"Activate account"} onClick={()=>toggleActive(u._id)}
                  style={{padding:"4px 10px",borderRadius:7,fontSize:10,fontWeight:700,border:"none",cursor:"pointer",
                    background:isActive?"#FEF2F2":"#F0FDF4",color:isActive?"#DC2626":"#16A34A",transition:"opacity .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.opacity=".75"}
                  onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                  {isActive?"Deactivate":"Activate"}
                </button>
                <button title={`Change to ${isAdmin?"Customer":"Admin"}`} onClick={()=>changeRole(u._id,isAdmin?"user":"admin")}
                  style={{padding:"4px 10px",borderRadius:7,fontSize:10,fontWeight:700,border:"1.5px solid var(--border2)",cursor:"pointer",background:"#fff",color:"var(--muted)",transition:"all .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--rose)";e.currentTarget.style.color="var(--rose)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.color="var(--muted)";}}>
                  {isAdmin?"→ Customer":"→ Admin"}
                </button>
                <button title="Delete user" onClick={()=>setConfirmDel(u)}
                  style={{padding:"4px 8px",borderRadius:7,fontSize:12,border:"none",cursor:"pointer",background:"none",color:"#EF4444",opacity:.6,transition:"opacity .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.opacity="1"}
                  onMouseLeave={e=>e.currentTarget.style.opacity=".6"}>
                  🗑
                </button>
              </div>
            </div>
          );
        })}

        {/* Footer */}
        <div style={{padding:"10px 16px",background:"var(--ivory2)",borderTop:"1.5px solid var(--border)",fontSize:11,color:"var(--muted)",fontWeight:500}}>
          Showing {filtered.length} of {users.length} users
        </div>
      </div>

      {/* ── Add User Modal ── */}
      {showAdd&&(
        <div style={{position:"fixed",inset:0,background:"rgba(26,10,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,backdropFilter:"blur(4px)",padding:16}}>
          <div style={{background:"#fff",borderRadius:"20px",padding:28,width:"100%",maxWidth:440,boxShadow:"0 24px 64px rgba(0,0,0,.2)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{fontFamily:"var(--font-d)",fontSize:22,color:"var(--dark)",fontWeight:700,margin:0}}>Add New User</h3>
              <button onClick={()=>setShowAdd(false)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"var(--muted)",lineHeight:1}}>×</button>
            </div>

            {[["Full Name","name","text","e.g. Priya Sharma"],["Email Address","email","email","e.g. priya@email.com"],["Password","password","password","Min 6 characters"],["Phone Number","phone","tel","e.g. 9876543210"]].map(([label,key,type,ph])=>(
              <div key={key} style={{marginBottom:14}}>
                <label style={{display:"block",fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:.5,textTransform:"uppercase",marginBottom:6}}>
                  {label}{key!=="phone"&&<span style={{color:"#DC2626"}}> *</span>}
                </label>
                <input type={type} value={newUser[key]} onChange={e=>setNewUser(n=>({...n,[key]:e.target.value}))}
                  placeholder={ph} style={iS}
                  onFocus={e=>e.target.style.borderColor="var(--rose)"}
                  onBlur={e=>e.target.style.borderColor="var(--border2)"}/>
              </div>
            ))}

            <div style={{marginBottom:20}}>
              <label style={{display:"block",fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:.5,textTransform:"uppercase",marginBottom:6}}>Account Role</label>
              <div style={{display:"flex",gap:10}}>
                {[["user","👤 Customer"],["admin","🛡 Admin"]].map(([val,label])=>(
                  <button key={val} onClick={()=>setNewUser(n=>({...n,role:val}))}
                    style={{flex:1,padding:"10px 0",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .2s",
                      background:newUser.role===val?"linear-gradient(135deg,var(--rose),var(--saffron))":"#fff",
                      border:newUser.role===val?"none":"1.5px solid var(--border2)",
                      color:newUser.role===val?"#fff":"var(--muted)"}}>
                    {label}
                  </button>
                ))}
              </div>
              {newUser.role==="admin"&&(
                <div style={{marginTop:8,padding:"8px 12px",background:"#FFF3E0",borderRadius:8,fontSize:11,color:"#D97706",fontWeight:600}}>
                  ⚠ Admin users have full access to the admin dashboard.
                </div>
              )}
            </div>

            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowAdd(false)} style={{flex:1,padding:"12px 0",borderRadius:11,background:"var(--ivory2)",border:"1.5px solid var(--border2)",fontWeight:600,fontSize:13,cursor:"pointer",color:"var(--muted)"}}>Cancel</button>
              <button onClick={createUser} disabled={saving}
                style={{flex:2,padding:"12px 0",borderRadius:11,background:"linear-gradient(135deg,var(--rose),var(--saffron))",border:"none",fontWeight:700,fontSize:13,cursor:saving?"not-allowed":"pointer",color:"#fff",opacity:saving?.7:1,boxShadow:"0 4px 16px rgba(194,24,91,.3)"}}>
                {saving?"Creating…":"Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {confirmDel&&(
        <div style={{position:"fixed",inset:0,background:"rgba(26,10,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,backdropFilter:"blur(4px)",padding:16}}>
          <div style={{background:"#fff",borderRadius:"20px",padding:28,maxWidth:360,width:"100%",textAlign:"center",boxShadow:"0 24px 64px rgba(0,0,0,.25)"}}>
            <div style={{fontSize:44,marginBottom:12}}>🗑️</div>
            <h3 style={{fontFamily:"var(--font-d)",fontSize:22,color:"var(--dark)",marginBottom:8,fontWeight:700}}>Delete Account?</h3>
            <p style={{color:"var(--muted)",fontSize:13,lineHeight:1.75,marginBottom:20}}>
              Permanently delete <strong style={{color:"var(--rose)"}}>{confirmDel.name}</strong> ({confirmDel.email})? This cannot be undone.
            </p>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>setConfirmDel(null)} style={{padding:"11px 24px",borderRadius:12,background:"var(--ivory2)",border:"1.5px solid var(--border2)",fontWeight:700,fontSize:13,cursor:"pointer",color:"var(--text)"}}>Cancel</button>
              <button onClick={()=>deleteUser(confirmDel._id)} style={{padding:"11px 24px",borderRadius:12,background:"linear-gradient(135deg,#EF4444,#DC2626)",border:"none",fontWeight:700,fontSize:13,cursor:"pointer",color:"#fff",boxShadow:"0 4px 16px rgba(239,68,68,.3)"}}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── ADMIN ORDERS LIST ───────────────────────────────────────────────────────── */
const AdminOrdersList = ({ orders, isMobile, iStyle, updateSt }) => {
  const [expanded, setExpanded] = useState({});
  const toggle = id => setExpanded(e => ({ ...e, [id]: !e[id] }));
  const SC = {
    pending:   { bg:"#FEF3C7", c:"#D97706" },
    processing:{ bg:"#EFF6FF", c:"#2563EB" },
    shipped:   { bg:"#F5F3FF", c:"#6D28D9" },
    delivered: { bg:"#F0FDF4", c:"#16A34A" },
    cancelled: { bg:"#FEF2F2", c:"#DC2626" },
  };

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <h2 style={{fontFamily:"var(--font-d)",color:"var(--dark)",margin:0,fontSize:30,fontWeight:700}}>All Orders ({orders.length})</h2>
        <div style={{fontSize:12,color:"var(--muted)",fontWeight:500}}>Click any order to expand full details</div>
      </div>

      {orders.map(ord => {
        const sa  = ord.shippingAddress || {};
        const ss  = SC[ord.status] || { bg:"#f1f5f9", c:"#64748b" };
        const open = expanded[ord._id];

        return (
          <div key={ord._id} style={{background:"#fff",borderRadius:"14px",marginBottom:12,overflow:"hidden",border:"1.5px solid var(--border)",boxShadow:"0 4px 24px rgba(194,24,91,0.08)"}}>

            {/* ── Header ── */}
            <div onClick={()=>toggle(ord._id)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",background:"linear-gradient(135deg,var(--roseL),var(--saffronL))",borderBottom:"1px solid var(--border)",flexWrap:"wrap",gap:8,cursor:"pointer"}}>
              <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontFamily:"monospace",fontWeight:800,fontSize:13,color:"var(--dark)"}}>#{ord._id.slice(-8).toUpperCase()}</span>
                <span style={{color:"var(--muted)",fontSize:11}}>{ord.user?.name||ord.user?.email}</span>
                <span style={{color:"var(--muted)",fontSize:11}}>
                  {new Date(ord.createdAt).toLocaleDateString("en-IN")}{" "}
                  {new Date(ord.createdAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}
                </span>
              </div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontFamily:"var(--font-d)",fontWeight:800,fontSize:15,background:"linear-gradient(135deg,var(--rose),var(--saffron))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{fmt(ord.total)}</span>
                <span className="tag" style={{background:ss.bg,color:ss.c,fontWeight:800,fontSize:9,letterSpacing:.5}}>{ord.status.toUpperCase()}</span>
                <select value={ord.status} onClick={e=>e.stopPropagation()} onChange={e=>updateSt(ord._id,e.target.value)}
                  style={{...iStyle,width:"auto",padding:"5px 8px",fontSize:11,borderRadius:8}}>
                  {["pending","processing","shipped","delivered","cancelled"].map(s=><option key={s}>{s}</option>)}
                </select>
                <span style={{fontSize:16,color:"var(--muted)",display:"inline-block",transition:"transform .2s",transform:open?"rotate(180deg)":"rotate(0deg)"}}>⌄</span>
              </div>
            </div>

            {/* ── Items strip ── */}
            <div style={{padding:"10px 16px",display:"flex",gap:10,flexWrap:"wrap",borderBottom:"1px solid var(--border)"}}>
              {ord.items.map((item,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:7}}>
                  <img src={item.image||"https://placehold.co/36x44/FDF8F3/C2185B?text=P"} alt={item.name} style={{width:36,height:44,objectFit:"cover",borderRadius:8}}/>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:"var(--text)"}}>{item.name}</div>
                    <div style={{fontSize:10,color:"var(--muted)"}}>
                      {item.color&&item.color+" · "}{item.size&&item.size+" · "}×{item.qty} · {fmt(item.price)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Expanded full details ── */}
            {open&&(
              <div style={{padding:16,background:"var(--ivory2)"}}>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:12,marginBottom:14}}>

                  {/* Ship To */}
                  <div style={{background:"#fff",borderRadius:12,padding:14,border:"1.5px solid var(--border)"}}>
                    <div style={{fontSize:9,fontWeight:800,color:"var(--rose)",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>📍 Ship To</div>
                    <div style={{fontFamily:"var(--font-d)",fontSize:15,fontWeight:700,color:"var(--dark)",marginBottom:3}}>{sa.fullName||"—"}</div>
                    <div style={{fontSize:12,color:"var(--text2)",lineHeight:1.8}}>
                      {sa.address&&<div>{sa.address}</div>}
                      <div>{[sa.city,sa.state].filter(Boolean).join(", ")}{sa.pin?" — "+sa.pin:""}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8,padding:"6px 10px",background:"var(--roseL)",borderRadius:8}}>
                      <span>📱</span>
                      <span style={{fontWeight:700,fontSize:13}}>{sa.phone||"—"}</span>
                    </div>
                    {ord.user?.email&&(
                      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6,padding:"6px 10px",background:"var(--ivory3)",borderRadius:8}}>
                        <span>✉</span>
                        <span style={{fontSize:11,color:"var(--muted)",fontWeight:500,wordBreak:"break-all"}}>{ord.user.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Payment */}
                  <div style={{background:"#fff",borderRadius:12,padding:14,border:"1.5px solid var(--border)"}}>
                    <div style={{fontSize:9,fontWeight:800,color:"var(--rose)",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>💳 Payment</div>
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
                    {ord.coupon&&<div style={{marginTop:6,padding:"4px 8px",background:"#FFF3E0",borderRadius:6,fontSize:10,fontWeight:700,color:"var(--saffron)"}}>🏷 Coupon: {ord.coupon}</div>}
                  </div>

                  {/* Order Info */}
                  <div style={{background:"#fff",borderRadius:12,padding:14,border:"1.5px solid var(--border)"}}>
                    <div style={{fontSize:9,fontWeight:800,color:"var(--rose)",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>📋 Order Info</div>
                    {[
                      ["Order ID",  ord._id.slice(-8).toUpperCase()],
                      ["Placed On", new Date(ord.createdAt).toLocaleString("en-IN")],
                      ["Items",     ord.items.reduce((s,i)=>s+i.qty,0)+" item(s)"],
                    ].map(([k,v])=>(
                      <div key={k} style={{marginBottom:8}}>
                        <div style={{fontSize:9,color:"var(--muted)",fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{k}</div>
                        <div style={{fontWeight:700,fontSize:k==="Order ID"?13:12,fontFamily:k==="Order ID"?"monospace":"var(--font-b)",color:"var(--dark)"}}>{v}</div>
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

                {/* Print shipping label */}
                <button onClick={()=>printShippingLabel(ord)}
                  style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 22px",background:"linear-gradient(135deg,var(--dark),#3D1500)",border:"none",borderRadius:11,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:"0 4px 16px rgba(0,0,0,.2)",transition:"opacity .2s"}}
                  onMouseEnter={e=>e.currentTarget.style.opacity=".85"}
                  onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                  🖨️ Print Shipping Label
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ── ADMIN ───────────────────────────────────────────────────────────────────── */
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
      .then(([s,o,p,u,c])=>{setStats(s.data.stats);setOrders(o.data.orders);setProducts(p.data.products);setUsers(u.data.users);setCoupons(c.data.coupons);})
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
      const r=await apiGetProducts({limit:50});setProducts(r.data.products);resetP();
    }catch(err){toast(err.response?.data?.message||"Save failed","error");}
    setSaving(false);
  };

  const resetP=()=>{setPf({name:"",description:"",price:"",originalPrice:"",category:Object.keys(_globalCatConfig)[0]||"Kurtas & Sets",fabric:"",occasion:"",care:"",stock:"",badge:"",featured:false,trending:false});setPSizes([]);setPColors([]);setPFiles([]);setEditId(null);setExImgs([]);};
  const editProd=p=>{setPf({name:p.name,description:p.description,price:p.price,originalPrice:p.originalPrice||"",category:p.category,fabric:p.fabric||"",occasion:p.occasion||"",care:p.care||"",stock:p.stock,badge:p.badge||"",featured:p.featured,trending:p.trending});setPSizes(p.sizes||[]);setPColors(p.colors||[]);setExImgs(p.images||[]);setEditId(p._id);setPFiles([]);setTab("add-product");window.scrollTo({top:0,behavior:"smooth"});};
  const delProd=async id=>{if(!window.confirm("Delete?"))return;await apiDeleteProduct(id);setProducts(ps=>ps.filter(p=>p._id!==id));toast("Deleted");};
  const updateSt=async(id,status)=>{await apiUpdateStatus(id,status);setOrders(os=>os.map(o=>o._id===id?{...o,status}:o));toast(`→ ${status}`);};
  const delImg=async pid=>{await apiDeleteProductImage(editId,pid);setExImgs(imgs=>imgs.filter(i=>i.public_id!==pid));toast("Image removed");};
  const createCoupon=async()=>{try{const r=await apiCreateCoupon({...cf,discount:Number(cf.discount),minOrder:Number(cf.minOrder)});setCoupons(c=>[r.data.coupon,...c]);setCf({code:"",type:"percent",discount:"",desc:"",minOrder:0});toast("Coupon created!");}catch(err){toast(err.response?.data?.message||"Error","error");}};
  const delCoupon=async id=>{await apiDeleteCoupon(id);setCoupons(cs=>cs.filter(c=>c._id!==id));toast("Deleted");};

  const goTab=k=>{setTab(k);if(isMobile)setDrawer(false);};
  const SIDE=[["overview","◈","Overview"],["orders","◻","Orders"],["products","◈","Products"],["add-product","＋","Add Product"],["inventory","📦","Inventory"],["customers","◉","Customers"],["analytics","◈","Analytics"],["coupons","◈","Coupons"],["categories","🏷","Categories"],["promo","🎁","Offer Banner"],["about-editor","📄","About Page"]];
  const iStyle={background:"var(--ivory2)",border:"1.5px solid var(--border2)",color:"var(--text)",padding:"10px 12px",fontSize:13,borderRadius:12,outline:"none",width:"100%",boxSizing:"border-box",fontWeight:500};
  const lStyle={display:"block",fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:.5,textTransform:"uppercase",marginBottom:6};

  return(
    <div style={{display:"flex",minHeight:"calc(100vh - 80px)",background:"var(--ivory)"}}>
      {isMobile&&<button onClick={()=>setDrawer(!drawer)} style={{position:"fixed",bottom:20,right:20,zIndex:600,background:"linear-gradient(135deg,var(--rose),var(--saffron))",border:"none",width:50,height:50,borderRadius:"50%",fontSize:20,color:"#fff",boxShadow:"0 6px 24px rgba(194,24,91,.4)"}}>⚙</button>}

      {/* Sidebar */}
      {(!isMobile||drawer)&&(
        <div style={{width:isMobile?"100vw":220,background:"#fff",borderRight:"1.5px solid var(--border)",paddingTop:20,flexShrink:0,position:isMobile?"fixed":"sticky",inset:isMobile?0:undefined,top:isMobile?0:80,height:isMobile?"100vh":"calc(100vh - 80px)",zIndex:isMobile?999:1,overflowY:"auto"}}>
          {isMobile&&<button onClick={()=>setDrawer(false)} style={{position:"absolute",top:16,right:16,background:"none",border:"none",color:"var(--muted)",fontSize:24,cursor:"pointer"}}>×</button>}
          <div style={{padding:"0 20px 16px",fontSize:9,letterSpacing:3,color:"var(--rose)",textTransform:"uppercase",fontWeight:800}}>Admin Console</div>
          {SIDE.map(([key,icon,label])=>(
            <button key={key} onClick={()=>goTab(key)} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 20px",background:tab===key?"var(--roseL)":"transparent",borderLeft:`3px solid ${tab===key?"var(--rose)":"transparent"}`,border:"none",color:tab===key?"var(--rose)":"var(--muted)",cursor:"pointer",fontSize:13,fontWeight:tab===key?700:500,textAlign:"left",transition:"all .2s"}}>
              <span style={{fontSize:15}}>{icon}</span>{label}
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
              {[["Total Revenue",fmt(stats.totalRevenue),"linear-gradient(135deg,var(--teal),#26A69A)"],["Orders",stats.totalOrders,"linear-gradient(135deg,var(--rose),var(--saffron))"],["Customers",stats.totalUsers,"linear-gradient(135deg,var(--purple),#AB47BC)"],["Products",stats.totalProducts,"linear-gradient(135deg,#1565C0,#1976D2)"]].map(([label,val,grad])=>(
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
          <AdminOrdersList orders={orders} isMobile={isMobile} iStyle={iStyle} updateSt={updateSt}/>
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
                    <img src={p.images?.[0]?.url||`https://placehold.co/72x88/FDF8F3/C2185B?text=P`} alt={p.name} style={{width:72,height:88,objectFit:"cover",borderRadius:10}}/>
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
                      <button onClick={()=>editProd(p)} style={{background:"var(--ivory2)",border:"1.5px solid var(--border2)",padding:"5px 14px",borderRadius:8,fontSize:11,cursor:"pointer",color:"var(--text)",fontWeight:600,transition:"all .2s"}}
                        onMouseEnter={e=>e.currentTarget.style.borderColor="var(--rose)"}
                        onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border2)"}>✏ Edit</button>
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
                    <button key={s} onClick={()=>setPSizes(ps=>ps.includes(s)?ps.filter(x=>x!==s):[...ps,s])} style={{padding:"7px 16px",border:`2px solid ${pSizes.includes(s)?"var(--rose)":"var(--border2)"}`,borderRadius:10,background:pSizes.includes(s)?"linear-gradient(135deg,var(--rose),var(--saffron))":"#fff",color:pSizes.includes(s)?"#fff":"var(--text2)",cursor:"pointer",fontSize:12,fontWeight:700,transition:"all .2s"}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:20}}>
                <label style={lStyle}>Colours</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {Object.keys(COLORS_MAP).map(c=>(
                    <button key={c} onClick={()=>setPColors(pc=>pc.includes(c)?pc.filter(x=>x!==c):[...pc,c])} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",border:`2px solid ${pColors.includes(c)?"var(--rose)":"var(--border2)"}`,borderRadius:10,background:pColors.includes(c)?"var(--roseL)":"#fff",cursor:"pointer",fontSize:12,fontWeight:600,color:pColors.includes(c)?"var(--rose)":"var(--text2)",transition:"all .2s"}}>
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
                        <div style={{height:"100%",width:`${(c.revenue/max)*100}%`,background:"linear-gradient(90deg,var(--rose),var(--saffron))",borderRadius:3,transition:"width 1s"}}/>
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
                    <img src={p.images?.[0]?.url||`https://placehold.co/36x44/FDF8F3/C2185B?text=P`} alt={p.name} style={{width:36,height:44,objectFit:"cover",borderRadius:8}}/>
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

        {/* CATEGORIES MANAGER */}
        {tab==="categories"&&(
          <CategoryManager toast={toast} liveCat={liveCat}/>
        )}

        {/* OFFER BANNER EDITOR */}
        {tab==="promo"&&(
          <PromoBannerEditor toast={toast}/>
        )}

        {/* ABOUT PAGE EDITOR */}
        {tab==="about-editor"&&(
          <AboutPageEditor toast={toast}/>
        )}
      </div>
    </div>
  );
};

/* ── PROMO BANNER EDITOR ─────────────────────────────────────────────────────── */
const PromoBannerEditor = ({ toast }) => {
  const {isMobile}=useBreakpoint();
  const live=usePromoData();
  const [form,setForm]=useState(()=>({...live}));
  const [saved,setSaved]=useState(false);

  useEffect(()=>{setForm({...live});},[live]);

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const save=()=>{
    updatePromo({...form});
    setSaved(true);
    toast("Offer banner updated! Changes are live on the homepage.");
    setTimeout(()=>setSaved(false),2500);
  };

  const reset=()=>{
    updatePromo({...DEFAULT_PROMO});
    setForm({...DEFAULT_PROMO});
    toast("Reset to default.");
  };

  const iS={background:"#fff",border:"1.5px solid var(--border2)",color:"var(--text)",padding:"11px 14px",fontSize:13,borderRadius:11,outline:"none",width:"100%",boxSizing:"border-box",fontWeight:500,fontFamily:"var(--font-b)",transition:"border-color .2s"};

  return(
    <div>
      <h2 style={{fontFamily:"var(--font-d)",color:"var(--dark)",marginBottom:6,fontSize:28,fontWeight:700}}>Offer Banner Editor</h2>
      <p style={{color:"var(--muted)",fontSize:13,marginBottom:24,fontWeight:500}}>Edit the promotional banner shown on the homepage. Changes go live instantly.</p>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:18,alignItems:"start"}}>

        {/* Form */}
        <div style={{background:"#fff",borderRadius:"16px",border:"1.5px solid var(--border)",padding:24,boxShadow:"0 2px 12px rgba(194,24,91,.06)"}}>

          {/* Active toggle */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:form.active?"var(--tealL)":"var(--ivory3)",borderRadius:12,marginBottom:20,border:"1.5px solid var(--border)"}}>
            <div>
              <div style={{fontWeight:700,fontSize:14,color:"var(--dark)"}}>Banner Visibility</div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{form.active?"Visible on homepage":"Hidden from homepage"}</div>
            </div>
            <button onClick={()=>set("active",!form.active)} style={{
              width:48,height:26,borderRadius:13,border:"none",cursor:"pointer",
              background:form.active?"linear-gradient(135deg,var(--teal),#26A69A)":"var(--border2)",
              position:"relative",transition:"all .3s",flexShrink:0
            }}>
              <div style={{position:"absolute",top:3,left:form.active?26:3,width:20,height:20,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,.2)",transition:"left .3s"}}/>
            </button>
          </div>

          {[
            ["Tag Line (badge text)","tag","e.g. ⏰ Limited Time"],
            ["Main Heading","heading","e.g. Women's Day Special"],
            ["Sub Heading (highlighted)","subheading","e.g. Flat 25% Off"],
            ["Body Text","body","e.g. Use code"],
            ["Coupon Code","code","e.g. WOMENSDAY25"],
            ["Code Description","codeDesc","e.g. on all ethnic wear"],
            ["Button Label","btnLabel","e.g. Shop Now"],
          ].map(([label,key,ph])=>(
            <div key={key} style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:.5,textTransform:"uppercase",marginBottom:6}}>{label}</label>
              <input value={form[key]||""} onChange={e=>set(key,e.target.value)} placeholder={ph} style={iS}
                onFocus={e=>e.target.style.borderColor="var(--rose)"}
                onBlur={e=>e.target.style.borderColor="var(--border2)"}/>
            </div>
          ))}

          <div style={{display:"flex",gap:10,marginTop:20}}>
            <button onClick={save} style={{flex:2,padding:"13px 0",background:saved?"linear-gradient(135deg,var(--teal),#26A69A)":"linear-gradient(135deg,var(--rose),var(--saffron))",border:"none",borderRadius:11,color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",transition:"all .3s"}}>
              {saved?"✓ Saved!":"Save & Go Live"}
            </button>
            <button onClick={reset} style={{flex:1,padding:"13px 0",background:"var(--ivory2)",border:"1.5px solid var(--border2)",borderRadius:11,color:"var(--muted)",fontWeight:600,fontSize:13,cursor:"pointer"}}>
              Reset
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div>
          <div style={{fontSize:11,fontWeight:800,color:"var(--rose)",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Live Preview</div>
          {form.active?(
            <div style={{borderRadius:"20px",background:"linear-gradient(135deg,var(--dark) 0%,var(--dark2) 40%,#3D1500 100%)",padding:isMobile?"28px 20px":"36px 32px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"radial-gradient(circle,rgba(249,168,37,.12) 0%,transparent 70%)"}}/>
              <div style={{position:"relative"}}>
                <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 13px",borderRadius:99,background:"rgba(249,168,37,.15)",color:"#F9A825",border:"1px solid rgba(249,168,37,.25)",fontSize:11,fontWeight:700,marginBottom:12}}>{form.tag||"Tag"}</span>
                <div style={{fontFamily:"var(--font-d)",fontSize:isMobile?22:32,fontWeight:700,color:"#fff",lineHeight:1.2,marginBottom:10}}>
                  {form.heading||"Heading"} —<br/><em style={{color:"var(--gold)"}}>{form.subheading||"Subheading"}</em>
                </div>
                <p style={{color:"rgba(255,255,255,.7)",fontSize:13,lineHeight:1.7,marginBottom:16}}>
                  {form.body} <strong style={{background:"rgba(255,255,255,.12)",padding:"2px 8px",borderRadius:5,fontFamily:"monospace",color:"#F9A825",fontSize:13,letterSpacing:1}}>{form.code||"CODE"}</strong> {form.codeDesc}
                </p>
                <div style={{display:"inline-block",padding:"11px 24px",background:"linear-gradient(135deg,var(--saffron),var(--gold))",borderRadius:12,color:"#fff",fontWeight:700,fontSize:13}}>{form.btnLabel||"Shop Now"}</div>
              </div>
            </div>
          ):(
            <div style={{borderRadius:"20px",background:"var(--ivory3)",border:"2px dashed var(--border2)",padding:"36px 24px",textAlign:"center"}}>
              <div style={{fontSize:36,marginBottom:10}}>🚫</div>
              <div style={{fontWeight:700,color:"var(--muted)",fontSize:14}}>Banner is hidden</div>
              <div style={{fontSize:12,color:"var(--muted)",marginTop:4}}>Toggle visibility above to show it.</div>
            </div>
          )}

          <div style={{marginTop:14,padding:"12px 16px",background:"var(--ivory2)",borderRadius:12,fontSize:12,color:"var(--muted)",lineHeight:1.7,border:"1.5px solid var(--border)"}}>
            💡 <strong>Tips:</strong> Use emoji in the tag line (🎉🌸🖤). Change the heading for each festival — Women's Day, Diwali, Black Friday, etc. Toggle off when no offer is running.
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── ABOUT PAGE EDITOR ───────────────────────────────────────────────────────── */
const AboutPageEditor = ({ toast }) => {
  const {isMobile}=useBreakpoint();
  const live=useAboutData();
  const [form,setForm]=useState(()=>JSON.parse(JSON.stringify(live)));
  const [saved,setSaved]=useState(false);
  const [featEdit,setFeatEdit]=useState(null); // index being edited

  useEffect(()=>{setForm(JSON.parse(JSON.stringify(live)));},[live]);

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const save=()=>{
    updateAbout({...form});
    setSaved(true);
    toast("About page updated! Changes are live.");
    setTimeout(()=>setSaved(false),2500);
  };

  const reset=()=>{
    updateAbout(JSON.parse(JSON.stringify(DEFAULT_ABOUT)));
    setForm(JSON.parse(JSON.stringify(DEFAULT_ABOUT)));
    toast("Reset to default.");
  };

  const setFeat=(i,k,v)=>{
    const feats=[...(form.features||[])];
    feats[i]={...feats[i],[k]:v};
    set("features",feats);
  };

  const addFeat=()=>set("features",[...(form.features||[]),{icon:"✨",title:"New Feature",desc:"Description here"}]);
  const delFeat=i=>set("features",(form.features||[]).filter((_,j)=>j!==i));

  const iS={background:"#fff",border:"1.5px solid var(--border2)",color:"var(--text)",padding:"10px 13px",fontSize:13,borderRadius:10,outline:"none",width:"100%",boxSizing:"border-box",fontWeight:500,fontFamily:"var(--font-b)"};
  const lS={display:"block",fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:.5,textTransform:"uppercase",marginBottom:6};
  const FEAT_BGS=["var(--roseL)","var(--tealL)","var(--saffronL)","var(--purpleL)"];

  return(
    <div>
      <h2 style={{fontFamily:"var(--font-d)",color:"var(--dark)",marginBottom:6,fontSize:28,fontWeight:700}}>About Page Editor</h2>
      <p style={{color:"var(--muted)",fontSize:13,marginBottom:24,fontWeight:500}}>Edit all content on the About page. Changes go live instantly.</p>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:18,alignItems:"start"}}>

        {/* LEFT — form fields */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>

          {/* Hero section */}
          <div style={{background:"#fff",borderRadius:"16px",border:"1.5px solid var(--border)",padding:20}}>
            <div style={{fontSize:11,fontWeight:800,color:"var(--rose)",letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>Hero Section</div>
            {[
              ["Section Label","heroLabel"],
              ["Main Heading","heroHeading"],
              ["Heading Accent (rose coloured)","heroHeadingAccent"],
            ].map(([label,key])=>(
              <div key={key} style={{marginBottom:12}}>
                <label style={lS}>{label}</label>
                <input value={form[key]||""} onChange={e=>set(key,e.target.value)} style={iS}
                  onFocus={e=>e.target.style.borderColor="var(--rose)"}
                  onBlur={e=>e.target.style.borderColor="var(--border2)"}/>
              </div>
            ))}
            <div style={{marginBottom:12}}>
              <label style={lS}>Hero Body Text</label>
              <textarea value={form.heroBody||""} onChange={e=>set("heroBody",e.target.value)} rows={3}
                style={{...iS,resize:"vertical"}}
                onFocus={e=>e.target.style.borderColor="var(--rose)"}
                onBlur={e=>e.target.style.borderColor="var(--border2)"}/>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <div>
                <label style={lS}>Decorative Emoji</label>
                <input value={form.emoji||"🌿"} onChange={e=>set("emoji",e.target.value)} style={{...iS,width:70,fontSize:24,textAlign:"center"}} maxLength={4}/>
              </div>
            </div>
          </div>

          {/* Mission section */}
          <div style={{background:"#fff",borderRadius:"16px",border:"1.5px solid var(--border)",padding:20}}>
            <div style={{fontSize:11,fontWeight:800,color:"var(--rose)",letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>Mission Section</div>
            {[
              ["Section Label","missionLabel"],
              ["Mission Heading","missionHeading"],
            ].map(([label,key])=>(
              <div key={key} style={{marginBottom:12}}>
                <label style={lS}>{label}</label>
                <input value={form[key]||""} onChange={e=>set(key,e.target.value)} style={iS}
                  onFocus={e=>e.target.style.borderColor="var(--rose)"}
                  onBlur={e=>e.target.style.borderColor="var(--border2)"}/>
              </div>
            ))}
            <div style={{marginBottom:12}}>
              <label style={lS}>Paragraph 1</label>
              <textarea value={form.missionP1||""} onChange={e=>set("missionP1",e.target.value)} rows={3} style={{...iS,resize:"vertical"}}
                onFocus={e=>e.target.style.borderColor="var(--rose)"}
                onBlur={e=>e.target.style.borderColor="var(--border2)"}/>
            </div>
            <div>
              <label style={lS}>Paragraph 2</label>
              <textarea value={form.missionP2||""} onChange={e=>set("missionP2",e.target.value)} rows={3} style={{...iS,resize:"vertical"}}
                onFocus={e=>e.target.style.borderColor="var(--rose)"}
                onBlur={e=>e.target.style.borderColor="var(--border2)"}/>
            </div>
          </div>

          {/* Feature cards */}
          <div style={{background:"#fff",borderRadius:"16px",border:"1.5px solid var(--border)",padding:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:800,color:"var(--rose)",letterSpacing:1,textTransform:"uppercase"}}>Feature Cards ({(form.features||[]).length})</div>
              <button onClick={addFeat} style={{background:"var(--roseL)",border:"1.5px solid var(--rose)",color:"var(--rose)",borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Add</button>
            </div>
            {(form.features||[]).map((f,i)=>(
              <div key={i} style={{marginBottom:10,padding:12,background:"var(--ivory2)",borderRadius:10,border:"1.5px solid var(--border)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <input value={f.icon} onChange={e=>setFeat(i,"icon",e.target.value)} style={{...iS,width:48,fontSize:20,textAlign:"center",padding:"6px"}} maxLength={4}/>
                  <input value={f.title} onChange={e=>setFeat(i,"title",e.target.value)} placeholder="Title" style={{...iS,flex:1}}/>
                  <button onClick={()=>delFeat(i)} style={{background:"none",border:"none",color:"#EF4444",fontSize:18,cursor:"pointer",flexShrink:0,padding:"0 4px"}}>×</button>
                </div>
                <input value={f.desc} onChange={e=>setFeat(i,"desc",e.target.value)} placeholder="Description" style={iS}/>
              </div>
            ))}
          </div>

          <div style={{display:"flex",gap:10}}>
            <button onClick={save} style={{flex:2,padding:"13px 0",background:saved?"linear-gradient(135deg,var(--teal),#26A69A)":"linear-gradient(135deg,var(--rose),var(--saffron))",border:"none",borderRadius:11,color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",transition:"all .3s"}}>
              {saved?"✓ Saved!":"Save & Go Live"}
            </button>
            <button onClick={reset} style={{flex:1,padding:"13px 0",background:"var(--ivory2)",border:"1.5px solid var(--border2)",borderRadius:11,color:"var(--muted)",fontWeight:600,fontSize:13,cursor:"pointer"}}>
              Reset
            </button>
          </div>
        </div>

        {/* RIGHT — mini preview */}
        <div>
          <div style={{fontSize:11,fontWeight:800,color:"var(--rose)",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Live Preview</div>
          <div style={{borderRadius:"16px",overflow:"hidden",border:"1.5px solid var(--border)",boxShadow:"0 4px 20px rgba(0,0,0,.06)"}}>
            {/* Hero preview */}
            <div style={{background:"linear-gradient(160deg,var(--roseL) 0%,var(--saffronL) 60%,var(--tealL) 100%)",padding:"28px 24px"}}>
              <div style={{fontSize:9,fontWeight:800,color:"var(--rose)",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>{form.heroLabel}</div>
              <div style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:700,color:"var(--dark)",lineHeight:1.2,marginBottom:8}}>
                {form.heroHeading}<br/><span style={{color:"var(--rose)"}}>{form.heroHeadingAccent}</span>
              </div>
              <p style={{fontSize:12,color:"var(--text2)",lineHeight:1.7,maxWidth:300}}>{form.heroBody}</p>
            </div>
            {/* Mission preview */}
            <div style={{background:"#fff",padding:"20px 24px",borderTop:"1.5px solid var(--border)"}}>
              <div style={{fontSize:9,fontWeight:800,color:"var(--rose)",letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>{form.missionLabel}</div>
              <div style={{fontFamily:"var(--font-d)",fontSize:17,fontWeight:700,color:"var(--dark)",marginBottom:8}}>{form.missionHeading}</div>
              <p style={{fontSize:12,color:"var(--text2)",lineHeight:1.6,marginBottom:6}}>{form.missionP1}</p>
              <p style={{fontSize:12,color:"var(--text2)",lineHeight:1.6}}>{form.missionP2}</p>
            </div>
            {/* Feature cards preview */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderTop:"1.5px solid var(--border)"}}>
              {(form.features||[]).slice(0,4).map((f,i)=>(
                <div key={i} style={{padding:"16px 14px",textAlign:"center",background:"var(--cream)",borderRight:i%2===0?"1px solid var(--border)":"none",borderBottom:i<2?"1px solid var(--border)":"none"}}>
                  <div style={{fontSize:22,marginBottom:6}}>{f.icon}</div>
                  <div style={{fontFamily:"var(--font-d)",fontSize:12,fontWeight:700,color:"var(--dark)",marginBottom:4}}>{f.title}</div>
                  <div style={{fontSize:10,color:"var(--muted)"}}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── CATEGORY MANAGER ────────────────────────────────────────────────────────── */
const GRAD_PRESETS = [
  "linear-gradient(135deg,#C2185B,#E91E8C)","linear-gradient(135deg,#6A1B9A,#AB47BC)",
  "linear-gradient(135deg,#E65100,#F9A825)","linear-gradient(135deg,#00695C,#26A69A)",
  "linear-gradient(135deg,#1565C0,#42A5F5)","linear-gradient(135deg,#2E7D32,#66BB6A)",
  "linear-gradient(135deg,#BF360C,#FF7043)","linear-gradient(135deg,#880E4F,#F06292)",
  "linear-gradient(135deg,#4527A0,#7C4DFF)","linear-gradient(135deg,#00838F,#4DD0E1)",
];

const CategoryManager = ({ toast }) => {
  const {isMobile}=useBreakpoint();
  const liveCat=useCatConfig();
  const [cfg,setCfg]=useState(()=>JSON.parse(JSON.stringify(liveCat)));
  const [selCat,setSelCat]=useState(Object.keys(liveCat)[0]||"");
  const [newName,setNewName]=useState("");
  const [newIcon,setNewIcon]=useState("🛍️");
  const [newGrad,setNewGrad]=useState(GRAD_PRESETS[0]);
  const [newLight,setNewLight]=useState("#FCE4EC");
  const [newSub,setNewSub]=useState("");
  const [confirmDel,setConfirmDel]=useState(null);

  useEffect(()=>{setCfg(JSON.parse(JSON.stringify(liveCat)));},[liveCat]);

  const save=(newCfg)=>{updateGlobalCat(newCfg);setCfg({...newCfg});toast("Saved! Changes applied site-wide.");};

  const addCat=()=>{
    const n=newName.trim();
    if(!n){toast("Enter a name","error");return;}
    if(cfg[n]){toast("Already exists","error");return;}
    save({...cfg,[n]:{icon:newIcon,grad:newGrad,light:newLight,subs:[]}});
    setSelCat(n);setNewName("");setNewIcon("🛍️");
  };

  const delCat=(name)=>{
    const c={...cfg};delete c[name];
    save(c);setSelCat(Object.keys(c)[0]||"");setConfirmDel(null);
  };

  const addSub=()=>{
    const s=newSub.trim();if(!s||!selCat)return;
    if(cfg[selCat]?.subs?.includes(s)){toast("Already exists","error");return;}
    save({...cfg,[selCat]:{...cfg[selCat],subs:[...(cfg[selCat]?.subs||[]),s]}});
    setNewSub("");
  };

  const delSub=(cat,sub)=>save({...cfg,[cat]:{...cfg[cat],subs:cfg[cat].subs.filter(s=>s!==sub)}});

  const updateField=(cat,field,val)=>{const c={...cfg,[cat]:{...cfg[cat],[field]:val}};setCfg(c);};
  const commitField=()=>save({...cfg});

  const iS={background:"#fff",border:"1.5px solid var(--border2)",color:"var(--text)",padding:"10px 12px",fontSize:13,borderRadius:10,outline:"none",fontWeight:500};
  const cats=Object.keys(cfg);

  return(
    <div>
      <h2 style={{fontFamily:"var(--font-d)",color:"var(--dark)",marginBottom:6,fontSize:28,fontWeight:700}}>Category Manager</h2>
      <p style={{color:"var(--muted)",fontSize:13,marginBottom:24}}>Add, edit or delete categories and sub-categories. Changes apply site-wide instantly.</p>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"270px 1fr",gap:18,alignItems:"start"}}>

        {/* LEFT */}
        <div>
          {/* Add new */}
          <div style={{background:"#fff",borderRadius:"16px",border:"1.5px solid var(--border)",padding:18,marginBottom:14,boxShadow:"0 2px 12px rgba(194,24,91,.06)"}}>
            <div style={{fontSize:11,fontWeight:800,color:"var(--rose)",letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>+ New Category</div>
            <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Category name" style={{...iS,width:"100%",boxSizing:"border-box",marginBottom:10}}/>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{fontSize:10,fontWeight:700,color:"var(--muted)",flexShrink:0}}>Icon</span>
              <input value={newIcon} onChange={e=>setNewIcon(e.target.value)} style={{...iS,flex:1,fontSize:20,textAlign:"center"}} maxLength={4}/>
            </div>
            <div style={{fontSize:10,fontWeight:700,color:"var(--muted)",marginBottom:6}}>Gradient</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
              {GRAD_PRESETS.map(g=>(
                <div key={g} onClick={()=>setNewGrad(g)} style={{width:26,height:26,borderRadius:"50%",background:g,cursor:"pointer",border:newGrad===g?"3px solid #1a0a00":"3px solid transparent",boxShadow:"0 2px 6px rgba(0,0,0,.2)",transition:"all .15s"}}/>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <span style={{fontSize:10,fontWeight:700,color:"var(--muted)",flexShrink:0}}>BG Colour</span>
              <input type="color" value={newLight} onChange={e=>setNewLight(e.target.value)} style={{width:36,height:32,borderRadius:8,border:"1.5px solid var(--border2)",cursor:"pointer",padding:2}}/>
              <span style={{fontSize:11,color:"var(--muted)"}}>{newLight}</span>
            </div>
            {/* Preview */}
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,background:newLight,marginBottom:12,border:"1.5px dashed var(--border2)"}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:newGrad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{newIcon}</div>
              <span style={{fontSize:12,fontWeight:700,color:"var(--dark)"}}>{newName||"Preview"}</span>
            </div>
            <button onClick={addCat} style={{width:"100%",padding:"11px 0",background:"linear-gradient(135deg,var(--rose),var(--saffron))",border:"none",borderRadius:10,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>
              Add Category
            </button>
          </div>

          {/* List */}
          <div style={{background:"#fff",borderRadius:"16px",border:"1.5px solid var(--border)",overflow:"hidden"}}>
            <div style={{padding:"11px 16px",background:"linear-gradient(135deg,var(--roseL),var(--saffronL))",borderBottom:"1px solid var(--border)",fontSize:11,fontWeight:800,color:"var(--rose)",letterSpacing:1,textTransform:"uppercase"}}>
              Categories ({cats.length})
            </div>
            {cats.map(name=>(
              <div key={name} onClick={()=>setSelCat(name)} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",cursor:"pointer",background:selCat===name?"var(--roseL)":"#fff",borderLeft:`3px solid ${selCat===name?"var(--rose)":"transparent"}`,borderBottom:"1px solid var(--border)",transition:"all .15s"}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:cfg[name]?.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{cfg[name]?.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:selCat===name?700:500,color:selCat===name?"var(--rose)":"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
                  <div style={{fontSize:10,color:"var(--muted)"}}>{cfg[name]?.subs?.length||0} subs</div>
                </div>
                <button onClick={e=>{e.stopPropagation();setConfirmDel(name);}} style={{background:"none",border:"none",color:"#EF4444",cursor:"pointer",fontSize:15,padding:"2px 4px",opacity:.55,transition:"opacity .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity=".55"}>🗑</button>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — edit */}
        {selCat&&cfg[selCat]?(
          <div>
            <div style={{background:"#fff",borderRadius:"16px",border:"1.5px solid var(--border)",padding:22,marginBottom:14,boxShadow:"0 2px 12px rgba(194,24,91,.06)"}}>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18,paddingBottom:16,borderBottom:"1.5px solid var(--border)"}}>
                <div style={{width:50,height:50,borderRadius:"50%",background:cfg[selCat].grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{cfg[selCat].icon}</div>
                <div>
                  <div style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:700,color:"var(--dark)"}}>{selCat}</div>
                  <div style={{fontSize:12,color:"var(--muted)"}}>{cfg[selCat].subs?.length||0} sub-categories</div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:.5,textTransform:"uppercase",marginBottom:6}}>Icon</div>
                  <input value={cfg[selCat].icon} onChange={e=>updateField(selCat,"icon",e.target.value)} onBlur={commitField} style={{...iS,width:"100%",boxSizing:"border-box",fontSize:22,textAlign:"center"}} maxLength={4}/>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:.5,textTransform:"uppercase",marginBottom:6}}>Light BG</div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <input type="color" value={cfg[selCat].light} onChange={e=>updateField(selCat,"light",e.target.value)} onBlur={commitField} style={{width:40,height:36,borderRadius:8,border:"1.5px solid var(--border2)",cursor:"pointer",padding:2}}/>
                    <span style={{fontSize:11,color:"var(--muted)"}}>{cfg[selCat].light}</span>
                  </div>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:.5,textTransform:"uppercase",marginBottom:8}}>Gradient</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {GRAD_PRESETS.map(g=>(
                    <div key={g} onClick={()=>{updateField(selCat,"grad",g);setTimeout(commitField,50);}} style={{width:30,height:30,borderRadius:"50%",background:g,cursor:"pointer",border:cfg[selCat].grad===g?"3px solid #1a0a00":"3px solid transparent",boxShadow:"0 2px 6px rgba(0,0,0,.2)",transition:"all .15s"}}/>
                  ))}
                </div>
              </div>
            </div>

            {/* Sub-categories */}
            <div style={{background:"#fff",borderRadius:"16px",border:"1.5px solid var(--border)",padding:22}}>
              <div style={{fontFamily:"var(--font-d)",fontSize:18,fontWeight:700,color:"var(--dark)",marginBottom:14}}>
                Sub-Categories — <span style={{background:"linear-gradient(135deg,var(--rose),var(--saffron))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{selCat}</span>
              </div>
              <div style={{display:"flex",gap:8,marginBottom:16}}>
                <input value={newSub} onChange={e=>setNewSub(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addSub()} placeholder="New sub-category…" style={{...iS,flex:1}}/>
                <button onClick={addSub} style={{background:"linear-gradient(135deg,var(--rose),var(--saffron))",border:"none",padding:"10px 16px",borderRadius:10,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>+ Add</button>
              </div>
              {(!cfg[selCat]?.subs||cfg[selCat].subs.length===0)?(
                <div style={{textAlign:"center",padding:"24px 0",color:"var(--muted)",fontSize:13}}>No sub-categories yet.</div>
              ):(
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {cfg[selCat].subs.map(sub=>(
                    <div key={sub} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:99,background:cfg[selCat].light,border:"1.5px solid var(--border2)"}}>
                      <span style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{sub}</span>
                      <button onClick={()=>delSub(selCat,sub)} style={{background:"none",border:"none",cursor:"pointer",color:"#EF4444",fontSize:16,lineHeight:1,padding:0,marginLeft:2}}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ):(
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:180,color:"var(--muted)",fontSize:14}}>Select a category to edit</div>
        )}
      </div>

      {/* Delete confirm modal */}
      {confirmDel&&(
        <div style={{position:"fixed",inset:0,background:"rgba(26,10,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,backdropFilter:"blur(4px)"}}>
          <div style={{background:"#fff",borderRadius:"20px",padding:28,maxWidth:360,width:"90%",textAlign:"center",boxShadow:"0 24px 64px rgba(0,0,0,.25)"}}>
            <div style={{fontSize:44,marginBottom:12}}>🗑️</div>
            <h3 style={{fontFamily:"var(--font-d)",fontSize:22,color:"var(--dark)",marginBottom:8,fontWeight:700}}>Delete Category?</h3>
            <p style={{color:"var(--muted)",fontSize:13,lineHeight:1.75,marginBottom:20}}>
              Delete <strong style={{color:"var(--rose)"}}>{confirmDel}</strong>? This removes it from the site. Existing products are not deleted.
            </p>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>setConfirmDel(null)} style={{padding:"11px 24px",borderRadius:12,background:"var(--ivory2)",border:"1.5px solid var(--border2)",fontWeight:700,fontSize:13,cursor:"pointer",color:"var(--text)"}}>Cancel</button>
              <button onClick={()=>delCat(confirmDel)} style={{padding:"11px 24px",borderRadius:12,background:"linear-gradient(135deg,#EF4444,#DC2626)",border:"none",fontWeight:700,fontSize:13,cursor:"pointer",color:"#fff",boxShadow:"0 4px 16px rgba(239,68,68,.3)"}}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── FOOTER ──────────────────────────────────────────────────────────────────── */
const Footer = ({ setPage }) => {
  const {isMobile}=useBreakpoint();
  return(
    <footer style={{background:"var(--dark)",borderTop:"2px solid var(--dark2)"}}>
      <div style={{maxWidth:1440,margin:"0 auto",padding:isMobile?"44px 24px 24px":"64px 80px 28px"}}>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"2fr 1fr 1fr 1fr",gap:isMobile?28:48,marginBottom:44}}>
          <div style={{gridColumn:isMobile?"1/-1":"auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
              <img src="/bv.jpg" alt="BanyanVision" style={{width:52,height:52,objectFit:"contain",borderRadius:0,background:"transparent"}}/>
              <div>
                <div style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:700,color:"#fff",letterSpacing:.5}}>BanyanVision</div>
                <div style={{fontSize:8,fontWeight:700,letterSpacing:3,color:"rgba(255,255,255,.4)",textTransform:"uppercase"}}>Empowering Dreams, Inspiring Innovations</div>
              </div>
            </div>
            <p style={{fontSize:13,color:"rgba(255,255,255,.55)",lineHeight:1.85,maxWidth:280,fontWeight:400,marginBottom:16}}>India's finest handcrafted fashion. Powered by MongoDB, Express, React & Razorpay.</p>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["🔒 Razorpay","☁ Cloudinary","🍃 MongoDB"].map(b=>(
                <div key={b} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",padding:"4px 10px",borderRadius:8,fontSize:10,color:"rgba(255,255,255,.55)",fontWeight:600}}>{b}</div>
              ))}
            </div>
          </div>
          {[{title:"Shop",links:["Kurtas & Sets","Sarees","Lehengas","Western Wear","Accessories"]},{title:"Company",links:["About Us","Our Artisans","Sustainability","Press"]},{title:"Help",links:["Size Guide","Returns","Track Order","Contact"]}].map(col=>(
            <div key={col.title}>
              <div style={{fontSize:10,letterSpacing:2.5,color:"var(--rose)",textTransform:"uppercase",fontWeight:800,marginBottom:16}}>{col.title}</div>
              {col.links.map(link=>(
                <div key={link} onClick={()=>setPage("shop")} style={{marginBottom:10,fontSize:13,color:"rgba(255,255,255,.5)",cursor:"pointer",lineHeight:1.6,fontWeight:400,transition:"color .2s"}}
                  onMouseEnter={e=>e.target.style.color="var(--rose)"}
                  onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.5)"}>
                  {link}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{borderTop:"1px solid rgba(255,255,255,.07)",paddingTop:22,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
          <div style={{fontSize:12,color:"rgba(255,255,255,.35)",fontWeight:400}}>© 2025 BanyanVision. Empowering Dreams, Inspiring Innovations.</div>
          <div style={{display:"flex",gap:20,fontSize:12,color:"rgba(255,255,255,.35)"}}>
            {["Privacy","Terms","Shipping Policy"].map(t=>(
              <span key={t} style={{cursor:"pointer",transition:"color .2s"}}
                onMouseEnter={e=>e.target.style.color="var(--rose)"}
                onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.35)"}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

/* ── APP SHELL ───────────────────────────────────────────────────────────────── */
function AppShell() {
  const [page,setPage]=useState("home");
  const {toasts,toast}=useToast();
  const {user,loading}=useAuth();
  const navigate=useCallback(p=>{setPage(p);window.scrollTo({top:0,behavior:"smooth"});},[]);

  useEffect(()=>{
    if(loading)return;
    if((page==="orders"||page==="profile"||page==="checkout")&&!user)navigate("login");
    if(page==="admin"&&user?.role!=="admin")navigate("home");
  },[page,user,loading,navigate]);

  const isProduct=page.startsWith("product-");
  const isSuccess=page.startsWith("order-success-");
  const productId=isProduct?page.replace("product-",""):null;
  const successId=isSuccess?page.replace("order-success-",""):null;

  if(loading)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--ivory)",flexDirection:"column",gap:20}}>
      <img src="/bv.jpg" alt="BanyanVision" style={{width:100,height:100,objectFit:"contain",borderRadius:0,background:"transparent",animation:"float 2s ease-in-out infinite"}}/>
      <div style={{width:40,height:40,border:"3px solid var(--border2)",borderTop:"3px solid var(--rose)",borderRight:"3px solid var(--saffron)",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}"}</style>
    </div>
  );

  return(
    <div style={{fontFamily:"var(--font-b)",background:"var(--ivory)",minHeight:"100vh"}}>
      <style>{GLOBAL_CSS}</style>
      <Header page={page} setPage={navigate}/>
      <main>
        {page==="home"&&<HomePage setPage={navigate} toast={toast}/>}
        {page==="shop"&&<ShopPage setPage={navigate} toast={toast}/>}
        {page==="about"&&<AboutPage setPage={navigate}/>}
        {page==="cart"&&<CartPage setPage={navigate} toast={toast}/>}
        {page==="checkout"&&user&&<CheckoutPage setPage={navigate} toast={toast}/>}
        {page==="orders"&&user&&<OrdersPage setPage={navigate}/>}
        {page==="wishlist"&&<WishlistPage setPage={navigate} toast={toast}/>}
        {page==="profile"&&user&&<ProfilePage toast={toast}/>}
        {page==="login"&&<LoginPage setPage={navigate} toast={toast}/>}
        {page==="admin"&&user?.role==="admin"&&<AdminDashboard setPage={navigate} toast={toast}/>}
        {isProduct&&<ProductDetailPage productId={productId} setPage={navigate} toast={toast}/>}
        {isSuccess&&<OrderSuccessPage orderId={successId} setPage={navigate}/>}
      </main>
      <Footer setPage={navigate}/>
      <ToastBox toasts={toasts}/>
    </div>
  );
}

export default function App() {
  return(
    <AuthProvider>
      <CartProvider>
        <AppShell/>
      </CartProvider>
    </AuthProvider>
  );
}
