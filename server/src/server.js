import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import app from "./app.js";
import { connectDB } from "./config/db.js";

import { startReminderService } from "./services/reminderService.js";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`SkillSwap API running on http://localhost:${port}`);
      startReminderService();
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  });
