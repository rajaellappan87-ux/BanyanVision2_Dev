import React from "react";
import { useBreakpoint } from "../hooks";
import { useAboutData } from "../store/contentStore";
import { getIcon } from "../utils/helpers";
import { SecLabel } from "../components/ui/Common";

const AboutPage = ({ setPage }) => {
  const {isMobile}=useBreakpoint();
  const ab=useAboutData();
  const FEAT_BGS=["var(--roseL)","var(--tealL)","var(--saffronL)","var(--purpleL)"];
  return(
    <div style={{background:"var(--ivory)"}}>
      <div style={{background:"linear-gradient(160deg,var(--roseL) 0%,var(--saffronL) 50%,var(--tealL) 100%)",padding:isMobile?"60px 24px":"100px 80px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-60,right:-60,width:280,height:280,borderRadius:"50%",background:"rgba(194,24,91,.07)"}}/>
        <div style={{maxWidth:800,position:"relative"}}>
          <SecLabel>{ab.heroLabel}</SecLabel>
          <h1 style={{fontFamily:"var(--font-d)",fontSize:isMobile?36:62,fontWeight:700,color:"var(--dark)",marginTop:10,lineHeight:1.1,marginBottom:18,letterSpacing:-.5}}>
            {ab.heroHeading}<br/><span className="rose-text">{ab.heroHeadingAccent}</span>
          </h1>
          <p style={{color:"var(--text2)",fontSize:isMobile?14:17,lineHeight:1.9,maxWidth:520,fontWeight:400}}>{ab.heroBody}</p>
        </div>
      </div>

      <div style={{maxWidth:1200,margin:"0 auto",padding:isMobile?"48px 24px":"80px 80px"}}>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?32:64,alignItems:"center",marginBottom:56}}>
          <div>
            <SecLabel>{ab.missionLabel}</SecLabel>
            <h2 style={{fontFamily:"var(--font-d)",fontSize:isMobile?26:38,fontWeight:700,color:"var(--dark)",marginTop:8,marginBottom:16,letterSpacing:-.3}}>Why We <span className="rose-text">Exist</span></h2>
            <p style={{color:"var(--text2)",lineHeight:1.9,fontSize:14,marginBottom:14}}>{ab.missionP1}</p>
            <p style={{color:"var(--text2)",lineHeight:1.9,fontSize:14}}>{ab.missionP2}</p>
          </div>
          <div style={{borderRadius:"28px",height:isMobile?200:320,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isMobile?80:110,background:"linear-gradient(135deg,var(--roseL),var(--saffronL))",border:"1.5px solid var(--border)"}}>{ab.emoji}</div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:isMobile?12:0,background:isMobile?"transparent":"var(--border)",border:isMobile?"none":`1.5px solid var(--border)`,borderRadius:isMobile?"none":"20px",overflow:"hidden",marginBottom:48}}>
          {(ab.features||[]).map((f,i)=>(
            <div key={i} style={{padding:isMobile?"24px 16px":"36px 28px",textAlign:"center",background:"var(--cream)",transition:"background .2s",cursor:"default"}}
              onMouseEnter={e=>e.currentTarget.style.background=FEAT_BGS[i%4]}
              onMouseLeave={e=>e.currentTarget.style.background="var(--cream)"}>
              <div style={{fontSize:isMobile?30:38,marginBottom:12}}>{getIcon(f.icon,isMobile?28:36)}</div>
              <div style={{fontFamily:"var(--font-d)",fontSize:isMobile?15:19,fontWeight:700,color:"var(--dark)",marginBottom:8}}>{f.title}</div>
              <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.7}}>{f.desc}</div>
            </div>
          ))}
        </div>

        <div style={{textAlign:"center"}}>
          <button className="btn btn-rose" onClick={()=>setPage("shop")} style={{padding:"16px 44px",fontSize:16}}>Explore Collections</button>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;