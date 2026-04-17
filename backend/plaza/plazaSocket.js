module.exports = function initPlazaSocket(io) {
  const plazaNs = io.of("/plaza");

  const stallRooms = new Map();
  const socketMeta = new Map();

  plazaNs.on("connection", (socket) => {
    console.log("[BV Plaza Socket] Connected:", socket.id);

    socket.on("shopowner:online", ({ stallId, ownerId, stallName }) => {
      socket.join(`stall:${stallId}`);
      socket.join(`owner:${stallId}`);
      socketMeta.set(socket.id, { role: "shopowner", stallId, ownerId });

      if (!stallRooms.has(stallId)) stallRooms.set(stallId, { ownerSocketId: null, buyers: new Map() });
      stallRooms.get(stallId).ownerSocketId = socket.id;

      plazaNs.to(`stall:${stallId}`).emit("stall:status", { stallId, isOnline: true, stallName });
      console.log(`[BV Plaza] Shop owner online: ${stallId}`);
    });

    socket.on("shopowner:offline", ({ stallId }) => {
      plazaNs.to(`stall:${stallId}`).emit("stall:status", { stallId, isOnline: false });
      if (stallRooms.has(stallId)) stallRooms.get(stallId).ownerSocketId = null;
    });

    socket.on("buyer:join", ({ stallId, sessionId, buyerId, buyerName }) => {
      socket.join(`stall:${stallId}`);
      socket.join(`session:${sessionId}`);
      socketMeta.set(socket.id, { role: "buyer", stallId, sessionId, buyerId, buyerName });

      if (!stallRooms.has(stallId)) stallRooms.set(stallId, { ownerSocketId: null, buyers: new Map() });
      stallRooms.get(stallId).buyers.set(sessionId, socket.id);

      const room = stallRooms.get(stallId);
      if (room?.ownerSocketId) {
        plazaNs.to(room.ownerSocketId).emit("buyer:joined", { sessionId, buyerName, buyerId });
      }
      console.log(`[BV Plaza] Buyer joined stall ${stallId}, session ${sessionId}`);
    });

    socket.on("chat:message", (msg) => {
      plazaNs.to(`session:${msg.sessionId}`).emit("chat:message", msg);
      if (msg.senderType === "buyer") {
        plazaNs.to(`owner:${msg.stallId}`).emit("chat:message", { ...msg, fromSession: msg.sessionId });
      }
    });

    socket.on("video:request", ({ stallId, sessionId, buyerName }) => {
      const room = stallRooms.get(stallId);
      if (room?.ownerSocketId) {
        plazaNs.to(room.ownerSocketId).emit("video:request", { sessionId, buyerName });
      }
    });

    socket.on("video:accept", ({ sessionId }) => {
      plazaNs.to(`session:${sessionId}`).emit("video:accepted", { sessionId });
    });

    socket.on("video:reject", ({ sessionId }) => {
      plazaNs.to(`session:${sessionId}`).emit("video:rejected", { sessionId });
    });

    socket.on("webrtc:offer", ({ sessionId, offer, from }) => {
      socket.to(`session:${sessionId}`).emit("webrtc:offer", { offer, from, sessionId });
    });

    socket.on("webrtc:answer", ({ sessionId, answer, from }) => {
      socket.to(`session:${sessionId}`).emit("webrtc:answer", { answer, from, sessionId });
    });

    socket.on("webrtc:ice", ({ sessionId, candidate, from }) => {
      socket.to(`session:${sessionId}`).emit("webrtc:ice", { candidate, from, sessionId });
    });

    socket.on("video:end", ({ sessionId }) => {
      plazaNs.to(`session:${sessionId}`).emit("video:ended", { sessionId });
    });

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
