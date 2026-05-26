import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { initDb } from "./lib/db.js";
import { authRouter } from "./routes/auth.js";
import { membersRouter } from "./routes/members.js";
import { transactionsRouter } from "./routes/transactions.js";
import { budgetsRouter } from "./routes/budgets.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const app = express();

const db = await initDb();
app.set("db", db);

function getAllowedOrigins() {
  return String(process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = getAllowedOrigins();
const isProduction = process.env.NODE_ENV === "production";

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (!isProduction) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed"));
  }
}));
app.use(express.json({ limit: "256kb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter());
app.use("/api/members", membersRouter());
app.use("/api/transactions", transactionsRouter());
app.use("/api/budgets", budgetsRouter());

// Static site (existing structure: index.html at root, app pages under /Components).
app.use(express.static(path.resolve(__dirname, ".."), { extensions: ["html"] }));

app.use((err, _req, res, next) => {
  if (!err) return next();
  if (err.message === "Origin not allowed") {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  return res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Koin server listening on http://localhost:${PORT}`);
});
