import React, { useState, useEffect } from "react";
import { useBreakpoint } from "../hooks";
import { usePromoData, updatePromo } from "../store/contentStore";
import { DEFAULT_PROMO } from "../constants/defaults";
import { Ic } from "../utils/helpers";
import { Archive, Edit, Save, Tag } from "lucide-react";

/* ── PROMO BANNER EDITOR ─────────────────────────────────────────────────────── */
const PromoBannerEditor = ({ toast }) => {
  const {isMobile}=useBreakpoint();
  const live=usePromoData();
  const [form,setForm]=useState(()=>({...live}));
  const [saved,setSaved]=useState(false);

  useEffect(()=>{setForm({...live});},[live]);

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const save=()=>{
    updatePromo({...form});
    setSaved(true);
    toast("Offer banner updated! Changes are live on the homepage.");
    setTimeout(()=>setSaved(false),2500);
  };

  const reset=()=>{
    updatePromo({...DEFAULT_PROMO});
    setForm({...DEFAULT_PROMO});
    toast("Reset to default.");
  };

  const iS={background:"#fff",border:"1.5px solid var(--border2)",color:"var(--text)",padding:"11px 14px",fontSize:13,borderRadius:11,outline:"none",width:"100%",boxSizing:"border-box",fontWeight:500,fontFamily:"var(--font-b)",transition:"border-color .2s"};

  return(
    <div>
      <h2 style={{fontFamily:"var(--font-d)",color:"var(--dark)",marginBottom:6,fontSize:28,fontWeight:700}}>Offer Banner Editor</h2>
      <p style={{color:"var(--muted)",fontSize:13,marginBottom:24,fontWeight:500}}>Edit the promotional banner shown on the homepage. Changes go live instantly.</p>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:18,alignItems:"start"}}>

        {/* Form */}
        <div style={{background:"#fff",borderRadius:"16px",border:"1.5px solid var(--border)",padding:24,boxShadow:"0 2px 12px rgba(194,24,91,.06)"}}>

          {/* Active toggle */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:form.active?"var(--tealL)":"var(--ivory3)",borderRadius:12,marginBottom:20,border:"1.5px solid var(--border)"}}>
            <div>
              <div style={{fontWeight:700,fontSize:14,color:"var(--dark)"}}>Banner Visibility</div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{form.active?"Visible on homepage":"Hidden from homepage"}</div>
            </div>
            <button onClick={()=>set("active",!form.active)} style={{
              width:48,height:26,borderRadius:13,border:"none",cursor:"pointer",
              background:form.active?"linear-gradient(135deg,var(--teal),#26A69A)":"var(--border2)",
              position:"relative",transition:"all .3s",flexShrink:0
            }}>
              <div style={{position:"absolute",top:3,left:form.active?26:3,width:20,height:20,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,.2)",transition:"left .3s"}}/>
            </button>
          </div>

          {[
            ["Tag Line (badge text)","tag","e.g. ⏰ Limited Time"],
            ["Main Heading","heading","e.g. Women's Day Special"],
            ["Sub Heading (highlighted)","subheading","e.g. Flat 25% Off"],
            ["Body Text","body","e.g. Use code"],
            ["Coupon Code","code","e.g. WOMENSDAY25"],
            ["Code Description","codeDesc","e.g. on all ethnic wear"],
            ["Button Label","btnLabel","e.g. Shop Now"],
          ].map(([label,key,ph])=>(
            <div key={key} style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:.5,textTransform:"uppercase",marginBottom:6}}>{label}</label>
              <input value={form[key]||""} onChange={e=>set(key,e.target.value)} placeholder={ph} style={iS}
                onFocus={e=>e.target.style.borderColor="var(--rose)"}
                onBlur={e=>e.target.style.borderColor="var(--border2)"}/>
            </div>
          ))}

          <div style={{display:"flex",gap:10,marginTop:20}}>
            <button onClick={save} style={{flex:2,padding:"13px 0",background:saved?"linear-gradient(135deg,var(--teal),#26A69A)":"linear-gradient(135deg,var(--rose),var(--saffron))",border:"none",borderRadius:11,color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",transition:"all .3s"}}>
              {saved?"Saved!":"Save & Go Live"}
            </button>
            <button onClick={reset} style={{flex:1,padding:"13px 0",background:"var(--ivory2)",border:"1.5px solid var(--border2)",borderRadius:11,color:"var(--muted)",fontWeight:600,fontSize:13,cursor:"pointer"}}>
              Reset
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div>
          <div style={{fontSize:11,fontWeight:800,color:"var(--rose)",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Live Preview</div>
          {form.active?(
            <div style={{borderRadius:"20px",background:"linear-gradient(135deg,var(--dark) 0%,var(--dark2) 40%,#3D1500 100%)",padding:isMobile?"28px 20px":"36px 32px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"radial-gradient(circle,rgba(249,168,37,.12) 0%,transparent 70%)"}}/>
              <div style={{position:"relative"}}>
                <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 13px",borderRadius:99,background:"rgba(249,168,37,.15)",color:"#F9A825",border:"1px solid rgba(249,168,37,.25)",fontSize:11,fontWeight:700,marginBottom:12}}>{form.tag||"Tag"}</span>
                <div style={{fontFamily:"var(--font-d)",fontSize:isMobile?22:32,fontWeight:700,color:"#fff",lineHeight:1.2,marginBottom:10}}>
                  {form.heading||"Heading"} —<br/><em style={{color:"var(--gold)"}}>{form.subheading||"Subheading"}</em>
                </div>
                <p style={{color:"rgba(255,255,255,.7)",fontSize:13,lineHeight:1.7,marginBottom:16}}>
                  {form.body} <strong style={{background:"rgba(255,255,255,.12)",padding:"2px 8px",borderRadius:5,fontFamily:"monospace",color:"#F9A825",fontSize:13,letterSpacing:1}}>{form.code||"CODE"}</strong> {form.codeDesc}
                </p>
                <div style={{display:"inline-block",padding:"11px 24px",background:"linear-gradient(135deg,var(--saffron),var(--gold))",borderRadius:12,color:"#fff",fontWeight:700,fontSize:13}}>{form.btnLabel||"Shop Now"}</div>
              </div>
            </div>
          ):(
            <div style={{borderRadius:"20px",background:"var(--ivory3)",border:"2px dashed var(--border2)",padding:"36px 24px",textAlign:"center"}}>
              <div style={{fontSize:36,marginBottom:10}}><Ic icon={Archive} size={36} color="var(--muted)"/></div>
              <div style={{fontWeight:700,color:"var(--muted)",fontSize:14}}>Banner is hidden</div>
              <div style={{fontSize:12,color:"var(--muted)",marginTop:4}}>Toggle visibility above to show it.</div>
            </div>
          )}

          <div style={{marginTop:14,padding:"12px 16px",background:"var(--ivory2)",borderRadius:12,fontSize:12,color:"var(--muted)",lineHeight:1.7,border:"1.5px solid var(--border)"}}>
             <strong>Tips:</strong> Use emoji in the tag line (🎉🌸🖤). Change the heading for each festival — Women's Day, Diwali, Black Friday, etc. Toggle off when no offer is running.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoBannerEditor;