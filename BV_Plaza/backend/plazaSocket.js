/**
 * BV_Plaza/backend/plazaSocket.js
 * Socket.io handlers for BV Plaza live sessions
 * Requires: npm install socket.io  (in backend folder)
 *
 * Handles:
 * - Shop owner online/offline presence
 * - Real-time chat messages
 * - WebRTC signaling (offer/answer/ICE) for video calls
 * - Voice message notifications
 */

module.exports = function initPlazaSocket(io) {
  const plazaNs = io.of("/plaza"); // isolated namespace

  // Track active sessions: stallId → { shopOwnerSocketId, buyers: Map<sessionId, socketId> }
  const stallRooms = new Map();
  // Track socket → metadata
  const socketMeta = new Map();

  plazaNs.on("connection", (socket) => {
    console.log("[BV Plaza Socket] Connected:", socket.id);

    // ── Shop Owner: Go Online ─────────────────────────────────────────────────
    socket.on("shopowner:online", ({ stallId, ownerId, stallName }) => {
      socket.join(`stall:${stallId}`);
      socket.join(`owner:${stallId}`);
      socketMeta.set(socket.id, { role: "shopowner", stallId, ownerId });

      if (!stallRooms.has(stallId)) stallRooms.set(stallId, { ownerSocketId: null, buyers: new Map() });
      stallRooms.get(stallId).ownerSocketId = socket.id;

      // Broadcast to all buyers watching this stall
      plazaNs.to(`stall:${stallId}`).emit("stall:status", { stallId, isOnline: true, stallName });
      console.log(`[BV Plaza] Shop owner online: ${stallId}`);
    });

    // ── Shop Owner: Go Offline ────────────────────────────────────────────────
    socket.on("shopowner:offline", ({ stallId }) => {
      plazaNs.to(`stall:${stallId}`).emit("stall:status", { stallId, isOnline: false });
      if (stallRooms.has(stallId)) stallRooms.get(stallId).ownerSocketId = null;
    });

    // ── Buyer: Join Stall ─────────────────────────────────────────────────────
    socket.on("buyer:join", ({ stallId, sessionId, buyerId, buyerName }) => {
      socket.join(`stall:${stallId}`);
      socket.join(`session:${sessionId}`);
      socketMeta.set(socket.id, { role: "buyer", stallId, sessionId, buyerId, buyerName });

      if (!stallRooms.has(stallId)) stallRooms.set(stallId, { ownerSocketId: null, buyers: new Map() });
      stallRooms.get(stallId).buyers.set(sessionId, socket.id);

      // Notify shop owner a buyer joined
      const room = stallRooms.get(stallId);
      if (room?.ownerSocketId) {
        plazaNs.to(room.ownerSocketId).emit("buyer:joined", { sessionId, buyerName, buyerId });
      }
      console.log(`[BV Plaza] Buyer joined stall ${stallId}, session ${sessionId}`);
    });

    // ── Chat Message ──────────────────────────────────────────────────────────
    socket.on("chat:message", (msg) => {
      // msg: { stallId, sessionId, senderType, senderName, messageType, content, productId?, timestamp }
      // Broadcast to the session room (buyer + shop owner)
      plazaNs.to(`session:${msg.sessionId}`).emit("chat:message", msg);
      // Also send to owner room so they see messages from all sessions
      if (msg.senderType === "buyer") {
        plazaNs.to(`owner:${msg.stallId}`).emit("chat:message", { ...msg, fromSession: msg.sessionId });
      }
    });

    // ── WebRTC Signaling ──────────────────────────────────────────────────────
    // Buyer requests video call
    socket.on("video:request", ({ stallId, sessionId, buyerName }) => {
      const room = stallRooms.get(stallId);
      if (room?.ownerSocketId) {
        plazaNs.to(room.ownerSocketId).emit("video:request", { sessionId, buyerName });
      }
    });

    // Shop owner accepts call
    socket.on("video:accept", ({ sessionId, stallId }) => {
      plazaNs.to(`session:${sessionId}`).emit("video:accepted", { sessionId });
    });

    // Shop owner rejects call
    socket.on("video:reject", ({ sessionId }) => {
      plazaNs.to(`session:${sessionId}`).emit("video:rejected", { sessionId });
    });

    // WebRTC offer (from caller)
    socket.on("webrtc:offer", ({ sessionId, offer, from }) => {
      socket.to(`session:${sessionId}`).emit("webrtc:offer", { offer, from, sessionId });
    });

    // WebRTC answer (from callee)
    socket.on("webrtc:answer", ({ sessionId, answer, from }) => {
      socket.to(`session:${sessionId}`).emit("webrtc:answer", { answer, from, sessionId });
    });

    // ICE candidate exchange
    socket.on("webrtc:ice", ({ sessionId, candidate, from }) => {
      socket.to(`session:${sessionId}`).emit("webrtc:ice", { candidate, from, sessionId });
    });

    // End call
    socket.on("video:end", ({ sessionId, stallId }) => {
      plazaNs.to(`session:${sessionId}`).emit("video:ended", { sessionId });
    });

    // ── Voice Message ─────────────────────────────────────────────────────────
    socket.on("voice:message", ({ sessionId, stallId, audioUrl, senderType, senderName, duration }) => {
      plazaNs.to(`session:${sessionId}`).emit("voice:message", {
        sessionId, audioUrl, senderType, senderName, duration, timestamp: new Date(),
      });
      if (senderType === "buyer") {
        plazaNs.to(`owner:${stallId}`).emit("voice:message", {
          sessionId, audioUrl, senderType, senderName, duration, timestamp: new Date(),
        });
      }
    });

    // ── Disconnect ─────────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      const meta = socketMeta.get(socket.id);
      if (meta) {
        if (meta.role === "shopowner") {
          plazaNs.to(`stall:${meta.stallId}`).emit("stall:status", { stallId: meta.stallId, isOnline: false });
          if (stallRooms.has(meta.stallId)) stallRooms.get(meta.stallId).ownerSocketId = null;
        } else if (meta.role === "buyer" && meta.stallId && meta.sessionId) {
          const room = stallRooms.get(meta.stallId);
          if (room) room.buyers.delete(meta.sessionId);
          if (room?.ownerSocketId) {
            plazaNs.to(room.ownerSocketId).emit("buyer:left", { sessionId: meta.sessionId });
          }
        }
        socketMeta.delete(socket.id);
      }
      console.log("[BV Plaza Socket] Disconnected:", socket.id);
    });
  });

  console.log("[BV Plaza] Socket.io namespace /plaza initialized");
};
