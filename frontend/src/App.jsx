import log from "./utils/logger";
import React, { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { useToast } from "./hooks";
import { GLOBAL_CSS } from "./constants/theme";

// UI
import Header               from "./components/ui/Header";
import Footer, { WhatsAppButton, CookieBanner } from "./components/ui/Footer";
import { ToastBox, Spinner } from "./components/ui/Common";

// Pages
import HomePage             from "./pages/HomePage";
import ShopPage             from "./pages/ShopPage";
import AboutPage            from "./pages/AboutPage";
import CartPage             from "./pages/CartPage";
import CheckoutPage         from "./pages/CheckoutPage";
import OrderSuccessPage     from "./pages/OrderSuccessPage";
import OrdersPage           from "./pages/OrdersPage";
import WishlistPage         from "./pages/WishlistPage";
import ProfilePage          from "./pages/ProfilePage";
import LoginPage            from "./pages/LoginPage";
import ProductDetailPage    from "./pages/ProductDetailPage";
import { PrivacyPage, TermsPage, RefundPage, ShippingPolicyPage } from "./pages/PolicyPages";
import NotFoundPage         from "./pages/NotFoundPage";

// Admin
import AdminDashboard from "./admin/AdminDashboard";

// BV Plaza
import BVPlazaApp from "./BV_Plaza/BVPlazaApp";

// ─── App Shell ────────────────────────────────────────────────────────────────
function AppShell() {
  const [page, setPage] = useState("home");
  const [shopCat, setShopCat] = useState("");
  const { toasts, toast } = useToast();
  const { user, loading } = useAuth();
  React.useEffect(() => {
    if (user) {
      log.setUser(user);
      log.auth("User session active", { role: user.role });
    }
  }, [user?._id]);
  const navigate = useCallback(p => {
    // "shop:CategoryName" → go to shop pre-filtered to that category
    if (p.startsWith("shop:")) {
      setShopCat(p.slice(5));
      setPage("shop");
    } else {
      if (p === "shop") setShopCat(""); // plain shop link clears category filter
      setPage(p);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Keep URL in sync for shareable product links
    if (p.startsWith("product-")) {
      const id = p.replace("product-", "");
      window.history.replaceState({}, "", `?product=${id}`);
    } else {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Read ?product=<id> from URL on first load for shareable links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("product");
    if (pid) {
      setPage(`product-${pid}`);
      window.history.replaceState({}, "", `?product=${pid}`);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (["orders","profile","checkout"].includes(page) && !user) navigate("login");
    if (page === "admin" && user?.role !== "admin") navigate("home");
  }, [page, user, loading, navigate]);

  const isProduct = page.startsWith("product-");
  const isSuccess = page.startsWith("order-success-");
  const productId = isProduct ? page.replace("product-", "") : null;
  const successId = isSuccess ? page.replace("order-success-", "") : null;
  const knownPages = ["home","shop","about","cart","checkout","orders","wishlist",
                      "profile","login","admin","privacy","terms","refund","shipping","plaza"];
  const is404 = !knownPages.includes(page) && !isProduct && !isSuccess;

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center",
                  justifyContent:"center", background:"var(--ivory)",
                  flexDirection:"column", gap:20 }}>
      <img src="/bv.jpg" alt="BanyanVision"
           style={{ width:100, height:100, objectFit:"contain",
                    animation:"float 2s ease-in-out infinite" }}/>
      <div style={{ width:40, height:40, border:"3px solid var(--border2)",
                    borderTop:"3px solid var(--rose)", borderRight:"3px solid var(--saffron)",
                    borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}"}</style>
    </div>
  );

  return (
    <div style={{ fontFamily:"var(--font-b)", background:"var(--ivory)", minHeight:"100vh" }}>
      <style>{GLOBAL_CSS}</style>
      <Header page={page} setPage={navigate}/>
      <main>
        {page==="home"    && <HomePage      setPage={navigate} toast={toast}/>}
        {page==="shop"    && <ShopPage      setPage={navigate} toast={toast} initialCat={shopCat}/>}
        {page==="about"   && <AboutPage     setPage={navigate}/>}
        {page==="cart"    && <CartPage      setPage={navigate} toast={toast}/>}
        {page==="checkout"&& user && <CheckoutPage  setPage={navigate} toast={toast}/>}
        {page==="orders"  && user && <OrdersPage    setPage={navigate}/>}
        {page==="wishlist"&& <WishlistPage  setPage={navigate} toast={toast}/>}
        {page==="profile" && user && <ProfilePage   toast={toast}/>}
        {page==="login"   && <LoginPage     setPage={navigate} toast={toast}/>}
        {page==="admin"   && user?.role==="admin" && <AdminDashboard setPage={navigate} toast={toast}/>}
        {page==="plaza"   && <BVPlazaApp user={user} onBack={()=>navigate("home")} toast={toast}/>}
        {page==="privacy" && <PrivacyPage   setPage={navigate}/>}
        {page==="terms"   && <TermsPage     setPage={navigate}/>}
        {page==="refund"  && <RefundPage    setPage={navigate}/>}
        {page==="shipping"&& <ShippingPolicyPage setPage={navigate}/>}
        {isProduct && <ProductDetailPage productId={productId} setPage={navigate} toast={toast}/>}
        {isSuccess && <OrderSuccessPage  orderId={successId}   setPage={navigate}/>}
        {is404     && <NotFoundPage setPage={navigate}/>}
      </main>
      <Footer setPage={navigate}/>
      <WhatsAppButton/>
      <CookieBanner/>
      <ToastBox toasts={toasts}/>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppShell/>
      </CartProvider>
    </AuthProvider>
  );
}
