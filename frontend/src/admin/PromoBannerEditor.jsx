import React, { useState, useEffect, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import { useBreakpoint } from "../hooks";
import { usePromoData, updatePromo } from "../store/contentStore";
import { DEFAULT_PROMO } from "../constants/defaults";
import { Ic } from "../utils/helpers";
import { Archive, Mail, Upload, X, Send, CheckSquare, Square, ZoomIn, Sun, Contrast } from "lucide-react";
import { apiUploadBannerImages, apiSendOfferPromo, apiAdminUsers } from "../api";

// ─── Canvas helpers ───────────────────────────────────────────────────────────
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.setAttribute("crossOrigin", "anonymous");
    img.src = url;
  });

const getCroppedBlob = async (imageSrc, pixelCrop, brightness, contrast) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width  = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    pixelCrop.width, pixelCrop.height
  );
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
};

// ─── Crop Modal ───────────────────────────────────────────────────────────────
const ASPECTS = [
  { label: "16:9", value: 16 / 9 },
  { label: "3:2",  value: 3  / 2 },
  { label: "1:1",  value: 1      },
  { label: "Free", value: null   },
];

const CropModal = ({ src, onApply, onClose, uploading }) => {
  const [crop,             setCrop]             = useState({ x: 0, y: 0 });
  const [zoom,             setZoom]             = useState(1);
  const [aspect,           setAspect]           = useState(16 / 9);
  const [croppedAreaPixels,setCroppedAreaPixels] = useState(null);
  const [brightness,       setBrightness]       = useState(100);
  const [contrast,         setContrast]         = useState(100);

  const onCropComplete = useCallback((_, cap) => setCroppedAreaPixels(cap), []);

  const handleApply = async () => {
    if (!croppedAreaPixels) return;
    const blob = await getCroppedBlob(src, croppedAreaPixels, brightness, contrast);
    onApply(blob);
  };

  const sliderStyle = {
    width: "100%", accentColor: "#C2185B", cursor: "pointer", height: 4,
  };

  // Responsive crop area height — leaves room for header + controls + buttons
  const cropH = Math.min(300, Math.max(180, window.innerHeight - 400));

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.82)",zIndex:10000,display:"flex",alignItems:"center",justifyContent:"center",padding:12,boxSizing:"border-box" }}>
      <div style={{ background:"#1A0A00",borderRadius:20,width:"100%",maxWidth:660,maxHeight:"calc(100vh - 24px)",display:"flex",flexDirection:"column",boxShadow:"0 32px 100px rgba(0,0,0,.6)",overflow:"hidden" }}>

        {/* ── Header — always visible ── */}
        <div style={{ padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,.12)",flexShrink:0 }}>
          <div>
            <div style={{ color:"#fff",fontWeight:800,fontSize:15 }}>Crop &amp; Adjust</div>
            <div style={{ color:"rgba(255,255,255,.4)",fontSize:11,marginTop:2 }}>Drag to pan · Pinch or slider to zoom</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.15)",borderRadius:8,width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
            <Ic icon={X} size={16} color="#fff"/>
          </button>
        </div>

        {/* ── Crop viewport — fixed responsive height ── */}
        <div style={{ position:"relative",width:"100%",height:cropH,flexShrink:0,background:"#000" }}>
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect ?? undefined}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { borderRadius:0 },
              mediaStyle:     { filter:`brightness(${brightness}%) contrast(${contrast}%)` },
            }}
          />
        </div>

        {/* ── Scrollable controls ── */}
        <div style={{ flex:1,overflowY:"auto",padding:"14px 20px",display:"flex",flexDirection:"column",gap:12 }}>

          {/* Aspect ratio */}
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <span style={{ fontSize:10,color:"rgba(255,255,255,.45)",fontWeight:700,letterSpacing:.5,textTransform:"uppercase",width:72,flexShrink:0 }}>Aspect</span>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
              {ASPECTS.map(a => (
                <button key={a.label} onClick={() => setAspect(a.value)}
                  style={{ padding:"4px 11px",borderRadius:7,border:"1.5px solid",fontSize:12,fontWeight:700,cursor:"pointer",
                    borderColor: aspect === a.value ? "#C2185B" : "rgba(255,255,255,.2)",
                    background:  aspect === a.value ? "#C2185B" : "rgba(255,255,255,.05)",
                    color:       aspect === a.value ? "#fff"    : "rgba(255,255,255,.65)",
                  }}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Zoom */}
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <span style={{ fontSize:10,color:"rgba(255,255,255,.45)",fontWeight:700,letterSpacing:.5,textTransform:"uppercase",width:72,flexShrink:0,display:"flex",alignItems:"center",gap:4 }}>
              <Ic icon={ZoomIn} size={11} color="rgba(255,255,255,.45)"/> Zoom
            </span>
            <input type="range" min={1} max={3} step={0.05} value={zoom}
              onChange={e => setZoom(Number(e.target.value))} style={sliderStyle}/>
            <span style={{ fontSize:11,color:"rgba(255,255,255,.45)",width:34,textAlign:"right",flexShrink:0 }}>{zoom.toFixed(1)}×</span>
          </div>

          {/* Brightness */}
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <span style={{ fontSize:10,color:"rgba(255,255,255,.45)",fontWeight:700,letterSpacing:.5,textTransform:"uppercase",width:72,flexShrink:0,display:"flex",alignItems:"center",gap:4 }}>
              <Ic icon={Sun} size={11} color="rgba(255,255,255,.45)"/> Bright
            </span>
            <input type="range" min={50} max={150} step={1} value={brightness}
              onChange={e => setBrightness(Number(e.target.value))} style={sliderStyle}/>
            <span style={{ fontSize:11,color:"rgba(255,255,255,.45)",width:34,textAlign:"right",flexShrink:0 }}>{brightness}%</span>
          </div>

          {/* Contrast */}
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <span style={{ fontSize:10,color:"rgba(255,255,255,.45)",fontWeight:700,letterSpacing:.5,textTransform:"uppercase",width:72,flexShrink:0,display:"flex",alignItems:"center",gap:4 }}>
              <Ic icon={Contrast} size={11} color="rgba(255,255,255,.45)"/> Contrast
            </span>
            <input type="range" min={50} max={150} step={1} value={contrast}
              onChange={e => setContrast(Number(e.target.value))} style={sliderStyle}/>
            <span style={{ fontSize:11,color:"rgba(255,255,255,.45)",width:34,textAlign:"right",flexShrink:0 }}>{contrast}%</span>
          </div>

          {/* Reset */}
          <div style={{ display:"flex",justifyContent:"flex-end" }}>
            <button onClick={() => { setBrightness(100); setContrast(100); setZoom(1); }}
              style={{ background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.13)",borderRadius:7,padding:"5px 13px",color:"rgba(255,255,255,.55)",fontSize:11,fontWeight:700,cursor:"pointer" }}>
              Reset Adjustments
            </button>
          </div>

        </div>

        {/* ── Action buttons — always visible at bottom ── */}
        <div style={{ display:"flex",gap:10,padding:"12px 20px 16px",flexShrink:0,borderTop:"1px solid rgba(255,255,255,.12)",background:"#1A0A00" }}>
          <button onClick={onClose} style={{ flex:1,padding:"12px 0",background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",borderRadius:11,color:"rgba(255,255,255,.7)",fontWeight:600,fontSize:13,cursor:"pointer" }}>
            Cancel
          </button>
          <button onClick={handleApply} disabled={uploading}
            style={{ flex:2,padding:"12px 0",background:uploading?"rgba(255,255,255,.15)":"linear-gradient(135deg,#C2185B,#E65100)",border:"none",borderRadius:11,color:"#fff",fontWeight:800,fontSize:14,cursor:uploading?"wait":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
            {uploading ? (
              <><span style={{ width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 1s linear infinite" }}/> Uploading…</>
            ) : "Apply & Upload"}
          </button>
        </div>

      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// PROMO BANNER EDITOR
// ═════════════════════════════════════════════════════════════════════════════
const PromoBannerEditor = ({ toast }) => {
  const { isMobile } = useBreakpoint();
  const live = usePromoData();
  const [form, setForm] = useState(() => ({ ...DEFAULT_PROMO, ...live }));
  const [saved, setSaved] = useState(false);

  // crop modal
  const [cropSrc,    setCropSrc]    = useState(null); // data URL of selected file
  const [cropSlot,   setCropSlot]   = useState(null); // 1 or 2
  const [uploading1, setUploading1] = useState(false);
  const [uploading2, setUploading2] = useState(false);
  const img1Ref = useRef();
  const img2Ref = useRef();

  // send mail modal
  const [mailOpen,    setMailOpen]    = useState(false);
  const [mailUsers,   setMailUsers]   = useState([]);
  const [mailChecked, setMailChecked] = useState({});
  const [mailSearch,  setMailSearch]  = useState("");
  const [mailLoading, setMailLoading] = useState(false);
  const [mailSending, setMailSending] = useState(false);
  const [mailResult,  setMailResult]  = useState(null);

  useEffect(() => { setForm({ ...DEFAULT_PROMO, ...live }); }, [live]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    try {
      const result = await updatePromo({ ...form });
      setSaved(true);
      toast(result?.db ? "Offer banner saved to database ✓" : "Saved locally — will sync to DB when backend is online");
      setTimeout(() => setSaved(false), 2500);
    } catch { toast("Save failed — please try again"); }
  };

  const reset = () => {
    updatePromo({ ...DEFAULT_PROMO });
    setForm({ ...DEFAULT_PROMO });
    toast("Reset to default.");
  };

  // ── Image select → open crop modal ──────────────────────────────────────────
  const onFileSelected = (files, slot) => {
    if (!files || !files[0]) return;
    const reader = new FileReader();
    reader.onload = e => { setCropSrc(e.target.result); setCropSlot(slot); };
    reader.readAsDataURL(files[0]);
  };

  // ── After crop: upload blob to Cloudinary ───────────────────────────────────
  const onCropApply = async (blob) => {
    const setUploading = cropSlot === 1 ? setUploading1 : setUploading2;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("images", blob, `banner${cropSlot}.jpg`);
      const res = await apiUploadBannerImages(fd);
      const url = res.data?.urls?.[0];
      if (url) {
        set(cropSlot === 1 ? "image1" : "image2", url);
        toast(`Banner image ${cropSlot} uploaded ✓`);
      }
    } catch { toast("Image upload failed — try again"); }
    setUploading(false);
    setCropSrc(null);
    setCropSlot(null);
  };

  const closeCrop = () => { setCropSrc(null); setCropSlot(null); };

  // ── Send Mail Modal ──────────────────────────────────────────────────────────
  const openMailModal = async () => {
    setMailResult(null); setMailSearch(""); setMailLoading(true); setMailOpen(true);
    try {
      const r = await apiAdminUsers();
      const all = (r?.data?.users || []).filter(u => u.role !== "admin" && u.email);
      setMailUsers(all);
      const checked = {};
      all.forEach(u => { checked[u._id] = true; });
      setMailChecked(checked);
    } catch { toast("Failed to load users"); }
    setMailLoading(false);
  };

  const closeMailModal = () => {
    setMailOpen(false); setMailUsers([]); setMailChecked({});
    setMailSearch(""); setMailLoading(false); setMailSending(false); setMailResult(null);
  };

  const sendOfferMail = async () => {
    const ids = Object.entries(mailChecked).filter(([, v]) => v).map(([k]) => k);
    if (!ids.length) { toast("Select at least one user"); return; }
    setMailSending(true); setMailResult(null);
    try {
      await updatePromo({ ...form }); // persist latest form + images first
      const r = await apiSendOfferPromo(ids, form);
      setMailResult({ ok: true,  msg: r.data?.message || "Emails sent!" });
    } catch (e) {
      setMailResult({ ok: false, msg: e.response?.data?.message || "Failed to send emails" });
    }
    setMailSending(false);
  };

  const iS = { background:"#fff",border:"1.5px solid var(--border2)",color:"var(--text)",padding:"11px 14px",fontSize:13,borderRadius:11,outline:"none",width:"100%",boxSizing:"border-box",fontWeight:500,fontFamily:"var(--font-b)",transition:"border-color .2s" };

  return (
    <>
      <div>
        <h2 style={{ fontFamily:"var(--font-d)",color:"var(--dark)",marginBottom:6,fontSize:28,fontWeight:700 }}>Offer Banner Editor</h2>
        <p style={{ color:"var(--muted)",fontSize:13,marginBottom:24,fontWeight:500 }}>Edit the promotional banner shown on the homepage. Changes go live instantly.</p>

        <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:18,alignItems:"start" }}>

          {/* ── Form ── */}
          <div style={{ background:"#fff",borderRadius:16,border:"1.5px solid var(--border)",padding:24,boxShadow:"0 2px 12px rgba(194,24,91,.06)" }}>

            {/* Active toggle */}
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:form.active?"var(--tealL)":"var(--ivory3)",borderRadius:12,marginBottom:20,border:"1.5px solid var(--border)" }}>
              <div>
                <div style={{ fontWeight:700,fontSize:14,color:"var(--dark)" }}>Banner Visibility</div>
                <div style={{ fontSize:11,color:"var(--muted)",marginTop:2 }}>{form.active ? "Visible on homepage" : "Hidden from homepage"}</div>
              </div>
              <button onClick={() => set("active", !form.active)} style={{ width:48,height:26,borderRadius:13,border:"none",cursor:"pointer",background:form.active?"linear-gradient(135deg,var(--teal),#26A69A)":"var(--border2)",position:"relative",transition:"all .3s",flexShrink:0 }}>
                <div style={{ position:"absolute",top:3,left:form.active?26:3,width:20,height:20,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,.2)",transition:"left .3s" }}/>
              </button>
            </div>

            {/* ── Banner Image Upload Slots ── */}
            <div style={{ marginBottom:20 }}>
              <label style={{ display:"block",fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:.5,textTransform:"uppercase",marginBottom:10 }}>
                Banner Images — click to select, then crop &amp; adjust
              </label>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                {[1, 2].map(slot => {
                  const key       = slot === 1 ? "image1" : "image2";
                  const url       = form[key];
                  const uploading = slot === 1 ? uploading1 : uploading2;
                  const ref       = slot === 1 ? img1Ref   : img2Ref;
                  return (
                    <div key={slot}>
                      <input ref={ref} type="file" accept="image/*" style={{ display:"none" }}
                        onChange={e => onFileSelected(e.target.files, slot)}
                        onClick={e => { e.target.value = ""; }}/>

                      {/* Slot tile */}
                      <div onClick={() => !uploading && ref.current?.click()} style={{ border:"2px dashed var(--border2)",borderRadius:12,overflow:"hidden",background:"var(--ivory2)",cursor:"pointer",aspectRatio:"16/9",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",transition:"border-color .2s" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--rose)"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border2)"}>

                        {url ? (
                          <>
                            <img src={url} alt={`Banner ${slot}`} style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }}/>
                            {/* Hover overlay */}
                            <div style={{ position:"absolute",inset:0,background:"rgba(26,10,0,.6)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity .2s" }}
                              onMouseEnter={e => { e.currentTarget.style.opacity = 1; }}
                              onMouseLeave={e => { e.currentTarget.style.opacity = 0; }}>
                              <Ic icon={Upload} size={18} color="#fff"/>
                              <span style={{ color:"#fff",fontSize:10,fontWeight:700,marginTop:4 }}>Replace &amp; Crop</span>
                            </div>
                            {/* Remove button */}
                            <button onClick={e => { e.stopPropagation(); set(key, ""); }}
                              style={{ position:"absolute",top:5,right:5,background:"rgba(0,0,0,.55)",border:"none",borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:1 }}>
                              <Ic icon={X} size={12} color="#fff"/>
                            </button>
                          </>
                        ) : (
                          <div style={{ textAlign:"center",padding:8 }}>
                            {uploading ? (
                              <div style={{ fontSize:11,color:"var(--rose)",fontWeight:700 }}>Uploading…</div>
                            ) : (
                              <>
                                <Ic icon={Upload} size={22} color="var(--muted)"/>
                                <div style={{ fontSize:10,color:"var(--muted)",marginTop:5,fontWeight:700 }}>Image {slot}</div>
                                <div style={{ fontSize:9,color:"var(--muted)",marginTop:2 }}>Click to select</div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize:10,color:"var(--muted)",marginTop:6,lineHeight:1.6 }}>
                Images appear side-by-side in the offer email. After selecting, you can crop, zoom and adjust brightness/contrast before uploading.
              </div>
            </div>

            {/* Text fields */}
            {[
              ["Tag Line (badge text)", "tag",        "e.g. ⏰ Limited Time"],
              ["Main Heading",          "heading",    "e.g. Women's Day Special"],
              ["Sub Heading",           "subheading", "e.g. Flat 25% Off"],
              ["Body Text",             "body",       "e.g. Use code"],
              ["Coupon Code",           "code",       "e.g. WOMENSDAY25"],
              ["Code Description",      "codeDesc",   "e.g. on all ethnic wear"],
              ["Button Label",          "btnLabel",   "e.g. Shop Now"],
            ].map(([label, key, ph]) => (
              <div key={key} style={{ marginBottom:14 }}>
                <label style={{ display:"block",fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:.5,textTransform:"uppercase",marginBottom:6 }}>{label}</label>
                <input value={form[key] || ""} onChange={e => set(key, e.target.value)} placeholder={ph} style={iS}
                  onFocus={e => e.target.style.borderColor = "var(--rose)"}
                  onBlur={e  => e.target.style.borderColor = "var(--border2)"}/>
              </div>
            ))}

            {/* Action buttons */}
            <div style={{ display:"flex",gap:10,marginTop:20 }}>
              <button onClick={save} style={{ flex:2,padding:"13px 0",background:saved?"linear-gradient(135deg,var(--teal),#26A69A)":"linear-gradient(135deg,var(--rose),var(--saffron))",border:"none",borderRadius:11,color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",transition:"all .3s" }}>
                {saved ? "Saved!" : "Save & Go Live"}
              </button>
              <button onClick={openMailModal} style={{ flex:1.5,padding:"13px 0",background:"linear-gradient(135deg,#2563EB,#1D4ED8)",border:"none",borderRadius:11,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
                <Ic icon={Mail} size={15} color="#fff"/> Send Mail
              </button>
              <button onClick={reset} style={{ flex:1,padding:"13px 0",background:"var(--ivory2)",border:"1.5px solid var(--border2)",borderRadius:11,color:"var(--muted)",fontWeight:600,fontSize:13,cursor:"pointer" }}>
                Reset
              </button>
            </div>
          </div>

          {/* ── Live Preview ── */}
          <div>
            <div style={{ fontSize:11,fontWeight:800,color:"var(--rose)",letterSpacing:1,textTransform:"uppercase",marginBottom:10 }}>Live Preview</div>
            {form.active ? (
              <div style={{ borderRadius:20,background:"linear-gradient(135deg,var(--dark) 0%,var(--dark2) 40%,#3D1500 100%)",padding:isMobile?"28px 20px":"36px 32px",position:"relative",overflow:"hidden" }}>
                {(form.image1 || form.image2) && (
                  <div style={{ display:"flex",gap:6,marginBottom:20,borderRadius:12,overflow:"hidden" }}>
                    {form.image1 && <img src={form.image1} alt="Banner 1" style={{ width:form.image2?"50%":"100%",maxHeight:160,objectFit:"cover",display:"block" }}/>}
                    {form.image2 && <img src={form.image2} alt="Banner 2" style={{ width:"50%",maxHeight:160,objectFit:"cover",display:"block" }}/>}
                  </div>
                )}
                <div style={{ position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"radial-gradient(circle,rgba(249,168,37,.12) 0%,transparent 70%)" }}/>
                <div style={{ position:"relative" }}>
                  <span style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"5px 13px",borderRadius:99,background:"rgba(249,168,37,.15)",color:"#F9A825",border:"1px solid rgba(249,168,37,.25)",fontSize:11,fontWeight:700,marginBottom:12 }}>{form.tag || "Tag"}</span>
                  <div style={{ fontFamily:"var(--font-d)",fontSize:isMobile?22:32,fontWeight:700,color:"#fff",lineHeight:1.2,marginBottom:10 }}>
                    {form.heading || "Heading"} —<br/><em style={{ color:"var(--gold)" }}>{form.subheading || "Subheading"}</em>
                  </div>
                  <p style={{ color:"rgba(255,255,255,.7)",fontSize:13,lineHeight:1.7,marginBottom:16 }}>
                    {form.body} <strong style={{ background:"rgba(255,255,255,.12)",padding:"2px 8px",borderRadius:5,fontFamily:"monospace",color:"#F9A825",fontSize:13,letterSpacing:1 }}>{form.code || "CODE"}</strong> {form.codeDesc}
                  </p>
                  <div style={{ display:"inline-block",padding:"11px 24px",background:"linear-gradient(135deg,var(--saffron),var(--gold))",borderRadius:12,color:"#fff",fontWeight:700,fontSize:13 }}>{form.btnLabel || "Shop Now"}</div>
                </div>
              </div>
            ) : (
              <div style={{ borderRadius:20,background:"var(--ivory3)",border:"2px dashed var(--border2)",padding:"36px 24px",textAlign:"center" }}>
                <div style={{ fontSize:36,marginBottom:10 }}><Ic icon={Archive} size={36} color="var(--muted)"/></div>
                <div style={{ fontWeight:700,color:"var(--muted)",fontSize:14 }}>Banner is hidden</div>
                <div style={{ fontSize:12,color:"var(--muted)",marginTop:4 }}>Toggle visibility above to show it.</div>
              </div>
            )}

            <div style={{ marginTop:14,padding:"12px 16px",background:"var(--ivory2)",borderRadius:12,fontSize:12,color:"var(--muted)",lineHeight:1.7,border:"1.5px solid var(--border)" }}>
              <strong>Tips:</strong> Use emoji in the tag line (🎉🌸🖤). Upload 2 banner images — they appear side-by-side in the offer email. Toggle off when no offer is running.
            </div>
          </div>
        </div>
      </div>

      {/* ── Crop & Adjust Modal ── */}
      {cropSrc && (
        <CropModal
          src={cropSrc}
          uploading={cropSlot === 1 ? uploading1 : uploading2}
          onApply={onCropApply}
          onClose={closeCrop}
        />
      )}

      {/* ── Send Mail Modal ── */}
      {mailOpen && (() => {
        const filtered   = mailUsers.filter(u =>
          !mailSearch ||
          u.name?.toLowerCase().includes(mailSearch.toLowerCase()) ||
          u.email?.toLowerCase().includes(mailSearch.toLowerCase())
        );
        const checkedIds = Object.entries(mailChecked).filter(([, v]) => v).map(([k]) => k);
        const allChecked = filtered.length > 0 && filtered.every(u => mailChecked[u._id]);
        return (
          <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }} onClick={closeMailModal}>
            <div style={{ background:"#fff",borderRadius:20,width:"100%",maxWidth:520,maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 24px 80px rgba(0,0,0,.25)" }} onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div style={{ padding:"20px 24px 16px",borderBottom:"1.5px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontWeight:800,fontSize:16,color:"var(--dark)",display:"flex",alignItems:"center",gap:8 }}>
                    <Ic icon={Mail} size={18} color="var(--rose)"/> Send Offer Email
                  </div>
                  <div style={{ fontSize:12,color:"var(--muted)",marginTop:2 }}>{form.heading || "Offer Banner"} — {form.subheading || ""}</div>
                </div>
                <button onClick={closeMailModal} style={{ background:"var(--ivory2)",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <Ic icon={X} size={16} color="var(--muted)"/>
                </button>
              </div>

              {/* Offer preview strip */}
              <div style={{ padding:"12px 24px",background:"linear-gradient(135deg,#FEF2F2,#FFF7ED)",borderBottom:"1.5px solid var(--border)",display:"flex",alignItems:"center",gap:12 }}>
                {(form.image1 || form.image2) && (
                  <div style={{ display:"flex",gap:4,borderRadius:8,overflow:"hidden",flexShrink:0 }}>
                    {form.image1 && <img src={form.image1} alt="" style={{ width:40,height:40,objectFit:"cover" }}/>}
                    {form.image2 && <img src={form.image2} alt="" style={{ width:40,height:40,objectFit:"cover" }}/>}
                  </div>
                )}
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:12,fontWeight:800,color:"var(--dark)",marginBottom:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{form.heading || "Offer"}</div>
                  <div style={{ fontSize:11,color:"var(--rose)",fontWeight:700 }}>{form.subheading}</div>
                  {form.code && <div style={{ fontSize:10,color:"var(--muted)",fontFamily:"monospace",marginTop:2 }}>Code: {form.code}</div>}
                </div>
              </div>

              {/* Search + Select all */}
              <div style={{ padding:"12px 24px 8px",borderBottom:"1px solid var(--border)" }}>
                <input value={mailSearch} onChange={e => setMailSearch(e.target.value)}
                  placeholder="Search users by name or email…"
                  style={{ width:"100%",padding:"9px 12px",border:"1.5px solid var(--border2)",borderRadius:10,fontSize:13,outline:"none",boxSizing:"border-box" }}/>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:8 }}>
                  <button onClick={() => { const c = { ...mailChecked }; filtered.forEach(u => { c[u._id] = !allChecked; }); setMailChecked(c); }}
                    style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--rose)",display:"flex",alignItems:"center",gap:4 }}>
                    <Ic icon={allChecked ? CheckSquare : Square} size={14} color="var(--rose)"/>
                    {allChecked ? "Deselect All" : "Select All"}
                  </button>
                  <span style={{ fontSize:11,color:"var(--muted)",fontWeight:600 }}>{checkedIds.length} of {mailUsers.length} selected</span>
                </div>
              </div>

              {/* User list */}
              <div style={{ flex:1,overflowY:"auto",padding:"8px 24px" }}>
                {mailLoading ? (
                  <div style={{ textAlign:"center",padding:32,color:"var(--muted)",fontSize:13 }}>Loading users…</div>
                ) : filtered.length === 0 ? (
                  <div style={{ textAlign:"center",padding:24,color:"var(--muted)",fontSize:13 }}>No users found</div>
                ) : filtered.map(u => (
                  <label key={u._id} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 0",cursor:"pointer",borderBottom:"1px solid var(--border)" }}>
                    <input type="checkbox" checked={!!mailChecked[u._id]} onChange={() => setMailChecked(c => ({ ...c, [u._id]: !c[u._id] }))}
                      style={{ accentColor:"var(--rose)",width:16,height:16,cursor:"pointer" }}/>
                    <div style={{ width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,var(--rose),var(--saffron))",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:13,flexShrink:0 }}>
                      {(u.name || u.email || "?")[0].toUpperCase()}
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:13,fontWeight:700,color:"var(--dark)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{u.name || "—"}</div>
                      <div style={{ fontSize:11,color:"var(--muted)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{u.email}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Result + Send */}
              <div style={{ padding:"14px 24px",borderTop:"1.5px solid var(--border)" }}>
                {mailResult && (
                  <div style={{ marginBottom:10,padding:"10px 14px",borderRadius:10,background:mailResult.ok?"#F0FDF4":"#FEF2F2",border:`1px solid ${mailResult.ok?"#BBF7D0":"#FECACA"}`,fontSize:13,fontWeight:600,color:mailResult.ok?"#166534":"#DC2626" }}>
                    {mailResult.ok ? "✅" : "❌"} {mailResult.msg}
                  </div>
                )}
                <div style={{ display:"flex",gap:10 }}>
                  <button onClick={closeMailModal} style={{ flex:1,padding:"12px 0",background:"var(--ivory2)",border:"1.5px solid var(--border2)",borderRadius:11,fontSize:13,fontWeight:600,color:"var(--muted)",cursor:"pointer" }}>
                    Cancel
                  </button>
                  <button onClick={sendOfferMail} disabled={mailSending || checkedIds.length === 0}
                    style={{ flex:2,padding:"12px 0",background:mailSending||checkedIds.length===0?"var(--border2)":"linear-gradient(135deg,#2563EB,#1D4ED8)",border:"none",borderRadius:11,color:"#fff",fontWeight:700,fontSize:13,cursor:mailSending||checkedIds.length===0?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all .2s" }}>
                    {mailSending ? (
                      <><span style={{ width:14,height:14,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 1s linear infinite",display:"inline-block" }}/> Sending…</>
                    ) : (
                      <><Ic icon={Send} size={14} color="#fff"/> Send to {checkedIds.length} User{checkedIds.length !== 1 ? "s" : ""}</>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </>
  );
};

export default PromoBannerEditor;
