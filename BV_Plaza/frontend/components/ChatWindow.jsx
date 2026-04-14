/**
 * BV_Plaza/frontend/components/ChatWindow.jsx
 * Real-time chat window for BV Plaza live stall sessions
 * Supports: text messages, voice messages, product shares
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { apiPlazaGetChat, apiPlazaSendMessage, apiPlazaGetStallProducts } from "../plazaApi";

const fmt = n => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const ChatWindow = ({
  stallId, sessionId, senderType, senderName, senderId,
  socket, // socket.io connection (optional, falls back to polling)
  onAddToCart, onBuyNow,
  compact = false,
}) => {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [sending, setSending]     = useState(false);
  const [recording, setRecording] = useState(false);
  const [products, setProducts]   = useState([]);
  const [showProducts, setShowProducts] = useState(false);
  const bottomRef  = useRef(null);
  const pollRef    = useRef(null);
  const mediaRef   = useRef(null);
  const chunksRef  = useRef([]);

  // Load chat history
  const loadMessages = useCallback(async () => {
    try {
      const r = await apiPlazaGetChat(stallId, sessionId);
      if (r.data?.messages) setMessages(r.data.messages);
    } catch {}
  }, [stallId, sessionId]);

  // Load products for sharing
  useEffect(() => {
    apiPlazaGetStallProducts(stallId).then(r => setProducts(r.data?.products || [])).catch(() => {});
  }, [stallId]);

  // Initial load + polling fallback (30s interval if no socket)
  useEffect(() => {
    loadMessages();
    if (!socket) {
      pollRef.current = setInterval(loadMessages, 8000); // poll every 8s
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadMessages, socket]);

  // Socket.io listeners
  useEffect(() => {
    if (!socket) return;
    const onMsg = (msg) => {
      if (msg.sessionId === sessionId) {
        setMessages(prev => {
          const exists = prev.some(m => m._id === msg._id || m.tempId === msg.tempId);
          return exists ? prev : [...prev, msg];
        });
      }
    };
    socket.on("chat:message", onMsg);
    socket.on("voice:message", (msg) => {
      if (msg.sessionId === sessionId) setMessages(prev => [...prev, { ...msg, messageType: "voice" }]);
    });
    return () => { socket.off("chat:message", onMsg); socket.off("voice:message"); };
  }, [socket, sessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendText = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const tempMsg = {
      tempId: Date.now(), sessionId, senderType, senderName,
      messageType: "text", content: input.trim(), createdAt: new Date(),
    };
    setMessages(prev => [...prev, tempMsg]);
    const text = input.trim();
    setInput("");

    try {
      const r = await apiPlazaSendMessage(stallId, sessionId, {
        messageType: "text", content: text, senderType,
      });
      if (socket) socket.emit("chat:message", { ...r.data.message, sessionId, stallId });
      setMessages(prev => prev.map(m => m.tempId === tempMsg.tempId ? (r.data.message || m) : m));
    } catch { }
    setSending(false);
  };

  const shareProduct = async (product) => {
    setShowProducts(false);
    const content = JSON.stringify({ productId: product._id, name: product.name, price: product.price, image: product.images?.[0]?.url });
    try {
      const r = await apiPlazaSendMessage(stallId, sessionId, {
        messageType: "product", content, productId: product._id, senderType,
      });
      if (socket) socket.emit("chat:message", { ...r.data.message, sessionId, stallId });
      setMessages(prev => [...prev, r.data.message]);
    } catch { }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = e => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url  = URL.createObjectURL(blob);
        // Send via socket if available
        if (socket) {
          socket.emit("voice:message", {
            sessionId, stallId, audioUrl: url,
            senderType, senderName, duration: "Voice",
          });
        }
        // Also store as text message with URL (for demo; in prod upload to Cloudinary)
        setMessages(prev => [...prev, {
          tempId: Date.now(), sessionId, senderType, senderName,
          messageType: "voice", content: url, createdAt: new Date(),
        }]);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRef.current = recorder;
      setRecording(true);
    } catch { alert("Microphone access denied"); }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const renderMessage = (msg, i) => {
    const isMe = msg.senderType === senderType;
    const bg   = isMe ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "#f1f5f9";
    const color = isMe ? "#fff" : "#1e293b";

    let content = null;
    if (msg.messageType === "product") {
      let prod = {};
      try { prod = JSON.parse(msg.content); } catch { prod = {}; }
      content = (
        <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0", minWidth: 200 }}>
          {prod.image && <img src={prod.image} alt={prod.name} style={{ width: "100%", height: 100, objectFit: "cover" }}/>}
          <div style={{ padding: "10px 12px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 4 }}>{prod.name}</div>
            <div style={{ fontWeight: 700, color: "#4f46e5", fontSize: 14, marginBottom: 8 }}>{fmt(prod.price)}</div>
            {(onAddToCart || onBuyNow) && (
              <div style={{ display: "flex", gap: 6 }}>
                {onAddToCart && (
                  <button onClick={() => onAddToCart(prod)} style={{ flex: 1, padding: "6px 0", background: "#f1f5f9", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#475569" }}>
                    + Cart
                  </button>
                )}
                {onBuyNow && (
                  <button onClick={() => onBuyNow(prod)} style={{ flex: 1, padding: "6px 0", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#fff" }}>
                    Buy Now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      );
    } else if (msg.messageType === "voice") {
      content = (
        <audio controls src={msg.content} style={{ maxWidth: 220, height: 36 }}/>
      );
    } else {
      content = <span style={{ fontSize: 14, lineHeight: 1.5 }}>{msg.content}</span>;
    }

    return (
      <div key={msg._id || msg.tempId || i} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: isMe ? "#4f46e5" : "#e2e8f0", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: isMe ? "#fff" : "#64748b", fontWeight: 700 }}>
          {(msg.senderName || "?")[0].toUpperCase()}
        </div>
        <div style={{ maxWidth: "70%" }}>
          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3, textAlign: isMe ? "right" : "left" }}>
            {msg.senderName} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div style={{ background: msg.messageType === "product" ? "transparent" : bg, color, padding: msg.messageType === "product" ? 0 : "10px 14px", borderRadius: isMe ? "18px 4px 18px 18px" : "4px 18px 18px 18px", fontSize: 14, wordBreak: "break-word" }}>
            {content}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: compact ? 360 : "100%", background: "#fff", borderRadius: compact ? 16 : 0, border: compact ? "1px solid #e2e8f0" : "none", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff" }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Live Chat</div>
        <div style={{ fontSize: 11, opacity: .8 }}>Chat with the stall owner</div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px", display: "flex", flexDirection: "column" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#94a3b8", marginTop: 40, fontSize: 13 }}>
            Start the conversation!
          </div>
        )}
        {messages.map(renderMessage)}
        <div ref={bottomRef}/>
      </div>

      {/* Product picker (shop owner only) */}
      {showProducts && senderType === "shopowner" && (
        <div style={{ maxHeight: 200, overflowY: "auto", borderTop: "1px solid #e2e8f0", padding: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", padding: "4px 8px", marginBottom: 4 }}>SHARE A PRODUCT</div>
          {products.map(p => (
            <div key={p._id} onClick={() => shareProduct(p)} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px", borderRadius: 10, cursor: "pointer", hover: { background: "#f1f5f9" } }}
              onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {p.images?.[0]?.url && <img src={p.images[0].url} alt={p.name} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 8 }}/>}
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                <div style={{ color: "#4f46e5", fontSize: 12 }}>{fmt(p.price)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div style={{ padding: "10px 12px", borderTop: "1px solid #e2e8f0", display: "flex", gap: 8, alignItems: "center" }}>
        {senderType === "shopowner" && (
          <button onClick={() => setShowProducts(v => !v)} title="Share Product"
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: "0 4px", color: showProducts ? "#4f46e5" : "#94a3b8" }}>
            🛍️
          </button>
        )}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendText()}
          placeholder="Type a message..."
          style={{ flex: 1, padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 24, fontSize: 13, outline: "none", background: "#f8fafc" }}
        />
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          title="Hold to record voice"
          style={{ background: recording ? "#ef4444" : "#f1f5f9", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 16, cursor: "pointer", flexShrink: 0 }}
        >
          🎙️
        </button>
        <button onClick={sendText} disabled={sending || !input.trim()}
          style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", border: "none", borderRadius: "50%", width: 36, height: 36, color: "#fff", fontSize: 16, cursor: "pointer", flexShrink: 0, opacity: input.trim() ? 1 : .5 }}>
          ➤
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
