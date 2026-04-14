/**
 * BV_Plaza/frontend/BVPlazaApp.jsx
 * Main BV Plaza application shell — internal router
 * Manages which Plaza page is currently shown
 */
import React, { useState, useEffect, useRef } from "react";
import { apiPlazaGetMyStall, apiPlazaPublicSetting } from "./plazaApi";
import PlazaLanding        from "./pages/PlazaLanding";
import BuyerMarket         from "./pages/BuyerMarket";
import StallView           from "./pages/StallView";
import ShopOwnerSignup     from "./pages/ShopOwnerSignup";
import ShopOwnerDashboard  from "./pages/ShopOwnerDashboard";

const BVPlazaApp = ({ user, onBack, toast }) => {
  const [view,    setView]    = useState("landing"); // landing | buyer | stall | signup | dashboard
  const [stallId, setStallId] = useState(null);
  const [setting, setSetting] = useState(null);
  const [socket,  setSocket]  = useState(null);
  const socketRef = useRef(null);

  // Load plaza setting
  useEffect(() => {
    apiPlazaPublicSetting().then(r => setSetting(r.data.setting)).catch(() => {});
  }, []);

  // Initialize socket.io for real-time features
  useEffect(() => {
    // Try to connect to socket.io — requires: npm install socket.io-client
    let io;
    try {
      io = require("socket.io-client");
    } catch {
      console.warn("[BV Plaza] socket.io-client not installed. Real-time features limited. Run: npm install socket.io-client");
      return;
    }

    const apiUrl = process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000";
    const sock = io(`${apiUrl}/plaza`, {
      auth: { token: localStorage.getItem("bv_token") },
      reconnectionAttempts: 5,
    });
    sock.on("connect",    () => console.log("[BV Plaza] Socket connected"));
    sock.on("disconnect", () => console.log("[BV Plaza] Socket disconnected"));
    socketRef.current = sock;
    setSocket(sock);
    return () => { sock.disconnect(); };
  }, []);

  const handleChoose = async (role) => {
    if (role === "shopowner") {
      if (!user) { toast?.("Please login first","error"); return; }
      try {
        await apiPlazaGetMyStall();
        setView("dashboard"); // already registered
      } catch {
        setView("signup"); // not registered yet
      }
    } else {
      setView("buyer");
    }
  };

  const handleVisitStall = (id) => {
    setStallId(id);
    setView("stall");
  };

  const handleSignupSuccess = () => setView("dashboard");

  return (
    <div style={{ minHeight: "80vh", background: "#f8fafc" }}>
      {view === "landing" && (
        <PlazaLanding setting={setting} onChoose={handleChoose}/>
      )}
      {view === "buyer" && (
        <BuyerMarket onVisitStall={handleVisitStall} onBack={() => setView("landing")}/>
      )}
      {view === "stall" && stallId && (
        <StallView
          stallId={stallId}
          user={user}
          socket={socket}
          onBack={() => setView("buyer")}
          toast={toast}
        />
      )}
      {view === "signup" && (
        <ShopOwnerSignup
          user={user}
          onSuccess={handleSignupSuccess}
          onBack={() => setView("landing")}
          toast={toast}
        />
      )}
      {view === "dashboard" && (
        <ShopOwnerDashboard
          user={user}
          socket={socket}
          onBack={() => setView("landing")}
          toast={toast}
        />
      )}
    </div>
  );
};

export default BVPlazaApp;
