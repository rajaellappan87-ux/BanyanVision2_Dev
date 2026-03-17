import React from "react";

// ─── Category Config & Presets ───────────────────────────────────────────────
export const DEFAULT_CAT_CONFIG = {
  "Kurtas & Sets":  {icon:"👘", grad:"linear-gradient(135deg,#C2185B,#E91E8C)", light:"#FCE4EC", subs:["Anarkali","Straight Cut","Palazzo Set","Co-ord Set"]},
  "Sarees":         {icon:"🥻", grad:"linear-gradient(135deg,#6A1B9A,#AB47BC)", light:"#F3E5F5", subs:["Banarasi","Silk","Cotton","Chiffon","Designer"]},
  "Lehengas":       {icon:"💃", grad:"linear-gradient(135deg,#E65100,#F9A825)", light:"#FFF3E0", subs:["Bridal","Party Wear","Kids","Festive"]},
  "Western Wear":   {icon:"👗", grad:"linear-gradient(135deg,#00695C,#26A69A)", light:"#E0F2F1", subs:["Tops","Dresses","Jeans","Co-ords"]},
  "Accessories":    {icon:"📿", grad:"linear-gradient(135deg,#1565C0,#42A5F5)", light:"#E3F2FD", subs:["Dupattas","Stoles","Belts","Hair Accessories"]},
  "Men's Wear":    {icon:"🤵", grad:"linear-gradient(135deg,#2E7D32,#66BB6A)", light:"#E8F5E9", subs:["Kurtas","Sherwanis","Nehru Jackets","Casual"]},
  "Bags":           {icon:"👜", grad:"linear-gradient(135deg,#BF360C,#FF7043)", light:"#FBE9E7", subs:["Clutches","Tote Bags","Potli Bags","Sling Bags","Backpacks"]},
  "Fancy Jewelry":  {icon:"💎", grad:"linear-gradient(135deg,#880E4F,#F06292)", light:"#FCE4EC", subs:["Necklaces","Earrings","Bangles","Rings","Maang Tikka","Anklets"]},
};;

export const GRAD_PRESETS = [
  "linear-gradient(135deg,#C2185B,#E91E8C)","linear-gradient(135deg,#6A1B9A,#AB47BC)",
  "linear-gradient(135deg,#E65100,#F9A825)","linear-gradient(135deg,#00695C,#26A69A)",
  "linear-gradient(135deg,#1565C0,#42A5F5)","linear-gradient(135deg,#2E7D32,#66BB6A)",
  "linear-gradient(135deg,#BF360C,#FF7043)","linear-gradient(135deg,#880E4F,#F06292)",
  "linear-gradient(135deg,#4527A0,#7C4DFF)","linear-gradient(135deg,#00838F,#4DD0E1)",
];;

export const FASHION_EMOJIS = [
  "👘","🥻","👗","💃","🤵","👜","💎","📿","🧣","🧤","🧥","👒","👑","💍","👠","👡",
  "👚","👕","🩱","🩲","👙","🩳","👖","🧦","🥿","👟","🥾","🧢","🎀","🌸","💐","🌺",
  "🛍","🎁","✨","💫","🌟","⭐","💠","🔮","🪬","🌙","🌿","🍃","🦋","🪷","🌹",
];

// renderCatIcon: renders either an emoji string or a data URL image;

export const renderCatIcon = (icon, size=24) => {
  if (!icon) return <span style={{fontSize:size}}>🛒</span>;
  if (icon.startsWith("data:") || icon.startsWith("http")) {
    return <img src={icon} alt="icon" style={{width:size,height:size,objectFit:"cover",borderRadius:"50%"}}/>;
  }
  return <span style={{fontSize:size,lineHeight:1}}>{icon}</span>;
};
