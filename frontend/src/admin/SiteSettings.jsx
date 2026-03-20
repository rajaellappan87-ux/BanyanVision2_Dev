import React, { useState } from "react";
import { useBreakpoint } from "../hooks";
import { useSettings, updateSettings } from "../store/contentStore";
import { DEFAULT_SETTINGS } from "../constants/defaults";
import { Ic } from "../utils/helpers";
import { Eye, Facebook, Globe, Instagram, Phone, Save, Settings, Twitter, Upload, Warehouse, X, Youtube } from "lucide-react";

/* ── SITE SETTINGS ───────────────────────────────────────────────────────────── */
const SiteSettings = ({ toast }) => {
  const {isMobile} = useBreakpoint();
  const st = useSettings(); // loads from DB on mount
  const [form, setForm] = useState({...st});

  // Sync form whenever DB data loads (first open after cold start)
  React.useEffect(() => { setForm({...st}); }, [JSON.stringify(st)]);
  const [saved, setSaved] = useState(false);

  const setVal = (k,v) => setForm(f => ({...f,[k]:v}));

  const save = async () => {
    try {
      await updateSettings({...form});
      setSaved(true);
      toast("Site settings saved! Changes are live ✓");
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      toast("Save failed — please try again", "error");
    }
  };

  const reset = async () => {
    setForm({...DEFAULT_SETTINGS});
    await updateSettings({...DEFAULT_SETTINGS});
    toast("Settings reset to defaults");
  };

  const iSt = {
    background:"#fff", border:"1.5px solid var(--border2)", color:"var(--text)",
    padding:"10px 13px", fontSize:13, borderRadius:10, outline:"none",
    width:"100%", boxSizing:"border-box", fontWeight:500,
  };

  const secStyle = {
    background:"#fff", borderRadius:16, padding:isMobile?18:24,
    border:"1.5px solid var(--border)", boxShadow:"0 4px 24px rgba(194,24,91,.05)", marginBottom:20
  };

  const renderField = (label, k, type="text", placeholder="", hint="") => (
    <div key={k} style={{marginBottom:16}}>
      <label style={{display:"block",fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:.5,textTransform:"uppercase",marginBottom:6}}>{label}</label>
      <input type={type} value={form[k]||""} onChange={e=>setVal(k,e.target.value)}
        placeholder={placeholder} style={iSt}
        onFocus={e=>e.target.style.borderColor="var(--rose)"}
        onBlur={e=>e.target.style.borderColor="var(--border2)"}/>
      {hint&&<div style={{fontSize:10,color:"var(--muted)",marginTop:4,fontWeight:500}}>{hint}</div>}
    </div>
  );

  const renderSection = (icon, title, children) => (
    <div style={secStyle}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,paddingBottom:14,borderBottom:"1.5px solid var(--border)"}}>
        <div style={{width:38,height:38,borderRadius:10,background:"linear-gradient(135deg,var(--rose),var(--saffron))",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{icon}</div>
        <div style={{fontFamily:"var(--font-d)",fontSize:17,fontWeight:700,color:"var(--dark)"}}>{title}</div>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{maxWidth:720}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{fontFamily:"var(--font-d)",color:"var(--dark)",margin:"0 0 6px",fontSize:28,fontWeight:700}}>Site Settings</h2>
          <p style={{color:"var(--muted)",fontSize:13,margin:0}}>Manage contact details, social links and business info. Changes reflect instantly across the website.</p>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={reset} style={{padding:"10px 18px",borderRadius:10,background:"var(--ivory2)",border:"1.5px solid var(--border2)",fontWeight:600,fontSize:13,cursor:"pointer",color:"var(--muted)"}}>
            Reset
          </button>
          <button onClick={save} style={{padding:"10px 22px",borderRadius:10,background:"linear-gradient(135deg,var(--rose),var(--saffron))",border:"none",fontWeight:700,fontSize:13,cursor:"pointer",color:"#fff",boxShadow:"0 4px 16px rgba(194,24,91,.3)",display:"flex",alignItems:"center",gap:8}}>
            <Ic icon={Save} size={14}/>{saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Live preview banner */}
      <div style={{background:"linear-gradient(135deg,var(--roseL),var(--saffronL))",borderRadius:12,padding:"12px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:10,border:"1.5px solid var(--border)"}}>
        <Ic icon={Eye} size={18} color="var(--rose)"/>
        <div style={{fontSize:12,color:"var(--text)",fontWeight:600}}>
          Changes apply <strong>instantly</strong> to Footer, WhatsApp button, and all contact links — no refresh needed.
        </div>
      </div>

      {/* Contact Information */}
      {renderSection(<Ic icon={Phone} size={18} color="#fff"/>, "Contact Information",
        <div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
            {renderField("Phone Number",    "phone",    "text",  "+91 98765 43210",          "Displayed in footer. Format: +91 XXXXX XXXXX")}
            {renderField("WhatsApp Number", "whatsapp", "text",  "919876543210",             "Country code + number, no spaces. e.g. 919894123456")}
            {renderField("Email Address",   "email",    "email", "admin@banyanvision.com",   "Shown in footer contact section")}
            {renderField("Business Address","address",  "text",  "Chennai, Tamil Nadu, India","Short address shown in footer")}
          </div>
          {renderField("WhatsApp Pre-filled Message","whatsappMsg","text","Hi BanyanVision! I need help.","Message customers see when they tap the WhatsApp button")}
          <div style={{marginTop:4,padding:"12px 16px",background:"#F0FDF4",borderRadius:10,border:"1px solid #BBF7D0"}}>
            <div style={{fontSize:10,fontWeight:700,color:"#16A34A",letterSpacing:.5,textTransform:"uppercase",marginBottom:6}}>WhatsApp Link Preview</div>
            <div style={{fontFamily:"monospace",fontSize:11,color:"#166534",wordBreak:"break-all"}}>
              {`https://wa.me/${form.whatsapp}?text=${encodeURIComponent(form.whatsappMsg||"")}`}
            </div>
          </div>
        </div>
      )}

      {/* Business Information */}
      {renderSection(<Ic icon={Warehouse} size={18} color="#fff"/>, "Business Information",
        <div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
            {renderField("GST Number",     "gst",    "text", "33ABCDE1234F1Z5",           "Displayed in footer. Required for Indian e-commerce.")}
            {renderField("Google Maps URL","mapUrl", "text", "https://maps.google.com/?q=","Optional — add your store location link")}
          </div>
          <div style={{padding:"10px 14px",background:"#FFF7ED",borderRadius:10,border:"1px solid #FED7AA",fontSize:12,color:"#92400E",fontWeight:500}}>
            GST format: 2-digit state code + 10-digit PAN + 1-digit entity + Z + 1-digit check. Example: <strong>33ABCDE1234F1Z5</strong>
          </div>
        </div>
      )}

      {/* Social Media */}
      {renderSection(<Ic icon={Globe} size={18} color="#fff"/>, "Social Media Links",
        <div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
            {renderField("Instagram", "instagram","text","https://www.instagram.com/yourpage","Full URL including https://")}
            {renderField("Facebook",  "facebook", "text","https://www.facebook.com/yourpage", "Full URL including https://")}
            {renderField("YouTube",   "youtube",  "text","https://www.youtube.com/@yourchannel","Full URL including https://")}
            {renderField("Twitter/X", "twitter",  "text","https://twitter.com/yourhandle",    "Full URL including https://")}
          </div>
          <div style={{marginTop:12}}>
            <div style={{fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:.5,textTransform:"uppercase",marginBottom:10}}>Preview</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {[
                {Icon:Instagram,label:"Instagram",k:"instagram",color:"#E1306C"},
                {Icon:Facebook, label:"Facebook", k:"facebook", color:"#1877F2"},
                {Icon:Youtube,  label:"YouTube",  k:"youtube",  color:"#FF0000"},
                {Icon:Twitter,  label:"Twitter/X",k:"twitter",  color:"#1DA1F2"},
              ].map(s=>(
                <a key={s.k} href={form[s.k]||"#"} target="_blank" rel="noopener noreferrer"
                  style={{display:"flex",alignItems:"center",gap:7,padding:"7px 14px",borderRadius:99,
                    background:form[s.k]?"#fff":"var(--ivory2)",
                    border:`1.5px solid ${form[s.k]?s.color:"var(--border2)"}`,
                    textDecoration:"none",fontSize:12,fontWeight:600,
                    color:form[s.k]?s.color:"var(--muted)",transition:"all .2s"}}>
                  <Ic icon={s.Icon} size={14}/> {s.label}
                  {form[s.k]&&<span style={{fontSize:9,opacity:.6}}>↗</span>}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save at bottom */}
      <div style={{display:"flex",justifyContent:"flex-end",gap:10,paddingTop:8}}>
        <button onClick={reset} style={{padding:"12px 24px",borderRadius:11,background:"var(--ivory2)",border:"1.5px solid var(--border2)",fontWeight:600,fontSize:13,cursor:"pointer",color:"var(--muted)"}}>
          Reset to Defaults
        </button>
        <button onClick={save} style={{padding:"12px 32px",borderRadius:11,background:"linear-gradient(135deg,var(--rose),var(--saffron))",border:"none",fontWeight:700,fontSize:14,cursor:"pointer",color:"#fff",boxShadow:"0 4px 16px rgba(194,24,91,.3)",display:"flex",alignItems:"center",gap:8}}>
          <Ic icon={Save} size={14}/>{saved ? "All Changes Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
};

export default SiteSettings;