import React, { useState, useEffect, useRef } from "react";
import { useBreakpoint } from "../hooks";
import { useCatConfig, updateGlobalCat } from "../store/catStore";
import { Ic } from "../utils/helpers";
import { Edit, Image, Layers, Trash2, Upload } from "lucide-react";

const GRAD_PRESETS = [
  "linear-gradient(135deg,#C2185B,#E91E8C)","linear-gradient(135deg,#6A1B9A,#AB47BC)",
  "linear-gradient(135deg,#E65100,#F9A825)","linear-gradient(135deg,#00695C,#26A69A)",
  "linear-gradient(135deg,#1565C0,#42A5F5)","linear-gradient(135deg,#2E7D32,#66BB6A)",
  "linear-gradient(135deg,#BF360C,#FF7043)","linear-gradient(135deg,#880E4F,#F06292)",
  "linear-gradient(135deg,#4527A0,#7C4DFF)","linear-gradient(135deg,#00838F,#4DD0E1)",
];

const FASHION_EMOJIS = [
  "👘","🥻","👗","💃","🤵","👜","💎","📿","🧣","🧤","🧥","👒","👑","💍","👠","👡",
  "👚","👕","🩱","🩲","👙","🩳","👖","🧦","🥿","👟","🥾","🧢","🎀","🌸","💐","🌺",
  "🛍","🎁","✨","💫","🌟","⭐","💠","🔮","🪬","🌙","🌿","🍃","🦋","🪷","🌹",
];

// renderCatIcon: renders either an emoji string or a data URL image
const renderCatIcon = (icon, size=24) => {
  if (!icon) return <span style={{fontSize:size}}>🛒</span>;
  if (icon.startsWith("data:") || icon.startsWith("http")) {
    return <img src={icon} alt="icon" style={{width:size,height:size,objectFit:"cover",borderRadius:"50%"}}/>;
  }
  return <span style={{fontSize:size,lineHeight:1}}>{icon}</span>;
};

const CategoryManager = ({ toast }) => {
  const {isMobile}=useBreakpoint();
  const liveCat=useCatConfig();
  const [cfg,setCfg]=useState(()=>JSON.parse(JSON.stringify(liveCat)));
  const [selCat,setSelCat]=useState(Object.keys(liveCat)[0]||"");
  const [newName,setNewName]=useState("");
  const [newIcon,setNewIcon]=useState("👗");
  const [newGrad,setNewGrad]=useState(GRAD_PRESETS[0]);
  const [newLight,setNewLight]=useState("#FCE4EC");
  const [newSub,setNewSub]=useState("");
  const [confirmDel,setConfirmDel]=useState(null);
  const [showEmojiPicker,setShowEmojiPicker]=useState(null); // "new" | selCat key
  const newIconRef=useRef();
  const editIconRef=useRef();

  useEffect(()=>{setCfg(JSON.parse(JSON.stringify(liveCat)));},[liveCat]);

  const save=async(newCfg)=>{try{await updateGlobalCat(newCfg);setCfg({...newCfg});toast("Saved! Changes applied site-wide.");}catch(e){toast("Save failed","error");}};

  const addCat=()=>{
    const n=newName.trim();
    if(!n){toast("Enter a name","error");return;}
    if(cfg[n]){toast("Already exists","error");return;}
    save({...cfg,[n]:{icon:newIcon,grad:newGrad,light:newLight,subs:[]}});
    setSelCat(n);setNewName("");setNewIcon("👗");
  };

  const delCat=(name)=>{
    const c2={...cfg};delete c2[name];
    save(c2);setSelCat(Object.keys(c2)[0]||"");setConfirmDel(null);
  };

  const addSub=()=>{
    const s=newSub.trim();if(!s||!selCat)return;
    if(cfg[selCat]?.subs?.includes(s)){toast("Already exists","error");return;}
    save({...cfg,[selCat]:{...cfg[selCat],subs:[...(cfg[selCat]?.subs||[]),s]}});
    setNewSub("");
  };

  const delSub=(cat,sub)=>save({...cfg,[cat]:{...cfg[cat],subs:cfg[cat].subs.filter(s=>s!==sub)}});

  const updateField=(cat,field,val)=>{const c2={...cfg,[cat]:{...cfg[cat],[field]:val}};setCfg(c2);};
  const commitField=()=>save({...cfg});

  // Upload image icon → convert to base64 data URL
  const handleIconUpload=(e,target)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    if(file.size>200*1024){toast("Image must be under 200 KB","error");return;}
    const reader=new FileReader();
    reader.onload=ev=>{
      const dataUrl=ev.target.result;
      if(target==="new"){
        setNewIcon(dataUrl);
      } else {
        updateField(target,"icon",dataUrl);
        setTimeout(commitField,50);
      }
    };
    reader.readAsDataURL(file);
  };

  const iS={background:"#fff",border:"1.5px solid var(--border2)",color:"var(--text)",padding:"10px 12px",fontSize:13,borderRadius:10,outline:"none",fontWeight:500};
  const cats=Object.keys(cfg);

  // Shared icon editor UI used for both new category and edit existing
  const IconEditor=({value, onChange, uploadTarget, pickerId})=>(
    <div>
      <div style={{fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:.5,textTransform:"uppercase",marginBottom:8}}>Icon</div>
      {/* Current icon + action buttons */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <div style={{width:52,height:52,borderRadius:"50%",background:"linear-gradient(135deg,var(--rose),var(--saffron))",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden",boxShadow:"0 4px 12px rgba(194,24,91,.25)"}}>
          {renderCatIcon(value,28)}
        </div>
        <div style={{flex:1}}>
          <div style={{display:"flex",gap:6,marginBottom:6}}>
            {/* Emoji picker toggle */}
            <button onClick={()=>setShowEmojiPicker(showEmojiPicker===pickerId?null:pickerId)}
              style={{flex:1,padding:"7px 0",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",border:"1.5px solid var(--border2)",
                background:showEmojiPicker===pickerId?"var(--roseL)":"#fff",
                color:showEmojiPicker===pickerId?"var(--rose)":"var(--muted)"}}>
              😊 Pick Emoji
            </button>
            {/* Upload image */}
            <button onClick={()=>document.getElementById(`icon-upload-${pickerId}`).click()}
              style={{flex:1,padding:"7px 0",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",
                border:"1.5px solid var(--border2)",background:"#fff",color:"var(--muted)",
                display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
              <Ic icon={Upload} size={12}/>Upload
            </button>
            <input id={`icon-upload-${pickerId}`} type="file" accept="image/*" style={{display:"none"}}
              onChange={e=>handleIconUpload(e,uploadTarget)}/>
          </div>
          {/* Manual emoji type */}
          <input value={value.startsWith("data:")||value.startsWith("http")?"":value}
            onChange={e=>onChange(e.target.value)}
            placeholder="Type emoji…"
            style={{...iS,width:"100%",boxSizing:"border-box",fontSize:18,textAlign:"center",padding:"6px 8px"}}
            maxLength={4}/>
        </div>
      </div>

      {/* Emoji picker grid */}
      {showEmojiPicker===pickerId&&(
        <div style={{background:"#fff",borderRadius:12,border:"1.5px solid var(--border)",padding:12,marginBottom:10,boxShadow:"0 8px 24px rgba(0,0,0,.1)"}}>
          <div style={{fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:.5,marginBottom:8,textTransform:"uppercase"}}>Fashion & Style Icons</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {FASHION_EMOJIS.map(em=>(
              <button key={em} onClick={()=>{onChange(em);setShowEmojiPicker(null);}}
                style={{width:36,height:36,borderRadius:8,border:value===em?"2px solid var(--rose)":"2px solid transparent",
                  background:value===em?"var(--roseL)":"var(--ivory2)",fontSize:20,cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}
                onMouseEnter={e=>e.currentTarget.style.background="var(--roseL)"}
                onMouseLeave={e=>e.currentTarget.style.background=value===em?"var(--roseL)":"var(--ivory2)"}>
                {em}
              </button>
            ))}
          </div>
          {/* If current icon is uploaded image, show reset option */}
          {(value.startsWith("data:")||value.startsWith("http"))&&(
            <button onClick={()=>{onChange("👗");setShowEmojiPicker(null);}}
              style={{marginTop:8,width:"100%",padding:"6px 0",borderRadius:8,background:"#FEF2F2",border:"none",color:"#DC2626",fontWeight:600,fontSize:11,cursor:"pointer"}}>
              Remove Uploaded Image
            </button>
          )}
        </div>
      )}
    </div>
  );

  return(
    <div>
      <h2 style={{fontFamily:"var(--font-d)",color:"var(--dark)",marginBottom:6,fontSize:28,fontWeight:700}}>Category Manager</h2>
      <p style={{color:"var(--muted)",fontSize:13,marginBottom:24}}>Add, edit or delete categories. Click emoji or upload an image as the icon.</p>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"280px 1fr",gap:18,alignItems:"start"}}>

        {/* LEFT — Add new + list */}
        <div>
          <div style={{background:"#fff",borderRadius:16,border:"1.5px solid var(--border)",padding:18,marginBottom:14,boxShadow:"0 2px 12px rgba(194,24,91,.06)"}}>
            <div style={{fontSize:11,fontWeight:800,color:"var(--rose)",letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>+ New Category</div>
            <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Category name"
              style={{...iS,width:"100%",boxSizing:"border-box",marginBottom:14}}
              onKeyDown={e=>e.key==="Enter"&&addCat()}/>

            <IconEditor value={newIcon} onChange={setNewIcon} uploadTarget="new" pickerId="new"/>

            <div style={{fontSize:10,fontWeight:700,color:"var(--muted)",marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Gradient</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
              {GRAD_PRESETS.map(g=>(
                <div key={g} onClick={()=>setNewGrad(g)} style={{width:26,height:26,borderRadius:"50%",background:g,cursor:"pointer",
                  border:newGrad===g?"3px solid #1a0a00":"3px solid transparent",boxShadow:"0 2px 6px rgba(0,0,0,.2)",transition:"all .15s"}}/>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <span style={{fontSize:10,fontWeight:700,color:"var(--muted)",flexShrink:0,textTransform:"uppercase",letterSpacing:.5}}>BG Colour</span>
              <input type="color" value={newLight} onChange={e=>setNewLight(e.target.value)}
                style={{width:36,height:32,borderRadius:8,border:"1.5px solid var(--border2)",cursor:"pointer",padding:2}}/>
              <span style={{fontSize:11,color:"var(--muted)"}}>{newLight}</span>
            </div>
            {/* Preview */}
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,background:newLight,marginBottom:14,border:"1.5px dashed var(--border2)"}}>
              <div style={{width:38,height:38,borderRadius:"50%",background:newGrad,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                {renderCatIcon(newIcon,22)}
              </div>
              <span style={{fontSize:13,fontWeight:700,color:"var(--dark)"}}>{newName||"Preview"}</span>
            </div>
            <button onClick={addCat}
              style={{width:"100%",padding:"11px 0",background:"linear-gradient(135deg,var(--rose),var(--saffron))",border:"none",borderRadius:10,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>
              Add Category
            </button>
          </div>

          {/* Category list */}
          <div style={{background:"#fff",borderRadius:16,border:"1.5px solid var(--border)",overflow:"hidden"}}>
            <div style={{padding:"11px 16px",background:"linear-gradient(135deg,var(--roseL),var(--saffronL))",borderBottom:"1px solid var(--border)",fontSize:11,fontWeight:800,color:"var(--rose)",letterSpacing:1,textTransform:"uppercase"}}>
              Categories ({cats.length})
            </div>
            {cats.map(name=>(
              <div key={name} onClick={()=>setSelCat(name)}
                style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",cursor:"pointer",
                  background:selCat===name?"var(--roseL)":"#fff",
                  borderLeft:`3px solid ${selCat===name?"var(--rose)":"transparent"}`,
                  borderBottom:"1px solid var(--border)",transition:"all .15s"}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:cfg[name]?.grad,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                  {renderCatIcon(cfg[name]?.icon,18)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:selCat===name?700:500,color:selCat===name?"var(--rose)":"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
                  <div style={{fontSize:10,color:"var(--muted)"}}>{cfg[name]?.subs?.length||0} subs</div>
                </div>
                <button onClick={e=>{e.stopPropagation();setConfirmDel(name);}}
                  style={{background:"none",border:"none",color:"#EF4444",cursor:"pointer",padding:"2px 4px",opacity:.55,transition:"opacity .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity=".55"}>
                  <Ic icon={Trash2} size={14}/>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Edit selected category */}
        {selCat&&cfg[selCat]?(
          <div>
            <div style={{background:"#fff",borderRadius:16,border:"1.5px solid var(--border)",padding:22,marginBottom:14,boxShadow:"0 2px 12px rgba(194,24,91,.06)"}}>

              {/* Header */}
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20,paddingBottom:16,borderBottom:"1.5px solid var(--border)"}}>
                <div style={{width:54,height:54,borderRadius:"50%",background:cfg[selCat].grad,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",boxShadow:"0 4px 16px rgba(0,0,0,.12)"}}>
                  {renderCatIcon(cfg[selCat].icon,30)}
                </div>
                <div>
                  <div style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:700,color:"var(--dark)"}}>{selCat}</div>
                  <div style={{fontSize:12,color:"var(--muted)"}}>{cfg[selCat].subs?.length||0} sub-categories</div>
                </div>
              </div>

              {/* Icon editor */}
              <div style={{marginBottom:16}}>
                <IconEditor
                  value={cfg[selCat].icon}
                  onChange={v=>{updateField(selCat,"icon",v);setTimeout(commitField,50);}}
                  uploadTarget={selCat}
                  pickerId={selCat}
                />
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:.5,textTransform:"uppercase",marginBottom:6}}>Light BG</div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <input type="color" value={cfg[selCat].light} onChange={e=>updateField(selCat,"light",e.target.value)} onBlur={commitField}
                      style={{width:40,height:36,borderRadius:8,border:"1.5px solid var(--border2)",cursor:"pointer",padding:2}}/>
                    <span style={{fontSize:11,color:"var(--muted)"}}>{cfg[selCat].light}</span>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:.5,textTransform:"uppercase",marginBottom:6}}>Live Preview</div>
                  <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:10,background:cfg[selCat].light,border:"1.5px dashed var(--border2)"}}>
                    <div style={{width:30,height:30,borderRadius:"50%",background:cfg[selCat].grad,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                      {renderCatIcon(cfg[selCat].icon,16)}
                    </div>
                    <span style={{fontSize:11,fontWeight:700,color:"var(--dark)"}}>{selCat}</span>
                  </div>
                </div>
              </div>

              <div>
                <div style={{fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:.5,textTransform:"uppercase",marginBottom:8}}>Gradient</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {GRAD_PRESETS.map(g=>(
                    <div key={g} onClick={()=>{updateField(selCat,"grad",g);setTimeout(commitField,50);}}
                      style={{width:30,height:30,borderRadius:"50%",background:g,cursor:"pointer",
                        border:cfg[selCat].grad===g?"3px solid #1a0a00":"3px solid transparent",
                        boxShadow:"0 2px 6px rgba(0,0,0,.2)",transition:"all .15s"}}/>
                  ))}
                </div>
              </div>
            </div>

            {/* Sub-categories */}
            <div style={{background:"#fff",borderRadius:16,border:"1.5px solid var(--border)",padding:22}}>
              <div style={{fontFamily:"var(--font-d)",fontSize:18,fontWeight:700,color:"var(--dark)",marginBottom:14}}>
                Sub-Categories — <span style={{background:"linear-gradient(135deg,var(--rose),var(--saffron))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{selCat}</span>
              </div>
              <div style={{display:"flex",gap:8,marginBottom:16}}>
                <input value={newSub} onChange={e=>setNewSub(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addSub()} placeholder="New sub-category…" style={{...iS,flex:1}}/>
                <button onClick={addSub} style={{background:"linear-gradient(135deg,var(--rose),var(--saffron))",border:"none",padding:"10px 16px",borderRadius:10,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>+ Add</button>
              </div>
              {(!cfg[selCat]?.subs||cfg[selCat].subs.length===0)?(
                <div style={{textAlign:"center",padding:"24px 0",color:"var(--muted)",fontSize:13}}>No sub-categories yet.</div>
              ):(
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {cfg[selCat].subs.map(sub=>(
                    <div key={sub} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:99,background:cfg[selCat].light,border:"1.5px solid var(--border2)"}}>
                      <span style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{sub}</span>
                      <button onClick={()=>delSub(selCat,sub)} style={{background:"none",border:"none",cursor:"pointer",color:"#EF4444",fontSize:16,lineHeight:1,padding:0,marginLeft:2}}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 20px",color:"var(--muted)",textAlign:"center"}}>
            <Ic icon={Layers} size={48} color="var(--border2)"/>
            <div style={{fontSize:15,fontWeight:600,marginTop:16}}>Select a category to edit</div>
          </div>
        )}
      </div>

      {/* Confirm delete */}
      {confirmDel&&(
        <div style={{position:"fixed",inset:0,background:"rgba(26,10,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,backdropFilter:"blur(4px)",padding:16}}>
          <div style={{background:"#fff",borderRadius:20,padding:28,maxWidth:360,width:"100%",textAlign:"center",boxShadow:"0 24px 64px rgba(0,0,0,.25)"}}>
            <Ic icon={Trash2} size={44} color="#DC2626"/>
            <h3 style={{fontFamily:"var(--font-d)",fontSize:22,color:"var(--dark)",marginBottom:8,marginTop:12,fontWeight:700}}>Delete Category?</h3>
            <p style={{color:"var(--muted)",fontSize:13,lineHeight:1.75,marginBottom:20}}>
              Delete <strong style={{color:"var(--rose)"}}>{confirmDel}</strong> and all its sub-categories? Products in this category will still exist but won't be grouped.
            </p>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>setConfirmDel(null)} style={{padding:"11px 24px",borderRadius:12,background:"var(--ivory2)",border:"1.5px solid var(--border2)",fontWeight:700,fontSize:13,cursor:"pointer",color:"var(--text)"}}>Cancel</button>
              <button onClick={()=>delCat(confirmDel)} style={{padding:"11px 24px",borderRadius:12,background:"linear-gradient(135deg,#EF4444,#DC2626)",border:"none",fontWeight:700,fontSize:13,cursor:"pointer",color:"#fff",boxShadow:"0 4px 16px rgba(239,68,68,.3)"}}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── PROMO BANNER EDITOR ─────────────────────────────────────────────────────── */

export default CategoryManager;