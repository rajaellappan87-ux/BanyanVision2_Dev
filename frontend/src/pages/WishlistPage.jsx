import React, { useState, useEffect } from "react";
import { useBreakpoint } from "../hooks";
import { Ic, fmt } from "../utils/helpers";
import { apiGetWishlist, apiToggleWishlist } from "../api";
import ProductCard from "../components/ui/ProductCard";
import { Heart } from "lucide-react";
import { Spinner } from "../components/ui/Common";

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
            <div style={{fontSize:52,marginBottom:14}}><Ic icon={Heart} size={20}/></div>
            <div style={{fontFamily:"var(--font-d)",fontSize:24,color:"var(--muted)",marginBottom:14}}>Nothing saved yet</div>
            <button className="btn btn-rose" onClick={()=>setPage("shop")} style={{padding:"12px 28px",fontSize:14}}>Browse Collections</button>
          </div>
        ):<div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:isMobile?10:20}}>{prods.map(p=><ProductCard key={p._id} p={p} setPage={setPage} toast={toast}/>)}</div>}
      </div>
    </div>
  );
};

export default WishlistPage;