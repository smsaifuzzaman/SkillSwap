import jwt from "jsonwebtoken";
import { Message } from "../models/Message.js";
import { Notification } from "../models/Notification.js";

// Real-time layer sitting on top of the existing REST chat (chatController.js).
// Matches the REAL Message schema exactly: sender, receiver, content, read —
// no conversation field, so there's no Conversation collection to key off of.
// Instead, a "room" is just the two user IDs sorted together — deterministic
// regardless of who's sender vs receiver, so both sides always land in the
// same room.

function roomFor(userIdA, userIdB) {
  return [String(userIdA), String(userIdB)].sort().join(":");
}

const onlineUsers = new Map(); // userId -> Set of socket ids

export default function registerChatSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      // Matches auth.js: user id is stored under `sub`, not `id`.
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.sub;
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const { userId } = socket;

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);
    io.emit("presence:update", { userId, online: true });

    // Client calls this right after opening a chat with a given other user.
    socket.on("conversation:join", (otherUserId) => {
      socket.join(roomFor(userId, otherUserId));
    });

    socket.on("conversation:leave", (otherUserId) => {
      socket.leave(roomFor(userId, otherUserId));
    });

    // Mirrors sendMessage() in chatController.js exactly — same fields,
    // same Notification side effect — just delivered live instead of REST.
    socket.on("message:send", async ({ receiverId, content }, ack) => {
      try {
        if (!content?.trim()) return ack?.({ success: false, message: "Empty message" });

        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
          content: content.trim(),
        });

        const populated = await message.populate("sender", "name profilePhoto");

        await Notification.create({
          recipient: receiverId,
          type: "chat",
          title: "New Message",
          message: `${populated.sender.name} sent you a message: "${content.trim().substring(0, 30)}${content.trim().length > 30 ? "..." : ""}"`,
          relatedEntityId: userId,
        });

        io.to(roomFor(userId, receiverId)).emit("message:new", populated);
        ack?.({ success: true, data: populated });
      } catch (err) {
        ack?.({ success: false, message: err.message });
      }
    });

    socket.on("typing:start", ({ receiverId }) => {
      socket.to(roomFor(userId, receiverId)).emit("typing:update", { userId, typing: true });
    });

    socket.on("typing:stop", ({ receiverId }) => {
      socket.to(roomFor(userId, receiverId)).emit("typing:update", { userId, typing: false });
    });

    socket.on("message:read", async ({ otherUserId }) => {
      await Message.updateMany(
        { sender: otherUserId, receiver: userId, read: false },
        { $set: { read: true } }
      );
      socket.to(roomFor(userId, otherUserId)).emit("message:read", { by: userId });
    });

    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      sockets?.delete(socket.id);
      if (!sockets || sockets.size === 0) {
        onlineUsers.delete(userId);
        io.emit("presence:update", { userId, online: false });
      }
    });
  });
}