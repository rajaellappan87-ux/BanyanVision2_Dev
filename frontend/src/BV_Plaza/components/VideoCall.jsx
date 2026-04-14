/**
 * BV_Plaza/frontend/components/VideoCall.jsx
 * WebRTC video call component for BV Plaza live sessions
 * Requires socket.io-client to be installed:
 *   npm install socket.io-client  (in frontend folder)
 */
import React, { useState, useEffect, useRef, useCallback } from "react";

const VideoCall = ({
  socket,         // socket.io socket instance (from parent)
  sessionId,      // unique session/chat ID
  stallId,
  role,           // "buyer" | "shopowner"
  myName,
  onClose,
}) => {
  const [status, setStatus]   = useState("idle"); // idle | requesting | waiting | active | ended
  const [muted,  setMuted]    = useState(false);
  const [camOff, setCamOff]   = useState(false);

  const localRef   = useRef(null);
  const remoteRef  = useRef(null);
  const pcRef      = useRef(null);
  const streamRef  = useRef(null);

  const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate && socket) {
        socket.emit("webrtc:ice", { sessionId, stallId, candidate: e.candidate, from: role });
      }
    };

    pc.ontrack = (e) => {
      if (remoteRef.current) remoteRef.current.srcObject = e.streams[0];
    };

    pc.oniceconnectionstatechange = () => {
      if (["disconnected","failed","closed"].includes(pc.iceConnectionState)) {
        setStatus("ended");
      }
    };

    return pc;
  }, [socket, sessionId, stallId, role]);

  const startLocalStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = stream;
    if (localRef.current) localRef.current.srcObject = stream;
    return stream;
  };

  // Buyer requests call
  const requestCall = async () => {
    if (!socket) { alert("Live call requires real-time connection. Please refresh and try again."); return; }
    setStatus("requesting");
    socket.emit("video:request", { stallId, sessionId, buyerName: myName });
  };

  // Shop owner answers call
  const answerCall = async () => {
    if (!socket) return;
    setStatus("active");
    socket.emit("video:accept", { sessionId, stallId });
    try {
      const stream = await startLocalStream();
      const pc = createPeerConnection();
      pcRef.current = pc;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
    } catch (err) {
      alert("Cannot access camera/microphone: " + err.message);
      setStatus("idle");
    }
  };

  const endCall = () => {
    if (socket) socket.emit("video:end", { sessionId, stallId });
    cleanup();
    onClose?.();
  };

  const cleanup = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    pcRef.current  = null;
    streamRef.current = null;
    setStatus("ended");
  };

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Shop owner: receive call request
    socket.on("video:request", async ({ sessionId: sid, buyerName }) => {
      if (sid !== sessionId) return;
      setStatus("waiting");
    });

    // Buyer: call accepted
    socket.on("video:accepted", async ({ sessionId: sid }) => {
      if (sid !== sessionId) return;
      setStatus("active");
      try {
        const stream = await startLocalStream();
        const pc = createPeerConnection();
        pcRef.current = pc;
        stream.getTracks().forEach(t => pc.addTrack(t, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc:offer", { sessionId, stallId, offer, from: role });
      } catch (err) {
        alert("Camera error: " + err.message);
        setStatus("idle");
      }
    });

    // Receive call rejected
    socket.on("video:rejected", ({ sessionId: sid }) => {
      if (sid !== sessionId) return;
      setStatus("idle");
      alert("Call was not accepted.");
    });

    // Receive WebRTC offer
    socket.on("webrtc:offer", async ({ offer, sessionId: sid }) => {
      if (sid !== sessionId || !pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit("webrtc:answer", { sessionId, stallId, answer, from: role });
    });

    // Receive WebRTC answer
    socket.on("webrtc:answer", async ({ answer, sessionId: sid }) => {
      if (sid !== sessionId || !pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    // Receive ICE candidate
    socket.on("webrtc:ice", async ({ candidate, sessionId: sid }) => {
      if (sid !== sessionId || !pcRef.current) return;
      try { await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
    });

    // Call ended by other party
    socket.on("video:ended", ({ sessionId: sid }) => {
      if (sid === sessionId) { cleanup(); }
    });

    return () => {
      socket.off("video:request");
      socket.off("video:accepted");
      socket.off("video:rejected");
      socket.off("webrtc:offer");
      socket.off("webrtc:answer");
      socket.off("webrtc:ice");
      socket.off("video:ended");
    };
  }, [socket, sessionId, stallId, role, createPeerConnection]);

  useEffect(() => () => cleanup(), []);

  const toggleMute = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMuted(v => !v);
  };

  const toggleCam = () => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setCamOff(v => !v);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (status === "idle" && role === "buyer") {
    return (
      <button
        onClick={requestCall}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg,#10b981,#059669)", border: "none", borderRadius: 24, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
      >
        📹 Request Live Video Call
      </button>
    );
  }

  if (status === "waiting" && role === "shopowner") {
    return (
      <div style={{ background: "#f0fdf4", border: "2px solid #86efac", borderRadius: 16, padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>📱</div>
        <div style={{ fontWeight: 700, color: "#166534", marginBottom: 12 }}>Incoming Video Call</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={answerCall} style={{ padding: "10px 24px", background: "#22c55e", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
            ✅ Accept
          </button>
          <button onClick={() => { socket?.emit("video:reject", { sessionId }); setStatus("idle"); }} style={{ padding: "10px 24px", background: "#ef4444", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
            ❌ Reject
          </button>
        </div>
      </div>
    );
  }

  if (status === "requesting") {
    return (
      <div style={{ background: "#eff6ff", border: "2px solid #bfdbfe", borderRadius: 16, padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📡</div>
        <div style={{ fontWeight: 700, color: "#1e40af", marginBottom: 4 }}>Calling stall owner...</div>
        <div style={{ fontSize: 12, color: "#60a5fa", marginBottom: 16 }}>Please wait for them to accept</div>
        <button onClick={() => setStatus("idle")} style={{ padding: "8px 20px", background: "#ef4444", border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", fontWeight: 600 }}>
          Cancel
        </button>
      </div>
    );
  }

  if (status === "active") {
    return (
      <div style={{ background: "#0f172a", borderRadius: 16, overflow: "hidden", position: "relative" }}>
        {/* Remote video (stall owner / main view) */}
        <video ref={remoteRef} autoPlay playsInline
          style={{ width: "100%", aspectRatio: "16/9", background: "#1e293b", display: "block" }}/>
        {/* Local video (picture-in-picture) */}
        <video ref={localRef} autoPlay playsInline muted
          style={{ position: "absolute", bottom: 60, right: 12, width: 120, borderRadius: 10, border: "2px solid #334155", background: "#0f172a" }}/>
        {/* Controls */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 16px", background: "linear-gradient(transparent,rgba(0,0,0,.7))", display: "flex", gap: 10, justifyContent: "center" }}>
          <CtrlBtn onClick={toggleMute}  label={muted  ? "🔇" : "🎤"} title={muted  ? "Unmute" : "Mute"}/>
          <CtrlBtn onClick={toggleCam}   label={camOff ? "🚫" : "📷"} title={camOff ? "Cam On" : "Cam Off"}/>
          <CtrlBtn onClick={endCall} label="📵" title="End Call" red/>
        </div>
      </div>
    );
  }

  if (status === "ended") {
    return (
      <div style={{ textAlign: "center", padding: 24, color: "#64748b" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📵</div>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Call Ended</div>
        {role === "buyer" && (
          <button onClick={() => setStatus("idle")} style={{ padding: "8px 20px", background: "#4f46e5", border: "none", borderRadius: 10, color: "#fff", cursor: "pointer" }}>
            Call Again
          </button>
        )}
      </div>
    );
  }

  return null;
};

const CtrlBtn = ({ onClick, label, title, red }) => (
  <button onClick={onClick} title={title} style={{ width: 42, height: 42, borderRadius: "50%", background: red ? "#ef4444" : "rgba(255,255,255,.15)", border: "none", fontSize: 18, cursor: "pointer", transition: "background .2s" }}
    onMouseEnter={e => e.currentTarget.style.background = red ? "#dc2626" : "rgba(255,255,255,.25)"}
    onMouseLeave={e => e.currentTarget.style.background = red ? "#ef4444" : "rgba(255,255,255,.15)"}
  >{label}</button>
);

export default VideoCall;
