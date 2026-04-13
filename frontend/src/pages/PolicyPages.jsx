import React from "react";
import { useBreakpoint } from "../hooks";
import { _settings } from "../store/contentStore";
import { Ic } from "../utils/helpers";
import { ArrowLeft, FileText, Home, Lock, Phone, RefreshCw, Truck, User } from "lucide-react";

/* ── POLICY PAGE TEMPLATE ────────────────────────────────────────────────────── */
const PolicyPage = ({ title, icon, children, setPage }) => {
  const {isMobile}=useBreakpoint();
  return (
    <div style={{maxWidth:860,margin:"0 auto",padding:isMobile?"28px 18px":"48px 40px"}}>
      <button onClick={()=>setPage("home")} style={{background:"none",border:"none",color:"var(--rose)",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:20,display:"flex",alignItems:"center",gap:6}}>
        <Ic icon={ArrowLeft} size={14}/> Back to Home
      </button>
      <div style={{background:"#fff",borderRadius:20,padding:isMobile?24:40,border:"1.5px solid var(--border)",boxShadow:"0 4px 32px rgba(194,24,91,.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:28,paddingBottom:20,borderBottom:"1.5px solid var(--border)"}}>
          <div style={{width:54,height:54,borderRadius:14,background:"linear-gradient(135deg,var(--rose),var(--saffron))",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{icon}</div>
          <div>
            <h1 style={{fontFamily:"var(--font-d)",fontSize:isMobile?24:32,fontWeight:700,color:"var(--dark)",margin:0}}>{title}</h1>
            <div style={{fontSize:12,color:"var(--muted)",marginTop:4}}>Last updated: January 2026 &nbsp;|&nbsp; BanyanVision</div>
          </div>
        </div>
        <div style={{fontSize:14,color:"var(--text2)",lineHeight:1.9}}>{children}</div>
      </div>
    </div>
  );
};
const Sec = ({title,children}) => (
  <div style={{marginBottom:28}}>
    <h2 style={{fontFamily:"var(--font-d)",fontSize:18,fontWeight:700,color:"var(--dark)",marginBottom:10,paddingBottom:6,borderBottom:"2px solid var(--roseL)"}}>{title}</h2>
    {children}
  </div>
);
const P = ({children}) => <p style={{marginBottom:12}}>{children}</p>;
const Li = ({items}) => <ul style={{paddingLeft:20,marginBottom:12}}>{items.map((it,i)=><li key={i} style={{marginBottom:6}}>{it}</li>)}</ul>;

const PrivacyPage = ({ setPage }) => (
  <PolicyPage title="Privacy Policy" icon={<Ic icon={Lock} size={24} color="#fff"/>} setPage={setPage}>
    <Sec title="1. Information We Collect"><P>When you shop on BanyanVision, we collect:</P><Li items={["Name, email address and phone number when you register or checkout","Shipping address for order delivery","Payment information processed securely through Razorpay (we never store card details)","Order history and browsing preferences to improve your experience"]}/></Sec>
    <Sec title="2. How We Use Your Information"><Li items={["To process and deliver your orders","To send order confirmation and shipping update emails","To provide customer support","To send promotional offers (you can unsubscribe anytime)","To improve our website and services"]}/></Sec>
    <Sec title="3. Data Security"><P>All data is encrypted in transit (HTTPS/SSL). Passwords are hashed using bcrypt. Payment data is handled entirely by Razorpay — PCI DSS compliant. We never sell your personal data to third parties.</P></Sec>
    <Sec title="4. Cookies"><P>We use cookies to keep you logged in and remember your cart. No third-party advertising cookies are used. You can clear cookies via your browser settings at any time.</P></Sec>
    <Sec title="5. Your Rights (India DPDP Act 2023)"><Li items={["Right to access your personal data","Right to correction of inaccurate data","Right to erasure of your account and data","Right to grievance redressal"]}/><P>To exercise any right, email us at: <strong>admin@banyanvision.com</strong></P></Sec>
    <Sec title="6. Contact"><P>BanyanVision &nbsp;|&nbsp; Email: {_settings.email} &nbsp;|&nbsp; Phone: {_settings.phone}</P></Sec>
  </PolicyPage>
);
const TermsPage = ({ setPage }) => (
  <PolicyPage title="Terms of Service" icon={<Ic icon={FileText} size={24} color="#fff"/>} setPage={setPage}>
    <Sec title="1. Acceptance of Terms"><P>By accessing or using BanyanVision, you agree to be bound by these Terms. If you do not agree, please do not use our services.</P></Sec>
    <Sec title="2. Products & Pricing"><Li items={["All prices are in Indian Rupees (₹) and inclusive of applicable taxes","We reserve the right to change prices without prior notice","Product images are for representation — actual color may slightly vary due to screen settings","Stock availability is updated in real-time but subject to change"]}/></Sec>
    <Sec title="3. Orders & Payments"><Li items={["Orders are confirmed only after successful payment","We accept UPI, Credit/Debit Cards, Net Banking via Razorpay, and Cash on Delivery","BanyanVision reserves the right to cancel orders in case of pricing errors or stock issues","In case of cancellation, full refund is processed within 5–7 business days"]}/></Sec>
    <Sec title="4. User Account"><P>You are responsible for maintaining the confidentiality of your account credentials. Do not share your password. BanyanVision is not liable for unauthorized access to your account.</P></Sec>
    <Sec title="5. Prohibited Activities"><Li items={["Placing fraudulent orders","Attempting to hack or disrupt our services","Copying or reproducing our content without permission","Posting fake or malicious reviews"]}/></Sec>
    <Sec title="6. Governing Law"><P>These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Tamil Nadu, India.</P></Sec>
  </PolicyPage>
);
const RefundPage = ({ setPage }) => (
  <PolicyPage title="Refund & Returns Policy" icon={<Ic icon={RefreshCw} size={24} color="#fff"/>} setPage={setPage}>
    <Sec title="Return Window"><P>We offer a <strong>7-day return policy</strong> from the date of delivery. Items must be unused, unwashed, and in original packaging with tags intact.</P></Sec>
    <Sec title="Items Eligible for Return"><Li items={["Wrong item delivered","Damaged or defective product","Size/color significantly different from the product page","Missing items from the order"]}/></Sec>
    <Sec title="Items NOT Eligible for Return"><Li items={["Items that have been worn, washed, or altered","Items without original tags or packaging","Customised or made-to-order items","Sale items marked as Final Sale"]}/></Sec>
    <Sec title="How to Initiate a Return"><Li items={["Email admin@banyanvision.com with your Order ID and reason for return","Attach photos of the item showing the issue","Our team will respond within 2 business days","We arrange free pickup from your doorstep"]}/></Sec>
    <Sec title="Refund Timeline"><Li items={["Original payment method: 5–7 business days after item received at our warehouse","UPI / Bank Transfer: 3–5 business days","Cash on Delivery orders: Refund via bank transfer — share account details with us"]}/></Sec>
    <Sec title="Exchange Policy"><P>We offer free size exchanges within 7 days. Email us at admin@banyanvision.com with your Order ID and preferred size. Subject to stock availability.</P></Sec>
  </PolicyPage>
);
const ShippingPolicyPage = ({ setPage }) => (
  <PolicyPage title="Shipping Policy" icon={<Ic icon={Truck} size={24} color="#fff"/>} setPage={setPage}>
    <Sec title="Delivery Timeframes"><Li items={["Standard Delivery: 3–5 business days — FREE on orders above ₹2,000","Express Delivery: 1–2 business days — ₹199","Remote areas: 5–8 business days"]}/></Sec>
    <Sec title="Shipping Partners"><P>We ship via trusted partners including Delhivery, BlueDart, and India Post. You'll receive a tracking link via email once your order is dispatched.</P></Sec>
    <Sec title="Order Processing"><P>Orders are processed within 1–2 business days. Orders placed after 5 PM IST will be processed the next business day. No processing on Sundays and public holidays.</P></Sec>
    <Sec title="Delivery Charges"><Li items={["Orders above ₹2,000 — FREE Standard Delivery","Orders below ₹2,000 — ₹99 Standard Delivery","Express Delivery — ₹199 (available for most pin codes)","No delivery charges for exchanges"]}/></Sec>
    <Sec title="Tracking Your Order"><P>Track your order anytime by logging in to your BanyanVision account and going to My Orders. You'll also receive email updates at every stage.</P></Sec>
    <Sec title="Undelivered Orders"><P>If a delivery attempt fails, our courier will try 2 more times. After 3 failed attempts, the package is returned to us and a full refund is initiated within 5–7 business days.</P></Sec>
  </PolicyPage>
);

export { PrivacyPage, TermsPage, RefundPage, ShippingPolicyPage };