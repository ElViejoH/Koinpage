import jwt from "jsonwebtoken";
import { unauthorized } from "../lib/http.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function requireAuth(req, res, next) {
  const header = String(req.headers.authorization || "");
  const match = header.match(/^Bearer (.+)$/);
  if (!match) return unauthorized(res, "Missing Bearer token");

  try {
    const decoded = jwt.verify(match[1], JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (_err) {
    return unauthorized(res, "Invalid token");
  }
}

