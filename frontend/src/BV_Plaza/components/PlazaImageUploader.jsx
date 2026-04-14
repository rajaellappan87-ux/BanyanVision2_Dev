/**
 * BV_Plaza/frontend/components/PlazaImageUploader.jsx
 * Image uploader with crop for BV Plaza — up to maxImages per product, 1 for logo.
 * Uploads immediately after crop. Calls onImagesChange with [{url, public_id}] list.
 */
import React, { useState, useRef } from "react";
import { ImageCropModal } from "../../components/ui/ImageCropModal";
import { apiPlazaUploadProductImage, apiPlazaDeleteProductImage, apiPlazaUploadLogo } from "../plazaApi";

// ── Product image uploader (up to 4 images) ───────────────────────────────────
export const PlazaProductImages = ({ images = [], onChange, maxImages = 4 }) => {
  // images: [{url, public_id}] — saved in DB or just uploaded
  const [cropSrc,   setCropSrc]   = useState(null); // {src, replaceIdx?}
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const pickFile = (replaceIdx) => {
    fileRef.current._replaceIdx = replaceIdx;
    fileRef.current.value = "";
    fileRef.current.click();
  };

  const onFileSelected = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const replaceIdx = fileRef.current._replaceIdx;
    const reader = new FileReader();
    reader.onload = ev => setCropSrc({ src: ev.target.result, replaceIdx });
    reader.readAsDataURL(file);
  };

  const onCropDone = async (croppedFile) => {
    const { replaceIdx } = cropSrc;
    setCropSrc(null);
    setUploading(true);
    try {
      const r = await apiPlazaUploadProductImage(croppedFile);
      const newImg = { url: r.data.url, public_id: r.data.public_id };
      if (replaceIdx !== undefined && replaceIdx !== null) {
        // Delete old image from Cloudinary
        const old = images[replaceIdx];
        if (old?.public_id) apiPlazaDeleteProductImage(old.public_id).catch(() => {});
        const updated = images.map((img, i) => i === replaceIdx ? newImg : img);
        onChange(updated);
      } else {
        onChange([...images, newImg]);
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Upload failed. Please try again.");
    }
    setUploading(false);
  };

  const removeImage = async (idx) => {
    const img = images[idx];
    if (img?.public_id) apiPlazaDeleteProductImage(img.public_id).catch(() => {});
    onChange(images.filter((_, i) => i !== idx));
  };

  const canAdd = images.length < maxImages;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <span style={{ fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:.5 }}>
          Product Images ({images.length}/{maxImages})
        </span>
        {uploading && <span style={{ fontSize:11, color:"#4f46e5", fontWeight:600 }}>Uploading…</span>}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
        {/* Existing images */}
        {images.map((img, i) => (
          <div key={i} style={{ position:"relative", aspectRatio:"1", borderRadius:10, overflow:"hidden", border:"1px solid #e2e8f0" }}>
            <img src={img.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            {/* Replace button */}
            <button
              type="button"
              onClick={() => pickFile(i)}
              style={{ position:"absolute", top:3, left:3, background:"rgba(79,70,229,.9)", border:"none", color:"#fff", width:22, height:22, fontSize:10, borderRadius:"50%", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}
              title="Replace image"
            >✂</button>
            {/* Remove button */}
            <button
              type="button"
              onClick={() => removeImage(i)}
              style={{ position:"absolute", top:3, right:3, background:"rgba(239,68,68,.9)", border:"none", color:"#fff", width:22, height:22, fontSize:14, borderRadius:"50%", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
              title="Remove image"
            >×</button>
            {i === 0 && (
              <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"rgba(79,70,229,.8)", fontSize:9, color:"#fff", textAlign:"center", padding:"2px 0", fontWeight:700 }}>MAIN</div>
            )}
          </div>
        ))}

        {/* Add button */}
        {canAdd && (
          <button
            type="button"
            onClick={() => pickFile(null)}
            disabled={uploading}
            style={{ aspectRatio:"1", borderRadius:10, background:"#f8fafc", border:"2px dashed #c7d2fe", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:uploading?"not-allowed":"pointer", color:"#6366f1", gap:4, opacity:uploading?.6:1, transition:"all .2s" }}
            onMouseEnter={e=>{ if(!uploading){ e.currentTarget.style.background="#ede9fe"; e.currentTarget.style.borderStyle="solid"; }}}
            onMouseLeave={e=>{ e.currentTarget.style.background="#f8fafc"; e.currentTarget.style.borderStyle="dashed"; }}
          >
            <span style={{ fontSize:22 }}>📷</span>
            <span style={{ fontSize:9, fontWeight:700 }}>Add & Crop</span>
          </button>
        )}
      </div>

      <div style={{ marginTop:6, fontSize:10, color:"#94a3b8" }}>
        First image is shown as main. ✂ to replace, × to remove.
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={onFileSelected} style={{ display:"none" }}/>

      {cropSrc && (
        <ImageCropModal
          src={cropSrc.src}
          onDone={onCropDone}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </div>
  );
};

// ── Stall logo uploader (single square image) ─────────────────────────────────
export const PlazaLogoUploader = ({ currentLogo, onLogoChange }) => {
  const [cropSrc,   setCropSrc]   = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const onFileSelected = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = ev => setCropSrc(ev.target.result);
    reader.readAsDataURL(file);
  };

  const onCropDone = async (croppedFile) => {
    setCropSrc(null);
    setUploading(true);
    try {
      const r = await apiPlazaUploadLogo(croppedFile);
      onLogoChange({ url: r.data.url, public_id: r.data.public_id });
    } catch (err) {
      alert(err?.response?.data?.message || "Logo upload failed.");
    }
    setUploading(false);
  };

  return (
    <div style={{ display:"flex", alignItems:"center", gap:16 }}>
      {/* Current logo */}
      <div style={{ width:80, height:80, borderRadius:14, overflow:"hidden", border:"2px solid #e2e8f0", background:"#f8fafc", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {currentLogo?.url
          ? <img src={currentLogo.url} alt="logo" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          : <span style={{ fontSize:28 }}>🏪</span>
        }
      </div>

      <div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{ padding:"9px 20px", background: uploading ? "#e2e8f0" : "linear-gradient(135deg,#4f46e5,#7c3aed)", border:"none", borderRadius:10, color:"#fff", fontWeight:700, fontSize:12, cursor:uploading?"not-allowed":"pointer" }}
        >
          {uploading ? "Uploading…" : currentLogo?.url ? "Change Logo" : "Upload Logo"}
        </button>
        <div style={{ fontSize:10, color:"#94a3b8", marginTop:4 }}>Square image · Auto-cropped to 600×600</div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={onFileSelected} style={{ display:"none" }}/>

      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          onDone={onCropDone}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </div>
  );
};
