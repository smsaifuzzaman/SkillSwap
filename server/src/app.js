import cors from "cors";
import express from "express";
import { getApiInfo, getHealth } from "./controllers/homeController.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json());

app.get("/", getApiInfo);
app.get("/api/health", getHealth);
app.use("/api/auth", authRoutes);
app.use("/api/portfolio", portfolioRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
