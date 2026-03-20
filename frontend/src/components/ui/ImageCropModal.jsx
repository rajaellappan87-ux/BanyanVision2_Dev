import React, { useState, useEffect, useRef } from "react";
import { Ic } from "../../utils/helpers";
import { Crop, Image as ImageIcon, Scissors, ZoomIn } from "lucide-react";

/* ── Image Cropper Modal ─────────────────────────────────────────────────────── */
const CROP_W = 900;
const CROP_H = 1100;
const CROP_RATIO = CROP_W / CROP_H; // 0.818...

const ImageCropModal = ({ src, onDone, onCancel }) => {
  const canvasRef  = useRef();
  const imgRef     = useRef();
  const containerRef = useRef();
  const [drag,  setDrag]  = useState(false);
  const [scale, setScale] = useState(1);
  const [pos,   setPos]   = useState({ x:0, y:0 });
  const [imgSize, setImgSize] = useState({ w:0, h:0 });
  const dragStart = useRef(null);

  // Container display size
  const DISP_W = 320;
  const DISP_H = Math.round(DISP_W / CROP_RATIO); // ~391

  // Load image and auto-fit
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      // Scale so image covers the crop area at minimum
      const scaleToFit = Math.max(DISP_W / img.naturalWidth, DISP_H / img.naturalHeight);
      const w = img.naturalWidth  * scaleToFit;
      const h = img.naturalHeight * scaleToFit;
      setImgSize({ w, h });
      setScale(1);
      setPos({ x: (DISP_W - w) / 2, y: (DISP_H - h) / 2 });
      imgRef.current = img;
    };
    img.src = src;
  }, [src]);

  const clampPos = (p, s) => {
    const w = imgSize.w * s;
    const h = imgSize.h * s;
    return {
      x: Math.min(0, Math.max(DISP_W - w, p.x)),
      y: Math.min(0, Math.max(DISP_H - h, p.y)),
    };
  };

  const onMouseDown = e => {
    e.preventDefault();
    setDrag(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
  };
  const onMouseMove = e => {
    if (!drag || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    setPos(clampPos({ x: dragStart.current.px + dx, y: dragStart.current.py + dy }, scale));
  };
  const onMouseUp = () => setDrag(false);

  // Touch support
  const onTouchStart = e => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    setDrag(true);
    dragStart.current = { mx: t.clientX, my: t.clientY, px: pos.x, py: pos.y };
  };
  const onTouchMove = e => {
    if (!drag || e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = t.clientX - dragStart.current.mx;
    const dy = t.clientY - dragStart.current.my;
    setPos(clampPos({ x: dragStart.current.px + dx, y: dragStart.current.py + dy }, scale));
  };

  const handleScale = v => {
    const s = Number(v);
    setScale(s);
    setPos(p => clampPos(p, s));
  };

  // Render cropped image to canvas → blob → File
  const applyCrop = () => {
    const canvas = document.createElement("canvas");
    canvas.width  = CROP_W;
    canvas.height = CROP_H;
    const ctx = canvas.getContext("2d");
    const displayToNatural = imgRef.current.naturalWidth / (imgSize.w * scale);
    const srcX = (-pos.x / scale) * displayToNatural;
    const srcY = (-pos.y / scale) * displayToNatural;
    const srcW = (DISP_W / scale) * displayToNatural;
    const srcH = (DISP_H / scale) * displayToNatural;
    ctx.drawImage(imgRef.current, srcX, srcY, srcW, srcH, 0, 0, CROP_W, CROP_H);
    canvas.toBlob(blob => {
      const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
      onDone(file, canvas.toDataURL("image/jpeg", 0.92));
    }, "image/jpeg", 0.92);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(26,10,0,.75)",zIndex:99999,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)",padding:16}}>
      <div style={{background:"#fff",borderRadius:20,padding:24,width:"100%",maxWidth:400,boxShadow:"0 24px 64px rgba(0,0,0,.3)"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontFamily:"var(--font-d)",fontSize:18,fontWeight:700,color:"var(--dark)"}}>Crop Image</div>
            <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>Drag to reposition · Zoom to fit · 9:11 ratio</div>
          </div>
          <button onClick={onCancel} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"var(--muted)"}}>×</button>
        </div>

        {/* Crop viewport */}
        <div ref={containerRef}
          style={{width:DISP_W,height:DISP_H,margin:"0 auto 16px",position:"relative",overflow:"hidden",
            borderRadius:10,background:"#111",cursor:drag?"grabbing":"grab",
            border:"2px solid var(--rose)",boxShadow:"0 4px 20px rgba(194,24,91,.2)",userSelect:"none"}}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={()=>setDrag(false)}>
          {imgRef.current && (
            <img src={src} alt="crop" draggable={false}
              style={{position:"absolute",
                width:imgSize.w * scale, height:imgSize.h * scale,
                left:pos.x, top:pos.y,
                pointerEvents:"none",userSelect:"none"}}/>
          )}
          {/* Grid overlay */}
          <div style={{position:"absolute",inset:0,pointerEvents:"none",
            backgroundImage:"linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px)",
            backgroundSize:`${DISP_W/3}px ${DISP_H/3}px`}}/>
          {/* Corner markers */}
          {[["0 0","0 0"],["0 auto","0 0"],["auto 0","0 0"],["auto auto","0 0"]].map((_,i)=>(
            <div key={i} style={{position:"absolute",
              top:   i<2?0:"auto", bottom: i>=2?0:"auto",
              left:  i%2===0?0:"auto", right: i%2===1?0:"auto",
              width:18,height:18,
              borderTop:   i<2?"2.5px solid var(--rose)":"none",
              borderBottom:i>=2?"2.5px solid var(--rose)":"none",
              borderLeft:  i%2===0?"2.5px solid var(--rose)":"none",
              borderRight: i%2===1?"2.5px solid var(--rose)":"none",
              borderRadius: i===0?"4px 0 0 0":i===1?"0 4px 0 0":i===2?"0 0 0 4px":"0 0 4px 0",
            }}/>
          ))}
          {/* Size label */}
          <div style={{position:"absolute",bottom:6,right:8,background:"rgba(0,0,0,.55)",color:"#fff",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:99,letterSpacing:.5}}>
            900 × 1100
          </div>
        </div>

        {/* Zoom slider */}
        <div style={{marginBottom:18}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,fontWeight:600,color:"var(--muted)",marginBottom:6}}>
            <span><Ic icon={ZoomIn} size={13}/>Zoom</span>
            <span>{Math.round(scale*100)}%</span>
          </div>
          <input type="range" min="1" max="3" step="0.01" value={scale}
            onChange={e=>handleScale(e.target.value)}
            style={{width:"100%",accentColor:"var(--rose)",cursor:"pointer"}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"var(--muted)",marginTop:3}}>
            <span>Fit</span><span>Max</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{display:"flex",gap:10}}>
          <button onClick={onCancel}
            style={{flex:1,padding:"11px 0",borderRadius:10,background:"var(--ivory2)",border:"1.5px solid var(--border2)",fontWeight:600,fontSize:13,cursor:"pointer",color:"var(--muted)"}}>
            Cancel
          </button>
          <button onClick={applyCrop}
            style={{flex:2,padding:"11px 0",borderRadius:10,background:"linear-gradient(135deg,var(--rose),var(--saffron))",border:"none",fontWeight:700,fontSize:13,cursor:"pointer",color:"#fff",boxShadow:"0 4px 16px rgba(194,24,91,.3)"}}>
            <span style={{display:"flex",alignItems:"center",gap:6}}><Ic icon={Crop} size={14}/>Apply Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Image Uploader with Crop ────────────────────────────────────────────────── */
const ImageUploader = ({ existingImages=[], onFilesChange, onDeleteExisting }) => {
  const [previews,  setPreviews]  = useState([]);  // [{url, file}]
  const [files,     setFiles]     = useState([]);
  const [cropSrc,   setCropSrc]   = useState(null); // raw src waiting to be cropped
  const [cropIdx,   setCropIdx]   = useState(null); // index to replace, or null = new
  const ref = useRef();

  const tot = existingImages.length + previews.length;

  // When files are selected → open cropper one by one
  const pick = e => {
    const sel = Array.from(e.target.files);
    e.target.value = "";
    if (tot + sel.length > 6) { alert("Maximum 6 images allowed"); return; }
    // Queue first file for cropping
    if (sel.length > 0) {
      const reader = new FileReader();
      reader.onload = ev => setCropSrc({ src: ev.target.result, queue: sel.slice(1) });
      reader.readAsDataURL(sel[0]);
    }
  };

  const onCropDone = (croppedFile, croppedDataUrl) => {
    const { queue } = cropSrc;
    // Add cropped image
    const newPreviews = [...previews, { url: croppedDataUrl, file: croppedFile }];
    const newFiles    = [...files, croppedFile];
    setPreviews(newPreviews);
    setFiles(newFiles);
    onFilesChange(newFiles);
    // Process next in queue if any
    if (queue && queue.length > 0) {
      const reader = new FileReader();
      reader.onload = ev => setCropSrc({ src: ev.target.result, queue: queue.slice(1) });
      reader.readAsDataURL(queue[0]);
    } else {
      setCropSrc(null);
    }
  };

  const onCropCancel = () => {
    setCropSrc(null);
    setCropIdx(null);
  };

  // Re-crop an existing new preview
  const reCrop = i => {
    setCropIdx(i);
    const reader = new FileReader();
    reader.onload = ev => setCropSrc({ src: ev.target.result, queue: [], recropIdx: i });
    reader.readAsDataURL(previews[i].file);
  };

  const onReCropDone = (croppedFile, croppedDataUrl) => {
    const i = cropSrc.recropIdx;
    const newPreviews = previews.map((p,j) => j===i ? { url: croppedDataUrl, file: croppedFile } : p);
    const newFiles    = files.map((f,j)    => j===i ? croppedFile : f);
    setPreviews(newPreviews);
    setFiles(newFiles);
    onFilesChange(newFiles);
    setCropSrc(null);
    setCropIdx(null);
  };

  const rem = i => {
    const np = previews.filter((_,j) => j!==i);
    const nf = files.filter((_,j)    => j!==i);
    setPreviews(np); setFiles(nf); onFilesChange(nf);
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:12,fontWeight:700,color:"var(--rose)"}}>Images ({tot}/6)</div>
        <div style={{fontSize:10,color:"var(--muted)",fontWeight:500}}>Recommended: 900×1100px · Portrait</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        {/* Existing saved images */}
        {existingImages.map((img,i) => (
          <div key={"ex"+i} style={{position:"relative",aspectRatio:"3/4",borderRadius:10,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,.1)"}}>
            <img src={img.url} alt="" loading="lazy" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            <button onClick={()=>onDeleteExisting?.(img.public_id)}
              style={{position:"absolute",top:5,right:5,background:"rgba(239,68,68,.9)",border:"none",color:"#fff",width:24,height:24,fontSize:14,borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 6px rgba(0,0,0,.3)"}}>×</button>
            <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,105,92,.85)",fontSize:9,color:"#fff",padding:"3px 0",textAlign:"center",fontWeight:700,letterSpacing:1}}>SAVED</div>
          </div>
        ))}

        {/* New cropped previews */}
        {previews.map((p,i) => (
          <div key={"nw"+i} style={{position:"relative",aspectRatio:"3/4",borderRadius:10,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,.1)"}}>
            <img src={p.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            {/* Re-crop button */}
            <button onClick={()=>reCrop(i)}
              style={{position:"absolute",top:5,left:5,background:"rgba(194,24,91,.9)",border:"none",color:"#fff",width:24,height:24,fontSize:11,borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 6px rgba(0,0,0,.3)"}}><Ic icon={Scissors} size={11}/></button>
            {/* Remove button */}
            <button onClick={()=>rem(i)}
              style={{position:"absolute",top:5,right:5,background:"rgba(239,68,68,.9)",border:"none",color:"#fff",width:24,height:24,fontSize:14,borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 6px rgba(0,0,0,.3)"}}>×</button>
            <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(194,24,91,.85)",fontSize:9,color:"#fff",padding:"3px 0",textAlign:"center",fontWeight:700,letterSpacing:1}}>CROPPED ✓</div>
          </div>
        ))}

        {/* Add photo button */}
        {tot < 6 && (
          <button onClick={()=>ref.current?.click()}
            style={{aspectRatio:"3/4",borderRadius:10,background:"var(--ivory2)",border:"2px dashed var(--rose)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"var(--rose)",gap:6,cursor:"pointer",transition:"all .2s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="var(--roseL)";e.currentTarget.style.borderStyle="solid";}}
            onMouseLeave={e=>{e.currentTarget.style.background="var(--ivory2)";e.currentTarget.style.borderStyle="dashed";}}>
            <span style={{fontSize:26,lineHeight:1}}>✂️</span>
            <span style={{fontSize:10,fontWeight:700}}>Add & Crop</span>
            <span style={{fontSize:9,color:"var(--muted)"}}>900×1100</span>
          </button>
        )}
      </div>

      <input ref={ref} type="file" multiple accept="image/*" onChange={pick} style={{display:"none"}}/>

      {/* Tip */}
      <div style={{marginTop:10,padding:"8px 12px",background:"var(--ivory2)",borderRadius:8,fontSize:11,color:"var(--muted)",display:"flex",alignItems:"center",gap:6}}>
        <span></span>
        <span>Drag image inside the cropper to reposition · Use zoom slider to fit · ✂ button on each photo to re-crop anytime</span>
      </div>

      {/* Crop modal */}
      {cropSrc && (
        <ImageCropModal
          src={cropSrc.src}
          onDone={cropSrc.recropIdx !== undefined ? onReCropDone : onCropDone}
          onCancel={onCropCancel}
        />
      )}
    </div>
  );
};

export { ImageCropModal, ImageUploader };