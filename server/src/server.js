import dotenv from "dotenv";
import http from "node:http";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import registerChatSocket from "./sockets/chatSocket.js";

import { startReminderService } from "./services/reminderService.js";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const port = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  }
});
registerChatSocket(io);
app.set("io", io);

connectDB()
  .then(() => {
    server.listen(port, () => {
      console.log(`SkillSwap API running on http://localhost:${port}`);
      startReminderService();
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  });
