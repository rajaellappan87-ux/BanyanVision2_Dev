import React, { useState, useEffect } from "react";
import { useBreakpoint } from "../hooks";
import { useCatConfig } from "../store/catStore";
import { Ic, fmt } from "../utils/helpers";
import { apiGetProducts } from "../api";
import ProductCard from "../components/ui/ProductCard";
import { Search, Filter, SortAsc } from "lucide-react";
import { Spinner, SecLabel } from "../components/ui/Common";

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
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--muted)",fontSize:16}}><Ic icon={Search} size={16}/></span>
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
            <div style={{fontSize:60,marginBottom:16}}><Ic icon={Search} size={16}/></div>
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

export default ShopPage;