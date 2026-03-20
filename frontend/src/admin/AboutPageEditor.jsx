import React, { useState, useEffect } from "react";
import { useBreakpoint } from "../hooks";
import { useAboutData, updateAbout } from "../store/contentStore";
import { DEFAULT_ABOUT } from "../constants/defaults";
import { Ic } from "../utils/helpers";
import { Edit, Save, Trash2 } from "lucide-react";

/* ── ABOUT PAGE EDITOR ───────────────────────────────────────────────────────── */
const AboutPageEditor = ({ toast }) => {
  const {isMobile}=useBreakpoint();
  const live=useAboutData();
  const [form,setForm]=useState(()=>JSON.parse(JSON.stringify(live)));
  const [saved,setSaved]=useState(false);
  const [featEdit,setFeatEdit]=useState(null); // index being edited

  useEffect(()=>{setForm(JSON.parse(JSON.stringify(live)));},[live]);

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const save=async()=>{
    try{
      await updateAbout({...form});
      setSaved(true);
      toast("About page updated! Changes are live.");
      setTimeout(()=>setSaved(false),2500);
    }catch(e){toast("Save failed — please try again","error");}
  };

  const reset=()=>{
    updateAbout(JSON.parse(JSON.stringify(DEFAULT_ABOUT)));
    setForm(JSON.parse(JSON.stringify(DEFAULT_ABOUT)));
    toast("Reset to default.");
  };

  const setFeat=(i,k,v)=>{
    const feats=[...(form.features||[])];
    feats[i]={...feats[i],[k]:v};
    set("features",feats);
  };

  const addFeat=()=>set("features",[...(form.features||[]),{icon:"",title:"New Feature",desc:"Description here"}]);
  const delFeat=i=>set("features",(form.features||[]).filter((_,j)=>j!==i));

  const iS={background:"#fff",border:"1.5px solid var(--border2)",color:"var(--text)",padding:"10px 13px",fontSize:13,borderRadius:10,outline:"none",width:"100%",boxSizing:"border-box",fontWeight:500,fontFamily:"var(--font-b)"};
  const lS={display:"block",fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:.5,textTransform:"uppercase",marginBottom:6};
  const FEAT_BGS=["var(--roseL)","var(--tealL)","var(--saffronL)","var(--purpleL)"];

  return(
    <div>
      <h2 style={{fontFamily:"var(--font-d)",color:"var(--dark)",marginBottom:6,fontSize:28,fontWeight:700}}>About Page Editor</h2>
      <p style={{color:"var(--muted)",fontSize:13,marginBottom:24,fontWeight:500}}>Edit all content on the About page. Changes go live instantly.</p>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:18,alignItems:"start"}}>

        {/* LEFT — form fields */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>

          {/* Hero section */}
          <div style={{background:"#fff",borderRadius:"16px",border:"1.5px solid var(--border)",padding:20}}>
            <div style={{fontSize:11,fontWeight:800,color:"var(--rose)",letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>Hero Section</div>
            {[
              ["Section Label","heroLabel"],
              ["Main Heading","heroHeading"],
              ["Heading Accent (rose coloured)","heroHeadingAccent"],
            ].map(([label,key])=>(
              <div key={key} style={{marginBottom:12}}>
                <label style={lS}>{label}</label>
                <input value={form[key]||""} onChange={e=>set(key,e.target.value)} style={iS}
                  onFocus={e=>e.target.style.borderColor="var(--rose)"}
                  onBlur={e=>e.target.style.borderColor="var(--border2)"}/>
              </div>
            ))}
            <div style={{marginBottom:12}}>
              <label style={lS}>Hero Body Text</label>
              <textarea value={form.heroBody||""} onChange={e=>set("heroBody",e.target.value)} rows={3}
                style={{...iS,resize:"vertical"}}
                onFocus={e=>e.target.style.borderColor="var(--rose)"}
                onBlur={e=>e.target.style.borderColor="var(--border2)"}/>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <div>
                <label style={lS}>Decorative Emoji</label>
                <input value={form.emoji||"🌿"} onChange={e=>set("emoji",e.target.value)} style={{...iS,width:70,fontSize:24,textAlign:"center"}} maxLength={4}/>
              </div>
            </div>
          </div>

          {/* Mission section */}
          <div style={{background:"#fff",borderRadius:"16px",border:"1.5px solid var(--border)",padding:20}}>
            <div style={{fontSize:11,fontWeight:800,color:"var(--rose)",letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>Mission Section</div>
            {[
              ["Section Label","missionLabel"],
              ["Mission Heading","missionHeading"],
            ].map(([label,key])=>(
              <div key={key} style={{marginBottom:12}}>
                <label style={lS}>{label}</label>
                <input value={form[key]||""} onChange={e=>set(key,e.target.value)} style={iS}
                  onFocus={e=>e.target.style.borderColor="var(--rose)"}
                  onBlur={e=>e.target.style.borderColor="var(--border2)"}/>
              </div>
            ))}
            <div style={{marginBottom:12}}>
              <label style={lS}>Paragraph 1</label>
              <textarea value={form.missionP1||""} onChange={e=>set("missionP1",e.target.value)} rows={3} style={{...iS,resize:"vertical"}}
                onFocus={e=>e.target.style.borderColor="var(--rose)"}
                onBlur={e=>e.target.style.borderColor="var(--border2)"}/>
            </div>
            <div>
              <label style={lS}>Paragraph 2</label>
              <textarea value={form.missionP2||""} onChange={e=>set("missionP2",e.target.value)} rows={3} style={{...iS,resize:"vertical"}}
                onFocus={e=>e.target.style.borderColor="var(--rose)"}
                onBlur={e=>e.target.style.borderColor="var(--border2)"}/>
            </div>
          </div>

          {/* Feature cards */}
          <div style={{background:"#fff",borderRadius:"16px",border:"1.5px solid var(--border)",padding:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:800,color:"var(--rose)",letterSpacing:1,textTransform:"uppercase"}}>Feature Cards ({(form.features||[]).length})</div>
              <button onClick={addFeat} style={{background:"var(--roseL)",border:"1.5px solid var(--rose)",color:"var(--rose)",borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Add</button>
            </div>
            {(form.features||[]).map((f,i)=>(
              <div key={i} style={{marginBottom:10,padding:12,background:"var(--ivory2)",borderRadius:10,border:"1.5px solid var(--border)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <input value={f.icon} onChange={e=>setFeat(i,"icon",e.target.value)} style={{...iS,width:48,fontSize:20,textAlign:"center",padding:"6px"}} maxLength={4}/>
                  <input value={f.title} onChange={e=>setFeat(i,"title",e.target.value)} placeholder="Title" style={{...iS,flex:1}}/>
                  <button onClick={()=>delFeat(i)} style={{background:"none",border:"none",color:"#EF4444",fontSize:18,cursor:"pointer",flexShrink:0,padding:"0 4px"}}>×</button>
                </div>
                <input value={f.desc} onChange={e=>setFeat(i,"desc",e.target.value)} placeholder="Description" style={iS}/>
              </div>
            ))}
          </div>

          <div style={{display:"flex",gap:10}}>
            <button onClick={save} style={{flex:2,padding:"13px 0",background:saved?"linear-gradient(135deg,var(--teal),#26A69A)":"linear-gradient(135deg,var(--rose),var(--saffron))",border:"none",borderRadius:11,color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",transition:"all .3s"}}>
              {saved?"Saved!":"Save & Go Live"}
            </button>
            <button onClick={reset} style={{flex:1,padding:"13px 0",background:"var(--ivory2)",border:"1.5px solid var(--border2)",borderRadius:11,color:"var(--muted)",fontWeight:600,fontSize:13,cursor:"pointer"}}>
              Reset
            </button>
          </div>
        </div>

        {/* RIGHT — mini preview */}
        <div>
          <div style={{fontSize:11,fontWeight:800,color:"var(--rose)",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Live Preview</div>
          <div style={{borderRadius:"16px",overflow:"hidden",border:"1.5px solid var(--border)",boxShadow:"0 4px 20px rgba(0,0,0,.06)"}}>
            {/* Hero preview */}
            <div style={{background:"linear-gradient(160deg,var(--roseL) 0%,var(--saffronL) 60%,var(--tealL) 100%)",padding:"28px 24px"}}>
              <div style={{fontSize:9,fontWeight:800,color:"var(--rose)",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>{form.heroLabel}</div>
              <div style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:700,color:"var(--dark)",lineHeight:1.2,marginBottom:8}}>
                {form.heroHeading}<br/><span style={{color:"var(--rose)"}}>{form.heroHeadingAccent}</span>
              </div>
              <p style={{fontSize:12,color:"var(--text2)",lineHeight:1.7,maxWidth:300}}>{form.heroBody}</p>
            </div>
            {/* Mission preview */}
            <div style={{background:"#fff",padding:"20px 24px",borderTop:"1.5px solid var(--border)"}}>
              <div style={{fontSize:9,fontWeight:800,color:"var(--rose)",letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>{form.missionLabel}</div>
              <div style={{fontFamily:"var(--font-d)",fontSize:17,fontWeight:700,color:"var(--dark)",marginBottom:8}}>{form.missionHeading}</div>
              <p style={{fontSize:12,color:"var(--text2)",lineHeight:1.6,marginBottom:6}}>{form.missionP1}</p>
              <p style={{fontSize:12,color:"var(--text2)",lineHeight:1.6}}>{form.missionP2}</p>
            </div>
            {/* Feature cards preview */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderTop:"1.5px solid var(--border)"}}>
              {(form.features||[]).slice(0,4).map((f,i)=>(
                <div key={i} style={{padding:"16px 14px",textAlign:"center",background:"var(--cream)",borderRight:i%2===0?"1px solid var(--border)":"none",borderBottom:i<2?"1px solid var(--border)":"none"}}>
                  <div style={{fontSize:22,marginBottom:6}}>{f.icon}</div>
                  <div style={{fontFamily:"var(--font-d)",fontSize:12,fontWeight:700,color:"var(--dark)",marginBottom:4}}>{f.title}</div>
                  <div style={{fontSize:10,color:"var(--muted)"}}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── CATEGORY MANAGER ────────────────────────────────────────────────────────── */

export default AboutPageEditor;