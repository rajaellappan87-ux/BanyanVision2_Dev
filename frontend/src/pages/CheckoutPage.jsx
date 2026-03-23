import React, { useState } from "react";
import { useBreakpoint } from "../hooks";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { Ic, fmt, thumb } from "../utils/helpers";
import log from "../utils/logger";
import { apiCreatePayment, apiCreateOrder, apiValidateCoupon } from "../api";
import { AlertTriangle, MapPin, Phone } from "lucide-react";

/* ── CHECKOUT ────────────────────────────────────────────────────────────────── */
const CheckoutPage = ({ setPage, toast }) => {
  const {isMobile}=useBreakpoint();
  const {user}=useAuth();
  const {cart,subtotal,discountAmt,shipping,total,couponCode,clearCart,freeShippingAbove:shippingFreeAbove}=useCart();
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({name:user?.name||"",email:user?.email||"",phone:user?.phone||"",address:user?.address||"",city:"",state:"",pin:""});
  const [errors,setErrors]=useState({});
  const [touched,setTouched]=useState({});
  const [processing,setProcessing]=useState(false);

  const REQUIRED={name:"Full Name",email:"Email",phone:"Phone",address:"Full Address",city:"City",state:"State",pin:"PIN Code"};

  const validate=()=>{
    const errs={};
    if(!form.name.trim())errs.name="Full Name is required";
    if(!form.email.trim())errs.email="Email is required";
    else if(!/^[^@]+@[^@]+\.[^@]+$/.test(form.email))errs.email="Enter a valid email";
    if(!form.phone.trim())errs.phone="Phone is required";
    else if(!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g,"")))errs.phone="Enter a valid 10-digit mobile number";
    if(!form.address.trim())errs.address="Address is required";
    if(!form.city.trim())errs.city="City is required";
    if(!form.state.trim())errs.state="State is required";
    if(!form.pin.trim())errs.pin="PIN Code is required";
    else if(!/^\d{6}$/.test(form.pin.trim()))errs.pin="Enter a valid 6-digit PIN";
    return errs;
  };

  const handleContinue=()=>{
    const errs=validate();
    setTouched(Object.keys(REQUIRED).reduce((a,k)=>({...a,[k]:true}),{}));
    if(Object.keys(errs).length>0){setErrors(errs);return;}
    setErrors({});
    setStep(2);
  };

  const loadRz=()=>new Promise(res=>{
    if(window.Razorpay){res(true);return;}
    const s=document.createElement("script");s.src="https://checkout.razorpay.com/v1/checkout.js";
    s.onload=()=>res(true);s.onerror=()=>res(false);document.body.appendChild(s);
  });

  const pay=async()=>{
    setProcessing(true);
    try{
      // Step 1: Load Razorpay checkout script
      log.payment("Checkout initiated", { total, itemCount: cart.length });
      const ok=await loadRz();
      if(!ok){ toast("Could not load payment gateway. Check your internet connection.","error"); setProcessing(false); return; }

      // Step 2: Create Razorpay order on backend
      let pr;
      try{
        pr=await apiCreatePayment({total});
      }catch(apiErr){
        const msg=apiErr.response?.data?.message||"Payment gateway error";
        console.error("create-payment failed:",apiErr.response?.data||apiErr.message);
        log.payment("Payment API error", { msg }, null);
      toast(msg,"error");
        setProcessing(false);
        return;
      }

      const {orderId,amount,currency,keyId}=pr.data;

      // Step 3: Validate key before opening modal
      if(!keyId||!keyId.startsWith("rzp_")){
        toast("Payment gateway misconfigured — contact support","error");
        setProcessing(false);
        return;
      }

      // Step 4: Open Razorpay modal
      const opts={
        key:keyId,
        amount,
        currency,
        name:"BanyanVision",
        description:"Handcrafted Indian Fashion",
        order_id:orderId,
        handler:async res=>{
          try{
            const or=await apiCreateOrder({
              items:cart.map(i=>({product:i._id,name:i.name,image:thumb(i.images?.[0]?.url||i.image||""),price:i.price,qty:i.qty,size:i.size,color:i.color,category:i.category})),
              shippingAddress:{fullName:form.name,phone:form.phone,address:form.address,city:form.city,state:form.state,pin:form.pin},
              subtotal,discount:discountAmt,shipping,total,coupon:couponCode||null,
              paymentId:res.razorpay_payment_id,
              paymentOrderId:res.razorpay_order_id,
              paymentSignature:res.razorpay_signature,
            });
            log.payment("Payment successful", { orderId: or.data.order._id, total });
            clearCart();
            setPage(`order-success-${or.data.order._id}`);
          }catch(err){
            console.error("Order creation failed:",err.response?.data||err.message);
            toast(err.response?.data?.message||"Order creation failed — contact support","error");
          }
        },
        prefill:{name:form.name,email:form.email,contact:form.phone},
        theme:{color:"#C2185B"},
        modal:{
          ondismiss:()=>{ setProcessing(false); },
          confirm_close:true,
        },
      };

      const rzp=new window.Razorpay(opts);
      rzp.on("payment.failed",(response)=>{
        console.error("Razorpay payment.failed:",response.error);
        toast(response.error?.description||"Payment failed — please try again","error");
        setProcessing(false);
      });
      rzp.open();

    }catch(err){
      console.error("pay() unhandled error:",err);
      toast(err.response?.data?.message||"Something went wrong — please try again","error");
      setProcessing(false);
    }
  };

  const iStyle={background:"#fff",border:"1.5px solid var(--border2)",color:"var(--text)",padding:"12px 14px",fontSize:13,borderRadius:12,outline:"none",width:"100%",boxSizing:"border-box",fontWeight:500};

  return(
    <div style={{background:"var(--ivory)",minHeight:"100vh",padding:isMobile?"20px 16px":"44px 80px"}}>
      <div style={{maxWidth:900,margin:"0 auto"}}>
        <h1 style={{fontFamily:"var(--font-d)",color:"var(--dark)",fontSize:isMobile?28:44,fontWeight:700,marginBottom:24}}>Checkout</h1>
        {/* Steps */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
          {["Delivery Details","Review & Pay"].map((label,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,flex:i<1?1:"none"}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:i+1<=step?"linear-gradient(135deg,var(--rose),var(--saffron))":"#fff",border:`2px solid ${i+1<=step?"transparent":"var(--border2)"}`,color:i+1<=step?"#fff":"var(--muted)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,transition:"all .3s",boxShadow:i+1<=step?"0 4px 16px rgba(194,24,91,.3)":"none"}}>{i+1<step?"✓":i+1}</div>
              <span style={{fontSize:13,fontWeight:700,color:i+1===step?"var(--rose)":"var(--muted)",whiteSpace:"nowrap"}}>{label}</span>
              {i<1&&<div style={{flex:1,height:2,background:i+1<step?"linear-gradient(90deg,var(--rose),var(--saffron))":"var(--border)",borderRadius:2,marginLeft:8}}/>}
            </div>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 300px",gap:18,alignItems:"start"}}>
          <div style={{background:"#fff",borderRadius:"20px",border:"1.5px solid var(--border)",padding:isMobile?18:28,boxShadow:"0 4px 24px rgba(194,24,91,0.08)"}}>
            {step===1&&(
              <div>
                <h3 style={{fontFamily:"var(--font-d)",color:"var(--dark)",margin:"0 0 20px",fontSize:20,fontWeight:700}}>Delivery Address</h3>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
                  {[["Full Name","name"],["Email","email"],["Phone","phone"],["Full Address","address"],["City","city"],["State","state"],["PIN Code","pin"]].map(([label,key])=>(
                    <div key={key} style={{gridColumn:["name","address"].includes(key)&&!isMobile?"1/-1":"auto"}}>
                      <label style={{display:"block",fontSize:11,fontWeight:700,color:touched[key]&&errors[key]?"#DC2626":"var(--text2)",marginBottom:6,letterSpacing:.3}}>
                        {label} <span style={{color:"#DC2626"}}>*</span>
                      </label>
                      <input
                        value={form[key]}
                        onChange={e=>{setForm(f=>({...f,[key]:e.target.value}));if(touched[key])setErrors(er=>({...er,[key]:""}));}}
                        onBlur={()=>{setTouched(t=>({...t,[key]:true}));const errs=validate();setErrors(errs);}}
                        placeholder={label}
                        style={{...iStyle,borderColor:touched[key]&&errors[key]?"#DC2626":"var(--border2)",background:touched[key]&&errors[key]?"#FEF2F2":"#fff",boxShadow:touched[key]&&errors[key]?"0 0 0 3px rgba(220,38,38,0.1)":"none"}}
                      />
                      {touched[key]&&errors[key]&&(
                        <div style={{display:"flex",alignItems:"center",gap:4,marginTop:5,fontSize:11,color:"#DC2626",fontWeight:600}}>
                          <Ic icon={AlertTriangle} size={13} color="#DC2626"/><span>{errors[key]}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {step===2&&(
              <div>
                <h3 style={{fontFamily:"var(--font-d)",color:"var(--dark)",margin:"0 0 20px",fontSize:20,fontWeight:700}}>Review Order</h3>
                {cart.map((item,i)=>(
                  <div key={i} style={{display:"flex",gap:14,alignItems:"center",padding:"12px 0",borderBottom:"1px solid var(--border)"}}>
                    <img src={thumb(item.images?.[0]?.url||item.image||"")} alt={item.name} style={{width:52,height:64,objectFit:"contain",background:"var(--ivory2)",borderRadius:10}}/>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"var(--font-d)",fontWeight:700,color:"var(--text)",fontSize:14}}>{item.name}</div>
                      <div style={{fontSize:11,color:"var(--muted)",marginTop:2,fontWeight:500}}>{item.color} · {item.size} · Qty {item.qty}</div>
                    </div>
                    <div style={{fontFamily:"var(--font-d)",fontWeight:700,fontSize:15,background:"linear-gradient(135deg,var(--rose),var(--saffron))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{fmt(item.price*item.qty)}</div>
                  </div>
                ))}
                <div style={{marginTop:12,padding:"12px 14px",background:"var(--ivory2)",borderRadius:12,fontSize:12,color:"var(--text2)",lineHeight:1.7,fontWeight:500}}>
                  <Ic icon={MapPin} size={12}/> {form.name} · {form.phone}<br/>{form.address}, {form.city}, {form.state} - {form.pin}
                </div>
                <div style={{marginTop:10,padding:"10px 14px",background:"var(--roseL)",borderRadius:12,fontSize:12,color:"var(--rose)",fontWeight:700}}>
                  Razorpay handles payment securely — your details are never stored.
                </div>
              </div>
            )}
            <div style={{display:"flex",gap:10,marginTop:22}}>
              {step>1&&<button className="btn btn-ghost" onClick={()=>setStep(1)} style={{flex:1,padding:"14px 0",fontSize:14}}>← Back</button>}
              <button onClick={step===2?pay:handleContinue} disabled={processing}
                style={{flex:2,padding:"15px 0",borderRadius:12,fontSize:14,fontWeight:700,border:"none",color:"#fff",background:step===2?"linear-gradient(135deg,#1565C0,#1976D2)":"linear-gradient(135deg,var(--rose),var(--saffron))",cursor:processing?"not-allowed":"pointer",opacity:processing?.75:1,boxShadow:step===2?"0 8px 24px rgba(21,101,192,.3)":"0 8px 24px rgba(194,24,91,.3)"}}>
                {processing?"Processing…":step===2?`Pay ${fmt(total)} via Razorpay`:"Continue →"}
              </button>
            </div>
          </div>
          {/* Price Details — shown on ALL screens */}
          <div style={{background:"linear-gradient(160deg,var(--roseL),var(--saffronL))",borderRadius:"20px",border:"1.5px solid var(--border)",padding:22}}>
            <h4 style={{fontFamily:"var(--font-d)",color:"var(--dark)",margin:"0 0 16px",fontSize:18,fontWeight:700}}>Price Details</h4>
            {[
              ["Subtotal",fmt(subtotal)],
              discountAmt>0?["Saving",`−${fmt(discountAmt)}`]:null,
              ["Delivery", shipping===0 ? "FREE ✓" : fmt(shipping)],
            ].filter(Boolean).map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:10,fontSize:13,
                color:k==="Saving"?"#16A34A":k==="Delivery"&&shipping===0?"#16A34A":"var(--text2)",
                fontWeight:k==="Saving"||k==="Delivery"?600:400}}>
                <span>{k}</span>
                <span>{v}</span>
              </div>
            ))}
            <div style={{borderTop:"1.5px solid var(--border2)",paddingTop:14,display:"flex",justifyContent:"space-between",fontFamily:"var(--font-d)",fontSize:22,fontWeight:700}}>
              <span>Total</span>
              <span style={{background:"linear-gradient(135deg,var(--rose),var(--saffron))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{fmt(total)}</span>
            </div>
            {shipping > 0 && (
              <div style={{marginTop:10,fontSize:11,color:"var(--muted)",textAlign:"center"}}>
                Add {fmt(shippingFreeAbove - (subtotal - discountAmt))} more for FREE delivery
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── ORDER SUCCESS ───────────────────────────────────────────────────────────── */

export default CheckoutPage;