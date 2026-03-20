import React, { useState } from "react";
;
import { Ic } from "../../utils/helpers";

/* ── Stars ─────────────────────────────────────────────────────────────────── */
const Stars = ({ rating, size=13, interactive=false, onRate }) => {
  const [hover, setHover] = useState(0);
  return (
    <span style={{display:"inline-flex",gap:1}}>
      {[1,2,3,4,5].map(i => (
        <span key={i}
          onClick={interactive ? () => onRate?.(i) : undefined}
          onMouseEnter={interactive ? () => setHover(i) : undefined}
          onMouseLeave={interactive ? () => setHover(0) : undefined}
          style={{cursor:interactive?"pointer":"default",
                  color:(hover||rating)>=i?"#F9A825":"#D4B89A",
                  fontSize:size, lineHeight:1}}>
          ★
        </span>
      ))}
    </span>
  );
};

/* ── ToastBox ───────────────────────────────────────────────────────────────── */
const ToastBox = ({ toasts }) => (
  <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",
               zIndex:99999,display:"flex",flexDirection:"column",gap:8,
               alignItems:"center",pointerEvents:"none"}}>
    {toasts.map(t => (
      <div key={t.id}
        style={{padding:"11px 22px",borderRadius:12,fontWeight:600,fontSize:13,
                color:"#fff",boxShadow:"0 8px 32px rgba(0,0,0,.2)",
                background:t.type==="error"
                  ? "linear-gradient(135deg,#EF4444,#DC2626)"
                  : "linear-gradient(135deg,#1A0A00,#3D1500)",
                animation:"slideUp .25s ease",maxWidth:360,textAlign:"center"}}>
        {t.msg}
      </div>
    ))}
    <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
  </div>
);

/* ── Spinner ────────────────────────────────────────────────────────────────── */
const Spinner = () => (
  <div style={{display:"flex",alignItems:"center",justifyContent:"center",
               padding:60,flexDirection:"column",gap:14}}>
    <div style={{width:36,height:36,border:"3px solid var(--border2)",
                 borderTop:"3px solid var(--rose)",borderRight:"3px solid var(--saffron)",
                 borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
    <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
  </div>
);

/* ── SecLabel ───────────────────────────────────────────────────────────────── */
const SecLabel = ({ children }) => (
  <div style={{display:"inline-flex",alignItems:"center",gap:8,
               background:"linear-gradient(135deg,var(--roseL),var(--saffronL))",
               border:"1.5px solid var(--border)",borderRadius:99,
               padding:"6px 16px",fontSize:11,fontWeight:700,
               color:"var(--rose)",letterSpacing:1,textTransform:"uppercase"}}>
    {children}
  </div>
);

export { Stars, ToastBox, Spinner, SecLabel };
