import React, { useState } from "react";
import { useBreakpoint } from "../hooks";
import { useMarqueeData, updateMarquee, useTopbarData, updateTopbar } from "../store/contentStore";
import { DEFAULT_MARQUEE, DEFAULT_TOPBAR } from "../constants/defaults";
import { Ic } from "../utils/helpers";
import { GripVertical, Plus, RotateCcw, Save, Trash2 } from "lucide-react";

// ── Reusable toggle ───────────────────────────────────────────────────────────
const Toggle = ({ value, onChange, label }) => (
  <div style={{display:"flex",alignItems:"center",gap:10}}>
    <div onClick={()=>onChange(!value)}
      style={{width:44,height:24,borderRadius:12,background:value?"var(--rose)":"var(--border2)",
              cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
      <div style={{position:"absolute",top:3,left:value?22:3,width:18,height:18,borderRadius:"50%",
                   background:"#fff",transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
    </div>
    <span style={{fontSize:13,fontWeight:600,color:value?"var(--rose)":"var(--muted)"}}>
      {value?"Visible":"Hidden"}
    </span>
  </div>
);

// ── Speed slider ──────────────────────────────────────────────────────────────
const SpeedSlider = ({ value, onChange }) => (
  <div>
    <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",letterSpacing:1,marginBottom:6}}>
      SCROLL SPEED — {value}s <span style={{fontWeight:400,textTransform:"none"}}>(lower = faster)</span>
    </div>
    <input type="range" min={8} max={60} value={value}
      onChange={e=>onChange(Number(e.target.value))}
      style={{width:"100%",accentColor:"var(--rose)"}}/>
    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--muted)",marginTop:3}}>
      <span>Fast (8s)</span><span>Slow (60s)</span>
    </div>
  </div>
);

// ── Section card ──────────────────────────────────────────────────────────────
const Card = ({ children, style={} }) => (
  <div style={{background:"#fff",border:"1.5px solid var(--border)",borderRadius:14,
               padding:"18px 20px",marginBottom:16,...style}}>
    {children}
  </div>
);

const Label = ({ children }) => (
  <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",letterSpacing:1,
               textTransform:"uppercase",marginBottom:10}}>
    {children}
  </div>
);

const iStyle = {
  background:"#fff",border:"1.5px solid var(--border2)",color:"var(--text)",
  padding:"9px 12px",fontSize:12,borderRadius:10,outline:"none",
  fontFamily:"monospace",fontWeight:600,letterSpacing:.5,
};

// ── Save button ───────────────────────────────────────────────────────────────
const SaveBtn = ({ saved, onClick }) => (
  <button onClick={onClick}
    style={{padding:"10px 22px",borderRadius:10,border:"none",fontWeight:700,fontSize:13,
            cursor:"pointer",color:"#fff",display:"flex",alignItems:"center",gap:6,
            background:"linear-gradient(135deg,var(--rose),var(--saffron))",
            boxShadow:"0 4px 16px rgba(194,24,91,.3)"}}>
    <Ic icon={Save} size={13}/>{saved?"Saved! ✓":"Save Changes"}
  </button>
);

// ════════════════════════════════════════════════════════════════════════════════
const MarqueeBannerEditor = ({ toast }) => {
  const { isMobile } = useBreakpoint();

  // ── Top bar state ─────────────────────────────────────────────────────────
  const liveTop = useTopbarData();
  const [topText,  setTopText]  = useState(liveTop.text   || DEFAULT_TOPBAR.text);
  const [topSpeed, setTopSpeed] = useState(liveTop.speed  || DEFAULT_TOPBAR.speed);
  const [topActive,setTopActive]= useState(liveTop.active !== false);
  const [topSaved, setTopSaved] = useState(false);

  React.useEffect(()=>{
    setTopText(liveTop.text   || DEFAULT_TOPBAR.text);
    setTopSpeed(liveTop.speed || DEFAULT_TOPBAR.speed);
    setTopActive(liveTop.active !== false);
  },[JSON.stringify(liveTop)]);

  const saveTop = async () => {
    try{
      const result=await updateTopbar({ text:topText, speed:topSpeed, active:topActive });
      setTopSaved(true);
      if(result?.db){toast("Top bar saved to database ✓");}
      else{toast("Saved locally — will sync to DB when backend is online");}
      setTimeout(()=>setTopSaved(false),2500);
    }catch{ toast("Save failed"); }
  };

  // ── Homepage marquee state ────────────────────────────────────────────────
  const liveMarquee = useMarqueeData();
  const [items,  setItems]  = useState([...(liveMarquee.items || DEFAULT_MARQUEE.items)]);
  const [sep,    setSep]    = useState(liveMarquee.separator || DEFAULT_MARQUEE.separator);
  const [speed,  setSpeed]  = useState(liveMarquee.speed     || DEFAULT_MARQUEE.speed);
  const [active, setActive] = useState(liveMarquee.active    !== false);
  const [newItem,setNewItem]= useState("");
  const [saved,  setSaved]  = useState(false);

  React.useEffect(()=>{
    setItems([...(liveMarquee.items || DEFAULT_MARQUEE.items)]);
    setSep(liveMarquee.separator || DEFAULT_MARQUEE.separator);
    setSpeed(liveMarquee.speed   || DEFAULT_MARQUEE.speed);
    setActive(liveMarquee.active !== false);
  },[JSON.stringify(liveMarquee)]);

  const saveMarquee = async () => {
    try{
      const result=await updateMarquee({ items, separator:sep, speed, active });
      setSaved(true);
      if(result?.db){toast("Homepage marquee saved to database ✓");}
      else{toast("Saved locally — will sync to DB when backend is online");}
      setTimeout(()=>setSaved(false),2500);
    }catch{ toast("Save failed"); }
  };

  const addItem = () => {
    const v = newItem.trim().toUpperCase();
    if(!v) return;
    if(items.includes(v)){ toast("Item already exists"); return; }
    setItems(p=>[...p,v]); setNewItem("");
  };

  const removeItem = i => setItems(p=>p.filter((_,idx)=>idx!==i));
  const moveUp     = i => { if(i===0)return; const a=[...items];[a[i-1],a[i]]=[a[i],a[i-1]];setItems(a); };
  const moveDown   = i => { if(i===items.length-1)return; const a=[...items];[a[i],a[i+1]]=[a[i+1],a[i]];setItems(a); };
  const editItem   = (i,v) => { const a=[...items];a[i]=v.toUpperCase();setItems(a); };

  // ── Reset handlers ────────────────────────────────────────────────────────
  const resetTop = async () => {
    setTopText(DEFAULT_TOPBAR.text); setTopSpeed(DEFAULT_TOPBAR.speed); setTopActive(true);
    await updateTopbar({...DEFAULT_TOPBAR}); toast("Top bar reset to default.");
  };

  const resetMarquee = async () => {
    setItems([...DEFAULT_MARQUEE.items]); setSep(DEFAULT_MARQUEE.separator);
    setSpeed(DEFAULT_MARQUEE.speed); setActive(true);
    await updateMarquee({...DEFAULT_MARQUEE}); toast("Homepage marquee reset to default.");
  };

  return (
    <div style={{padding:isMobile?"16px":"28px 32px",maxWidth:820}}>

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div style={{marginBottom:28}}>
        <h2 style={{fontFamily:"var(--font-d)",color:"var(--dark)",margin:0,fontSize:26,fontWeight:700}}>
          Marquee Banner Editor
        </h2>
        <p style={{color:"var(--muted)",fontSize:13,margin:"4px 0 0"}}>
          Manage the scrolling text on the top announcement bar and homepage strip
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — TOP ANNOUNCEMENT BAR
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{background:"var(--roseL)",borderRadius:14,padding:"2px 20px 16px",marginBottom:24,border:"1.5px solid rgba(194,24,91,.12)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                     marginTop:16,marginBottom:16,flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontWeight:700,fontSize:15,color:"var(--dark)"}}>① Top Announcement Bar</div>
            <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>
              Thin strip at the very top of every page (above the header)
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={resetTop}
              style={{padding:"8px 14px",borderRadius:9,background:"#fff",border:"1.5px solid var(--border2)",
                      fontWeight:600,fontSize:12,cursor:"pointer",color:"var(--muted)",display:"flex",alignItems:"center",gap:5}}>
              <Ic icon={RotateCcw} size={12}/> Reset
            </button>
            <SaveBtn saved={topSaved} onClick={saveTop}/>
          </div>
        </div>

        {/* Live preview */}
        <div style={{borderRadius:10,overflow:"hidden",marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.08)"}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"var(--muted)",
                       padding:"6px 14px",background:"var(--ivory2)",borderBottom:"1px solid var(--border)"}}>
            PREVIEW
          </div>
          {topActive ? (
            <div style={{background:"linear-gradient(90deg,#C2185B,#E65100,#C2185B)",
                         backgroundSize:"200% 100%",animation:"shimmer 4s linear infinite",
                         padding:"8px 0",overflow:"hidden"}}>
              <div style={{display:"flex",animation:`marquee ${topSpeed}s linear infinite`,
                           whiteSpace:"nowrap",width:"max-content"}}>
                {Array(4).fill((topText||"")+"   ").map((t,i)=>(
                  <span key={i} style={{fontSize:11,fontWeight:700,color:"#fff",paddingRight:40,letterSpacing:.8}}>{t}</span>
                ))}
              </div>
            </div>
          ) : (
            <div style={{padding:"14px",textAlign:"center",color:"var(--muted)",fontSize:12,background:"var(--ivory2)"}}>
              Hidden — toggle Active to show
            </div>
          )}
        </div>

        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
          {/* Toggle */}
          <Card style={{marginBottom:0}}>
            <Label>Visibility</Label>
            <Toggle value={topActive} onChange={setTopActive}/>
          </Card>
          {/* Speed */}
          <Card style={{marginBottom:0}}>
            <SpeedSlider value={topSpeed} onChange={setTopSpeed}/>
          </Card>
        </div>

        {/* Text */}
        <Card style={{marginTop:12}}>
          <Label>Announcement Text (single scrolling line)</Label>
          <textarea
            value={topText}
            onChange={e=>setTopText(e.target.value)}
            rows={3}
            placeholder="✦ FREE SHIPPING ABOVE ₹2000   ✦   WELCOME20 — 20% OFF YOUR FIRST ORDER"
            style={{...iStyle,width:"100%",boxSizing:"border-box",resize:"vertical",
                    lineHeight:1.6,fontFamily:"monospace"}}
          />
          <div style={{fontSize:11,color:"var(--muted)",marginTop:6}}>
            Use  ✦  or  ·  or  |  to separate sections. The text scrolls continuously.
          </div>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — HOMEPAGE MARQUEE STRIP
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{background:"var(--saffronL,#FFF8EE)",borderRadius:14,padding:"2px 20px 16px",
                   border:"1.5px solid rgba(230,81,0,.12)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                     marginTop:16,marginBottom:16,flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontWeight:700,fontSize:15,color:"var(--dark)"}}>② Homepage Marquee Strip</div>
            <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>
              Gradient strip below the hero section on the homepage
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={resetMarquee}
              style={{padding:"8px 14px",borderRadius:9,background:"#fff",border:"1.5px solid var(--border2)",
                      fontWeight:600,fontSize:12,cursor:"pointer",color:"var(--muted)",display:"flex",alignItems:"center",gap:5}}>
              <Ic icon={RotateCcw} size={12}/> Reset
            </button>
            <SaveBtn saved={saved} onClick={saveMarquee}/>
          </div>
        </div>

        {/* Live preview */}
        <div style={{borderRadius:10,overflow:"hidden",marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.08)"}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"var(--muted)",
                       padding:"6px 14px",background:"var(--ivory2)",borderBottom:"1px solid var(--border)"}}>
            PREVIEW
          </div>
          {active ? (
            <div style={{background:"linear-gradient(90deg,#C2185B,#E65100,#6A1B9A,#C2185B)",
                         backgroundSize:"300% 100%",animation:"shimmer 6s linear infinite",
                         padding:"12px 0",overflow:"hidden"}}>
              <div className="bv-marquee-track" style={{animation:`marquee ${speed}s linear infinite`}}>
                {[0,1].map(copy=>(
                  <span key={copy} style={{display:"inline-flex",alignItems:"center",flexShrink:0}}>
                    {items.map((t,i)=>(
                      <span key={i} style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.95)",
                                           padding:"0 24px",letterSpacing:1.5,whiteSpace:"nowrap"}}>
                        {sep} {t}
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div style={{padding:"14px",textAlign:"center",color:"var(--muted)",fontSize:12,background:"var(--ivory2)"}}>
              Hidden — toggle Active to show
            </div>
          )}
        </div>

        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:12,marginBottom:12}}>
          <Card style={{marginBottom:0}}>
            <Label>Visibility</Label>
            <Toggle value={active} onChange={setActive}/>
          </Card>
          <Card style={{marginBottom:0}}>
            <Label>Separator Symbol</Label>
            <input value={sep} onChange={e=>setSep(e.target.value)} maxLength={4}
              style={{...iStyle,width:"100%",boxSizing:"border-box",textAlign:"center",fontSize:18}}/>
          </Card>
          <Card style={{marginBottom:0}}>
            <SpeedSlider value={speed} onChange={setSpeed}/>
          </Card>
        </div>

        {/* Add item */}
        <Card>
          <Label>Add New Item</Label>
          <div style={{display:"flex",gap:8}}>
            <input value={newItem} onChange={e=>setNewItem(e.target.value.toUpperCase())}
              onKeyDown={e=>e.key==="Enter"&&addItem()}
              placeholder="E.G. NEW COLLECTION NOW LIVE"
              style={{...iStyle,flex:1}}/>
            <button onClick={addItem}
              style={{padding:"9px 16px",borderRadius:10,background:"var(--rose)",border:"none",
                      color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",
                      display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}>
              <Ic icon={Plus} size={14}/> Add
            </button>
          </div>
        </Card>

        {/* Items list */}
        <div style={{background:"#fff",border:"1.5px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"10px 16px",borderBottom:"1px solid var(--border)",
                       display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",letterSpacing:1}}>
              ITEMS ({items.length})
            </div>
            <div style={{fontSize:11,color:"var(--muted)"}}>Edit inline · ▲▼ to reorder</div>
          </div>

          {items.length === 0 && (
            <div style={{padding:28,textAlign:"center",color:"var(--muted)",fontSize:13}}>
              No items — add one above
            </div>
          )}

          {items.map((item,i) => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",
                                 borderBottom:i<items.length-1?"1px solid var(--border)":"none",
                                 background:"#fff"}}>
              <div style={{color:"var(--muted)",flexShrink:0}}>
                <Ic icon={GripVertical} size={15}/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:1,flexShrink:0}}>
                <button onClick={()=>moveUp(i)} disabled={i===0}
                  style={{border:"none",background:"none",cursor:i===0?"default":"pointer",
                          color:i===0?"var(--border2)":"var(--muted)",padding:"1px 3px",fontSize:10}}>▲</button>
                <button onClick={()=>moveDown(i)} disabled={i===items.length-1}
                  style={{border:"none",background:"none",cursor:i===items.length-1?"default":"pointer",
                          color:i===items.length-1?"var(--border2)":"var(--muted)",padding:"1px 3px",fontSize:10}}>▼</button>
              </div>
              <input value={item} onChange={e=>editItem(i,e.target.value)}
                style={{...iStyle,flex:1,padding:"7px 10px",fontSize:12}}/>
              <button onClick={()=>removeItem(i)}
                style={{flexShrink:0,background:"#FEF2F2",border:"none",borderRadius:8,
                        padding:"6px 8px",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center"}}>
                <Ic icon={Trash2} size={13}/>
              </button>
            </div>
          ))}
        </div>

        {/* Bottom save */}
        <div style={{marginTop:14,display:"flex",justifyContent:"flex-end",gap:8}}>
          <button onClick={resetMarquee}
            style={{padding:"10px 18px",borderRadius:10,background:"#fff",border:"1.5px solid var(--border2)",
                    fontWeight:600,fontSize:13,cursor:"pointer",color:"var(--muted)",
                    display:"flex",alignItems:"center",gap:6}}>
            <Ic icon={RotateCcw} size={13}/> Reset
          </button>
          <SaveBtn saved={saved} onClick={saveMarquee}/>
        </div>
      </div>

    </div>
  );
};

export default MarqueeBannerEditor;
