import React, { useState } from "react";
import { useBreakpoint } from "../hooks";
import { useAuth } from "../context/AuthContext";
import { Ic } from "../utils/helpers";
import { apiLogin, apiRegister } from "../api";
import { Lock, Mail, User, Eye, EyeOff } from "lucide-react";

const LoginPage = ({ setPage, toast }) => {
  const {isMobile}=useBreakpoint();
  const {login,register}=useAuth();
  const [tab,setTab]=useState("login");
  const [form,setForm]=useState({name:"",email:"",password:""});
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  const handle=async()=>{
    setLoading(true);setErr("");
    try{
      if(tab==="login"){const u=await login(form.email,form.password);toast(`Welcome back, ${u.name}!`);setPage("home");}
      else{const u=await register(form.name,form.email,form.password);toast(`Welcome, ${u.name}!`);setPage("home");}
    }catch(e){setErr(e.response?.data?.message||"Something went wrong");}
    setLoading(false);
  };

  const iStyle={background:"var(--ivory2)",border:"1.5px solid var(--border2)",color:"var(--text)",padding:"14px 16px",fontSize:14,borderRadius:12,outline:"none",width:"100%",boxSizing:"border-box",fontWeight:500,transition:"border-color .2s"};

  return(
    <div style={{minHeight:"100vh",display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr"}}>
      {/* Left */}
      {!isMobile&&(
        <div style={{background:"linear-gradient(160deg,var(--rose) 0%,var(--saffron) 50%,var(--purple) 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:60,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-80,right:-80,width:300,height:300,borderRadius:"50%",background:"rgba(255,255,255,.07)"}}/>
          <div style={{position:"absolute",bottom:-60,left:-60,width:250,height:250,borderRadius:"50%",background:"rgba(255,255,255,.05)"}}/>
          <div style={{position:"relative",textAlign:"center",maxWidth:380}}>
            <img src="/bv.jpg" alt="BanyanVision" style={{width:120,height:120,objectFit:"contain",borderRadius:0,margin:"0 auto 16px",background:"transparent"}}/>
            <div style={{fontFamily:"var(--font-d)",fontSize:40,fontWeight:700,color:"#fff",marginBottom:6,letterSpacing:.5}}>BanyanVision</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.75)",letterSpacing:3,fontWeight:700,textTransform:"uppercase",marginBottom:32}}>Empowering Dreams, Inspiring Innovations</div>
            <p style={{color:"rgba(255,255,255,.8)",fontSize:15,lineHeight:1.85,marginBottom:32}}>India's finest handcrafted fashion destination. Real Razorpay payments, real artisans, real heritage.</p>
            <div style={{background:"rgba(255,255,255,.12)",borderRadius:"20px",padding:"20px 24px",textAlign:"left",backdropFilter:"blur(10px)",border:"1px solid rgba(255,255,255,.15)"}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,.75)",fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>Demo Credentials</div>
              {[[" Admin","admin@banyanvision.com","admin123"],["User","user@test.com","user123"]].map(([role,email,pass])=>(
                <div key={role} style={{marginBottom:12,paddingBottom:12,borderBottom:"1px solid rgba(255,255,255,.15)"}}>
                  <div style={{fontSize:13,color:"#fff",fontWeight:700,marginBottom:3}}>{role}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,.75)",fontFamily:"monospace"}}>{email}<br/>{pass}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Right */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:isMobile?"48px 24px":60,background:"var(--ivory)"}}>
        <div style={{width:"100%",maxWidth:400}}>
          {isMobile&&(
            <div style={{textAlign:"center",marginBottom:28}}>
              <img src="/bv.jpg" alt="BanyanVision" style={{width:100,height:100,objectFit:"contain",borderRadius:0,margin:"0 auto 10px",background:"transparent"}}/>
              <div style={{fontFamily:"var(--font-d)",fontSize:26,fontWeight:700,color:"var(--dark)"}}>BanyanVision</div>
            </div>
          )}
          <h2 style={{fontFamily:"var(--font-d)",fontSize:28,fontWeight:700,color:"var(--dark)",marginBottom:6}}>{tab==="login"?"Welcome Back!":"Create Account"}</h2>
          <p style={{color:"var(--muted)",fontSize:13,marginBottom:24,fontWeight:500}}>{tab==="login"?"Sign in to your account":"Join thousands of happy shoppers"}</p>

          <div style={{display:"flex",gap:0,marginBottom:24,background:"var(--ivory3)",borderRadius:12,padding:4}}>
            {["login","register"].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"10px 0",background:tab===t?"#fff":"transparent",border:"none",borderRadius:10,color:tab===t?"var(--rose)":"var(--muted)",fontWeight:700,cursor:"pointer",fontSize:13,transition:"all .2s",boxShadow:tab===t?"0 2px 10px rgba(0,0,0,.08)":"none"}}>
                {t==="login"?"Sign In":"Register"}
              </button>
            ))}
          </div>

          {tab==="register"&&(
            <div style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:11,fontWeight:700,color:"var(--text2)",marginBottom:6}}>Full Name</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={iStyle} placeholder="Your name"/>
            </div>
          )}
          {[["Email","email","email"],["Password","password","password"]].map(([label,key,type])=>(
            <div key={key} style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:11,fontWeight:700,color:"var(--text2)",marginBottom:6}}>{label}</label>
              <input type={type} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&handle()} style={iStyle} placeholder={label}/>
            </div>
          ))}
          {err&&<div style={{color:"#DC2626",fontSize:13,marginBottom:14,fontWeight:600,padding:"10px 14px",background:"#FEF2F2",borderRadius:10,border:"1px solid #FECACA"}}>⚠ {err}</div>}
          <button className="btn btn-rose" onClick={handle} disabled={loading} style={{width:"100%",padding:"15px 0",fontSize:15,marginBottom:12,opacity:loading?.75:1}}>
            {loading?"Please wait…":tab==="login"?"Sign In →":"Create Account →"}
          </button>
          <button className="btn btn-ghost" onClick={()=>setPage("home")} style={{width:"100%",padding:"13px 0",fontSize:14}}>Continue as Guest</button>
        </div>
      </div>
    </div>
  );
};

/* ── ABOUT ───────────────────────────────────────────────────────────────────── */

export default LoginPage;