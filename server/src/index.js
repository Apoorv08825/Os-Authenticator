import "./env.js";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes.js";
import mfaRoutes from "./routes/mfaRoutes.js";
import simulatorRoutes from "./routes/simulatorRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import { sanitizeInput } from "./middleware/sanitizeMiddleware.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { isSupabasePlaceholderConfig } from "./utils/supabase.js";

const app = express();
const PORT = process.env.PORT || 5000;
const defaultClientOrigins = [
  "https://os-authenticator.vercel.app",
  "http://localhost:5173"
];
const clientOrigins = [
  ...defaultClientOrigins,
  ...(process.env.CLIENT_URL || "").split(",")
]
  .flatMap((origin) => origin.split(","))
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set(clientOrigins);

if (process.env.NODE_ENV !== "production") {
  allowedOrigins.add("http://localhost:5173");
}

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);


app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: "200kb" }));
app.use(sanitizeInput);
app.use(apiRateLimiter);

if (isSupabasePlaceholderConfig) {
  console.warn(
    "Supabase is configured with placeholders. Update server/.env before using production authentication."
  );
}

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "secure-auth-framework-server" });
});

app.use("/api/auth", authRoutes);
app.use("/api/mfa", mfaRoutes);
app.use("/api/simulator", simulatorRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Secure Auth API listening on port ${PORT}`);
});
