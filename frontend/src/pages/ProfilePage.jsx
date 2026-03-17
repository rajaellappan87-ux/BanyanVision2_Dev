import React, { useState } from "react";
import { useBreakpoint } from "../hooks";
import { useAuth } from "../context/AuthContext";
import { Ic } from "../utils/helpers";
import { apiUpdateProfile } from "../api";
import { Phone, Save, User } from "lucide-react";

/* ── PROFILE ─────────────────────────────────────────────────────────────────── */
const ProfilePage = ({ toast }) => {
  const {isMobile}=useBreakpoint();
  const {user,updateUser}=useAuth();
  const [form,setForm]=useState({name:user?.name||"",email:user?.email||"",phone:user?.phone||"",address:user?.address||""});
  const [saving,setSaving]=useState(false);
  const save=async()=>{setSaving(true);try{const r=await apiUpdateProfile(form);updateUser(r.data.user);toast("Profile saved! ✓");}catch(err){toast(err.response?.data?.message||"Error","error");}setSaving(false);};
  const iStyle={background:"var(--ivory2)",border:"1.5px solid var(--border2)",color:"var(--text)",padding:"12px 14px",fontSize:13,borderRadius:12,outline:"none",width:"100%",boxSizing:"border-box",fontWeight:500};
  return(
    <div style={{background:"var(--ivory)",minHeight:"100vh",padding:isMobile?"20px 16px":"44px 80px"}}>
      <div style={{maxWidth:520,margin:"0 auto"}}>
        <h1 style={{fontFamily:"var(--font-d)",color:"var(--dark)",fontSize:isMobile?28:44,fontWeight:700,marginBottom:24}}>My Profile</h1>
        <div style={{background:"#fff",borderRadius:"20px",border:"1.5px solid var(--border)",padding:isMobile?20:32,boxShadow:"0 4px 24px rgba(194,24,91,0.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24,paddingBottom:20,borderBottom:"1.5px solid var(--border)"}}>
            <div style={{width:60,height:60,background:"linear-gradient(135deg,var(--rose),var(--saffron))",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:"#fff",fontWeight:800,boxShadow:"0 6px 20px rgba(194,24,91,.3)"}}>{user?.name?.[0]}</div>
            <div>
              <div style={{fontFamily:"var(--font-d)",fontSize:20,fontWeight:700,color:"var(--dark)"}}>{user?.name}</div>
              <span className="tag" style={{background:user?.role==="admin"?"var(--purpleL)":"var(--tealL)",color:user?.role==="admin"?"var(--purple)":"var(--teal)",fontSize:10,marginTop:4}}>{user?.role==="admin"?"Admin":"✓ Customer"}</span>
            </div>
          </div>
          {[["Full Name","name","text"],["Email","email","email"],["Phone","phone","tel"],["Address","address","text"]].map(([label,key,type])=>(
            <div key={key} style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:11,fontWeight:700,color:"var(--text2)",marginBottom:6,letterSpacing:.3}}>{label}</label>
              <input type={type} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={iStyle}/>
            </div>
          ))}
          <button className="btn btn-rose" onClick={save} disabled={saving} style={{width:"100%",padding:"14px 0",fontSize:14,opacity:saving?.75:1}}>{saving?"Saving…":"Save Changes"}</button>
        </div>
      </div>
    </div>
  );
};

/* ── LOGIN ───────────────────────────────────────────────────────────────────── */

export default ProfilePage;