import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Local dev uses the Vite server first, then forwards API calls to Express.
      "/api": "http://localhost:5000",
      "/uploads": "http://localhost:5000"
    }
  }
});
