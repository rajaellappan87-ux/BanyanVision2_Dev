import React, { useState, useRef, useEffect, useCallback } from "react";
import { useBreakpoint } from "../../hooks";

/* ── Lightbox (zoom modal) ────────────────────────────────────────────────── */
const Lightbox = ({ images, startIndex, onClose }) => {
  const [idx, setIdx]       = useState(startIndex);
  const [scale, setScale]   = useState(1);
  const [pos, setPos]       = useState({ x: 0, y: 0 });
  const [drag, setDrag]     = useState(null);   // { startX, startY, ox, oy }
  const imgRef              = useRef(null);

  // Reset zoom when changing image
  useEffect(() => { setScale(1); setPos({ x: 0, y: 0 }); }, [idx]);

  // Wheel-to-zoom
  const onWheel = useCallback(e => {
    e.preventDefault();
    setScale(s => Math.min(5, Math.max(1, s - e.deltaY * 0.002)));
  }, []);

  useEffect(() => {
    const el = imgRef.current;
    if (el) { el.addEventListener("wheel", onWheel, { passive: false }); }
    return () => { if (el) el.removeEventListener("wheel", onWheel); };
  }, [onWheel]);

  // Drag to pan (when zoomed)
  const onMouseDown = e => {
    if (scale === 1) return;
    e.preventDefault();
    setDrag({ startX: e.clientX, startY: e.clientY, ox: pos.x, oy: pos.y });
  };
  const onMouseMove = e => {
    if (!drag) return;
    setPos({ x: drag.ox + (e.clientX - drag.startX), y: drag.oy + (e.clientY - drag.startY) });
  };
  const onMouseUp = () => setDrag(null);

  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(images.length - 1, i + 1));

  // Keyboard navigation
  useEffect(() => {
    const handler = e => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:9000, background:"rgba(0,0,0,.92)", display:"flex",
               alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      {/* Close */}
      <button onClick={onClose}
        style={{ position:"absolute", top:18, right:22, background:"rgba(255,255,255,.12)",
                 border:"none", color:"#fff", fontSize:24, width:44, height:44, borderRadius:"50%",
                 cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                 transition:"background .2s" }}
        onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,.25)"}
        onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,.12)"}>✕</button>

      {/* Counter */}
      <div style={{ position:"absolute", top:20, left:"50%", transform:"translateX(-50%)",
                    color:"rgba(255,255,255,.7)", fontSize:12, fontWeight:700,
                    background:"rgba(255,255,255,.1)", borderRadius:99, padding:"4px 14px" }}>
        {idx + 1} / {images.length}
      </div>

      {/* Zoom hint */}
      <div style={{ position:"absolute", bottom:20, left:"50%", transform:"translateX(-50%)",
                    color:"rgba(255,255,255,.45)", fontSize:11, fontWeight:600, letterSpacing:.3,
                    pointerEvents:"none" }}>
        Scroll to zoom · Drag to pan
      </div>

      {/* Prev */}
      {idx > 0 && (
        <button onClick={prev}
          style={{ position:"absolute", left:18, background:"rgba(255,255,255,.12)",
                   border:"none", color:"#fff", fontSize:28, width:52, height:52,
                   borderRadius:"50%", cursor:"pointer", display:"flex", alignItems:"center",
                   justifyContent:"center", transition:"background .2s" }}
          onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,.25)"}
          onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,.12)"}>‹</button>
      )}

      {/* Next */}
      {idx < images.length - 1 && (
        <button onClick={next}
          style={{ position:"absolute", right:18, background:"rgba(255,255,255,.12)",
                   border:"none", color:"#fff", fontSize:28, width:52, height:52,
                   borderRadius:"50%", cursor:"pointer", display:"flex", alignItems:"center",
                   justifyContent:"center", transition:"background .2s" }}
          onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,.25)"}
          onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,.12)"}>›</button>
      )}

      {/* Image */}
      <div ref={imgRef}
        style={{ maxWidth:"90vw", maxHeight:"90vh", overflow:"hidden",
                 cursor: scale > 1 ? (drag ? "grabbing" : "grab") : "zoom-in",
                 userSelect:"none" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}>
        <img
          src={images[idx]?.url}
          alt=""
          draggable={false}
          style={{ maxWidth:"88vw", maxHeight:"88vh", objectFit:"contain", display:"block",
                   transform:`scale(${scale}) translate(${pos.x / scale}px, ${pos.y / scale}px)`,
                   transition: drag ? "none" : "transform .15s ease",
                   transformOrigin:"center center" }}
        />
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div style={{ position:"absolute", bottom:44, left:"50%", transform:"translateX(-50%)",
                      display:"flex", gap:8 }}>
          {images.map((img, i) => (
            <div key={i} onClick={() => setIdx(i)}
              style={{ width:48, height:58, borderRadius:8, overflow:"hidden",
                       border:`2.5px solid ${i === idx ? "#fff" : "rgba(255,255,255,.25)"}`,
                       opacity: i === idx ? 1 : 0.55, cursor:"pointer",
                       transition:"all .2s", flexShrink:0 }}>
              <img src={img.url} alt="" style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Product Gallery ─────────────────────────────────────────────────────────── */
const Gallery = ({ images, name }) => {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const { isMobile } = useBreakpoint();

  if (!images?.length) return (
    <div style={{ background:"var(--ivory3)", borderRadius:"20px", aspectRatio:"9/11",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:"var(--muted)", fontSize:13 }}>No images</div>
  );

  return (
    <>
      <div>
        {/* Main image */}
        <div style={{ borderRadius:"20px", overflow:"hidden", position:"relative",
                      background:"var(--ivory2)", aspectRatio:"9/11", width:"100%",
                      cursor:"zoom-in" }}
          onClick={() => setLightbox(true)}>
          <img src={images[active]?.url} alt={name} loading="lazy"
            style={{ width:"100%", height:"100%", objectFit:"contain",
                     objectPosition:"center", display:"block", transition:"opacity .3s" }}/>

          {/* Zoom hint badge */}
          <div style={{ position:"absolute", top:12, left:12,
                        background:"rgba(26,10,0,.5)", color:"rgba(255,255,255,.85)",
                        borderRadius:99, padding:"4px 10px", fontSize:10, fontWeight:700,
                        display:"flex", alignItems:"center", gap:5,
                        backdropFilter:"blur(6px)", letterSpacing:.3, pointerEvents:"none" }}>
            🔍 Tap to zoom
          </div>

          {images.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setActive(a => Math.max(0, a - 1)); }}
                style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
                         background:"rgba(255,255,255,.92)", border:"none", borderRadius:"50%",
                         width:40, height:40, fontSize:22, boxShadow:"0 2px 12px rgba(0,0,0,.15)",
                         color:"var(--rose)", cursor:"pointer", display:"flex", alignItems:"center",
                         justifyContent:"center", backdropFilter:"blur(4px)" }}>‹</button>
              <button onClick={e => { e.stopPropagation(); setActive(a => Math.min(images.length - 1, a + 1)); }}
                style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                         background:"rgba(255,255,255,.92)", border:"none", borderRadius:"50%",
                         width:40, height:40, fontSize:22, boxShadow:"0 2px 12px rgba(0,0,0,.15)",
                         color:"var(--rose)", cursor:"pointer", display:"flex", alignItems:"center",
                         justifyContent:"center", backdropFilter:"blur(4px)" }}>›</button>
              <div style={{ position:"absolute", bottom:14, right:16,
                            background:"rgba(26,10,0,.55)", color:"#fff", borderRadius:99,
                            padding:"3px 10px", fontSize:11, fontWeight:700,
                            backdropFilter:"blur(8px)" }}>{active + 1}/{images.length}</div>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
            {images.map((img, i) => (
              <div key={i} onClick={() => setActive(i)}
                style={{ width:64, aspectRatio:"9/11", borderRadius:10, overflow:"hidden",
                         cursor:"pointer", border:`2.5px solid ${active === i ? "var(--rose)" : "transparent"}`,
                         opacity: active === i ? 1 : 0.6, transition:"all .2s",
                         background:"var(--ivory2)", flexShrink:0 }}>
                <img src={img.url} alt=""
                  style={{ width:"100%", height:"100%", objectFit:"contain", objectPosition:"center" }}/>
              </div>
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <Lightbox images={images} startIndex={active} onClose={() => setLightbox(false)} />
      )}
    </>
  );
};

export default Gallery;
