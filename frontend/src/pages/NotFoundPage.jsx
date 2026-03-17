import React from "react";
import { useBreakpoint } from "../hooks";
import { Ic } from "../utils/helpers";
import { Scissors } from "lucide-react";

/* ── 404 NOT FOUND PAGE ──────────────────────────────────────────────────────── */
const NotFoundPage = ({ setPage }) => {
  const {isMobile}=useBreakpoint();
  return (
    <div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:40,textAlign:"center"}}>
      <Ic icon={Scissors} size={isMobile?64:96} color="var(--border2)"/>
      <h1 style={{fontFamily:"var(--font-d)",fontSize:isMobile?28:48,fontWeight:700,color:"var(--dark)",marginBottom:10,marginTop:20}}>Page Not Found</h1>
      <p style={{fontSize:15,color:"var(--muted)",maxWidth:400,lineHeight:1.7,marginBottom:28}}>Looks like this thread got tangled! The page you're looking for doesn't exist or has been moved.</p>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
        <button className="btn btn-rose" onClick={()=>setPage("home")} style={{padding:"13px 28px",fontSize:14}}>Go Home</button>
        <button className="btn btn-outline" onClick={()=>setPage("shop")} style={{padding:"13px 28px",fontSize:14}}>Browse Collections</button>
      </div>
    </div>
  );
};

export default NotFoundPage;