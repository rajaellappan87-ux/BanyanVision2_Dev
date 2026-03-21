import React, { useEffect, useState } from "react";
import { useBreakpoint } from "../hooks";
import { useSettings, updateSettings } from "../store/contentStore";
import { apiEmailCheck, apiEmailTest } from "../api";
import { DEFAULT_SETTINGS } from "../constants/defaults";
import { Ic } from "../utils/helpers";
import { Eye, Facebook, Globe, Instagram, Phone, Save, Settings, Truck, Twitter, Warehouse, X, Youtube } from "lucide-react";

/* ── SITE SETTINGS ───────────────────────────────────────────────────────────── */
const SiteSettings = ({ toast }) => {
  const {isMobile} = useBreakpoint();
  const st = useSettings(); // loads from DB on mount
  const [form, setForm] = useState({...st});

  // Sync form whenever DB data loads (first open after cold start)
  React.useEffect(() => { setForm({...st}); }, [JSON.stringify(st)]);
  const [saved, setSaved]       = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);  // null | {ok, connected, smtp, error, steps}
  const [emailTesting, setEmailTesting] = useState(false);
  const [testTo, setTestTo] = useState("");

  const setVal = (k,v) => setForm(f => ({...f,[k]:v}));

  const checkEmail = async () => {
    setEmailTesting(true);
    try {
      const r = await apiEmailCheck();
      setEmailStatus(r.data);
    } catch (e) {
      setEmailStatus({ ok: false, connected: false, error: e.response?.data?.error || e.message });
    } finally { setEmailTesting(false); }
  };

  const sendTestEmail = async () => {
    setEmailTesting(true);
    try {
      const r = await apiEmailTest(testTo || undefined);
      setEmailStatus({ ...r.data, testSent: true });
      toast(r.data.ok ? "✅ Test email sent — check your inbox!" : "❌ Test email failed — see details below");
    } catch (e) {
      setEmailStatus({ ok: false, error: e.response?.data?.error || e.message, testSent: true });
      toast("Test email failed");
    } finally { setEmailTesting(false); }
  };

  const save = async () => {
    try {
      const result = await updateSettings({...form});
      setSaved(true);
      if (result?.db) {
        toast("Site settings saved to database ✓");
      } else {
        toast("Saved locally — will sync to DB when backend is online", "warn");
      }
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      toast("Save failed — please try again");
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

      {/* Delivery & Returns */}
      {renderSection(<Ic icon={Truck} size={18} color="#fff"/>, "Delivery & Returns",
        <div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:16,marginBottom:16}}>
            {renderField("Standard Shipping (₹)", "shippingCharge",    "number", "99",  "Charged when order is below free threshold")}
            {renderField("Free Shipping Above (₹)","freeShippingAbove","number", "2000","Set to 0 for always free shipping")}
            {renderField("Express Charge (₹)",     "expressCharge",    "number", "199", "Express delivery fee")}
          </div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16,marginBottom:16}}>
            {renderField("Standard Delivery Days", "standardDays","text","3–5 business days","Shown on product page and cart")}
            {renderField("Express Delivery Days",  "expressDays", "text","1–2 business days","Shown on product page")}
          </div>
          <div style={{background:"var(--ivory2)",borderRadius:12,padding:"16px",border:"1.5px solid var(--border)"}}>
            <div style={{fontSize:13,fontWeight:700,color:"var(--dark)",marginBottom:12}}>
              Free Returns
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <div onClick={()=>setVal("returnsEnabled",!form.returnsEnabled)}
                style={{width:44,height:24,borderRadius:12,flexShrink:0,
                        background:form.returnsEnabled?"var(--rose)":"var(--border2)",
                        cursor:"pointer",position:"relative",transition:"background .2s"}}>
                <div style={{position:"absolute",top:3,
                             left:form.returnsEnabled?22:3,width:18,height:18,
                             borderRadius:"50%",background:"#fff",transition:"left .2s",
                             boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
              </div>
              <span style={{fontSize:13,fontWeight:600,
                            color:form.returnsEnabled?"var(--rose)":"var(--muted)"}}>
                {form.returnsEnabled
                  ? "Free Returns enabled — badge visible everywhere"
                  : "Free Returns hidden — not shown anywhere on site"}
              </span>
            </div>
            {form.returnsEnabled&&(
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
                {renderField("Return Window (days)","returnDays", "number","7",  "How many days customers have to return")}
                {renderField("Return Type",         "returnType", "text",  "Free pickup from door","Shown on product page")}
              </div>
            )}
            {!form.returnsEnabled&&(
              <div style={{fontSize:12,color:"var(--muted)",fontStyle:"italic"}}>
                Enable Free Returns to show return badge on Homepage, Product pages, Footer, Login page and Cart.
              </div>
            )}
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

      {/* ── Email Diagnostics ── */}
      <div style={{background:"#fff",border:"1.5px solid var(--border)",borderRadius:14,padding:"20px 22px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:14}}>
          <div>
            <div style={{fontWeight:700,fontSize:15,color:"var(--dark)"}}>📧 Email Diagnostics</div>
            <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>Test your SMTP connection and send a test email</div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={checkEmail} disabled={emailTesting}
              style={{padding:"9px 18px",borderRadius:10,background:"var(--ivory2)",border:"1.5px solid var(--border2)",fontWeight:600,fontSize:13,cursor:"pointer",color:"var(--muted)"}}>
              {emailTesting?"Checking...":"Check SMTP"}
            </button>
            <button onClick={sendTestEmail} disabled={emailTesting}
              style={{padding:"9px 18px",borderRadius:10,background:"var(--rose)",border:"none",fontWeight:700,fontSize:13,cursor:"pointer",color:"#fff"}}>
              {emailTesting?"Sending...":"Send Test Email"}
            </button>
          </div>
        </div>

        <div style={{display:"flex",gap:8,marginBottom:emailStatus?12:0}}>
          <input value={testTo} onChange={e=>setTestTo(e.target.value)}
            placeholder={`Send test to (default: ${form.email||"admin email"})`}
            style={{flex:1,padding:"9px 14px",borderRadius:10,border:"1.5px solid var(--border2)",fontSize:13,outline:"none",background:"#fff"}}/>
        </div>

        {emailStatus&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>

            {/* Result banner */}
            <div style={{background:emailStatus.ok?"#F0FDF4":"#FEF2F2",borderRadius:12,padding:"14px 16px",
                         border:`1px solid ${emailStatus.ok?"#BBF7D0":"#FECACA"}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontSize:18}}>{emailStatus.ok?"✅":"❌"}</span>
                <span style={{fontWeight:700,fontSize:14,color:emailStatus.ok?"#166534":"#DC2626"}}>
                  {emailStatus.ok
                    ? (emailStatus.testSent?"Test email sent successfully! Check your inbox.":"SMTP connected")
                    : emailStatus.error||"SMTP failed"}
                </span>
              </div>

              {/* SMTP config details */}
              {emailStatus.smtp&&(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:6,marginBottom:8}}>
                  {[["Host",emailStatus.smtp.host],["Port",emailStatus.smtp.port],["From",emailStatus.smtp.from],["Admin",emailStatus.smtp.adminEmail]].map(([k,v])=>(
                    <div key={k} style={{background:"rgba(255,255,255,.7)",borderRadius:7,padding:"6px 10px"}}>
                      <div style={{fontSize:10,fontWeight:700,color:"var(--muted)",marginBottom:1}}>{k}</div>
                      <div style={{fontSize:11,fontWeight:600,wordBreak:"break-all"}}>{v}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Step results */}
              {emailStatus.steps&&(
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {emailStatus.steps.map((s,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:7,fontSize:12}}>
                      <span>{s.ok?"✅":"❌"}</span>
                      <div>
                        <span style={{fontWeight:700}}>{s.step}: </span>
                        <span style={{color:"var(--muted)"}}>{s.detail}</span>
                        {s.hint&&<div style={{marginTop:2,color:"#D97706",fontWeight:600,fontSize:11}}>💡 {s.hint}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Railway fix guidance — shown when SMTP is blocked */}
            {!emailStatus.ok&&(
              <div style={{background:"#FFFBEB",borderRadius:12,padding:"16px",border:"1.5px solid #FDE68A"}}>
                <div style={{fontWeight:700,fontSize:13,color:"#92400E",marginBottom:10}}>
                  🚂 Railway blocks outbound SMTP ports (465, 587) — Switch to Resend (free, works instantly)
                </div>

                <div style={{fontSize:12,color:"#78350F",lineHeight:1.8,marginBottom:12}}>
                  <strong>Step 1</strong> — Sign up free at{" "}
                  <a href="https://resend.com" target="_blank" rel="noopener noreferrer"
                    style={{color:"#C2185B",fontWeight:700}}>resend.com</a>
                  {" "}→ Create API Key → Add your domain (banyanvision.com)<br/>
                  <strong>Step 2</strong> — In Railway → Variables, add/update:
                </div>

                <div style={{background:"#1A1A2E",borderRadius:8,padding:"12px 14px",
                              fontFamily:"monospace",fontSize:11,color:"#E2E8F0",
                              marginBottom:12,lineHeight:2}}>
                  <div><span style={{color:"#68D391"}}>EMAIL_PROVIDER</span> = resend</div>
                  <div><span style={{color:"#68D391"}}>RESEND_API_KEY</span> = re_xxxxxxxxxxxxxxxxxxxx</div>
                  <div><span style={{color:"#68D391"}}>EMAIL_FROM</span> = "BanyanVision" &lt;noreply@banyanvision.com&gt;</div>
                  <div><span style={{color:"#68D391"}}>ADMIN_EMAIL</span> = admin@banyanvision.com</div>
                  <div style={{color:"#718096",marginTop:4}}># Remove or keep these — they are ignored when EMAIL_PROVIDER=resend</div>
                  <div style={{color:"#718096"}}># SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS</div>
                </div>

                <div style={{fontSize:12,color:"#78350F",lineHeight:1.8}}>
                  <strong>Step 3</strong> — Click Deploy in Railway → test email again<br/>
                  <strong>Free tier:</strong> 3,000 emails/month — enough for your store.<br/>
                  <strong>Alternative:</strong> Contact Railway support and ask them to whitelist outbound SMTP for your service.
                </div>
              </div>
            )}

          </div>
        )}
      </div>

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