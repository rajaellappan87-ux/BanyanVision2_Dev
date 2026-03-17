import React, { useState } from "react";
import { useBreakpoint } from "../../hooks";

/* ── Product Gallery ─────────────────────────────────────────────────────────── */
const Gallery = ({ images, name }) => {
  const [active,setActive]=useState(0);
  const {isMobile}=useBreakpoint();
  if(!images?.length) return (
    <div style={{background:"var(--ivory3)",borderRadius:"20px",aspectRatio:"9/11",
                 display:"flex",alignItems:"center",justifyContent:"center",
                 color:"var(--muted)",fontSize:13}}>No images</div>
  );
  return (
    <div>
      {/* Main image — aspect ratio 9:11 to match upload crop, contain so nothing is cut */}
      <div style={{borderRadius:"20px",overflow:"hidden",position:"relative",
                   background:"var(--ivory2)",aspectRatio:"9/11",width:"100%"}}>
        <img src={images[active]?.url} alt={name} loading="lazy"
          style={{width:"100%",height:"100%",objectFit:"contain",
                  objectPosition:"center",display:"block",
                  transition:"opacity .3s"}}/>
        {images.length>1&&(
          <>
            <button onClick={()=>setActive(a=>Math.max(0,a-1))}
              style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",
                      background:"rgba(255,255,255,.92)",border:"none",borderRadius:"50%",
                      width:40,height:40,fontSize:22,boxShadow:"0 2px 12px rgba(0,0,0,.15)",
                      color:"var(--rose)",cursor:"pointer",display:"flex",alignItems:"center",
                      justifyContent:"center",backdropFilter:"blur(4px)"}}>‹</button>
            <button onClick={()=>setActive(a=>Math.min(images.length-1,a+1))}
              style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                      background:"rgba(255,255,255,.92)",border:"none",borderRadius:"50%",
                      width:40,height:40,fontSize:22,boxShadow:"0 2px 12px rgba(0,0,0,.15)",
                      color:"var(--rose)",cursor:"pointer",display:"flex",alignItems:"center",
                      justifyContent:"center",backdropFilter:"blur(4px)"}}>›</button>
            <div style={{position:"absolute",bottom:14,right:16,
                         background:"rgba(26,10,0,.55)",color:"#fff",borderRadius:99,
                         padding:"3px 10px",fontSize:11,fontWeight:700,
                         backdropFilter:"blur(8px)"}}>{active+1}/{images.length}</div>
          </>
        )}
      </div>
      {/* Thumbnails — also contain so nothing is cut */}
      {images.length>1&&(
        <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
          {images.map((img,i)=>(
            <div key={i} onClick={()=>setActive(i)}
              style={{width:64,aspectRatio:"9/11",borderRadius:10,overflow:"hidden",
                      cursor:"pointer",border:`2.5px solid ${active===i?"var(--rose)":"transparent"}`,
                      opacity:active===i?1:.6,transition:"all .2s",
                      background:"var(--ivory2)",flexShrink:0}}>
              <img src={img.url} alt=""
                style={{width:"100%",height:"100%",objectFit:"contain",
                        objectPosition:"center"}}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery;