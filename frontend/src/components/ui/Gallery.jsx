import React, { useState } from "react";
import { useBreakpoint } from "../../hooks";

/* ── Product Gallery ─────────────────────────────────────────────────────────── */
const Gallery = ({ images, name }) => {
  const [active,setActive]=useState(0);
  const {isMobile}=useBreakpoint();
  if(!images?.length) return <div style={{background:"var(--ivory3)",borderRadius:"20px",height:isMobile?280:520,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)",fontSize:13}}>No images</div>;
  return (
    <div>
      <div style={{borderRadius:"20px",overflow:"hidden",position:"relative",background:"var(--ivory3)"}}>
        <img src={images[active]?.url} alt={name} loading="lazy" style={{width:"100%",height:isMobile?310:530,objectFit:"cover",display:"block",transition:"opacity .3s"}}/>
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

export default Gallery;