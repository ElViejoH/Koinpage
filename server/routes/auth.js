import express from "express";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { badRequest, unauthorized } from "../lib/http.js";
import { mapUser } from "../lib/mappers.js";
import { isNonEmptyString } from "../lib/validate.js";
import { signToken } from "../middleware/auth.js";

function getSql(req) {
  return req.app.get("db");
}

export function authRouter() {
  const router = express.Router();

  router.post("/register", async (req, res, next) => {
    try {
      const name = String(req.body?.name || "").trim();
      const email = String(req.body?.email || "").trim().toLowerCase();
      const password = String(req.body?.password || "");

      if (!isNonEmptyString(name)) return badRequest(res, "Name is required");
      if (!isNonEmptyString(email) || !email.includes("@")) return badRequest(res, "Valid email is required");
      if (!isNonEmptyString(password) || password.length < 6) return badRequest(res, "Password must be 6+ chars");

      const sql = getSql(req);
      const existing = await sql`
        select id
        from users
        where email = ${email}
        limit 1
      `;
      if (existing.length) return badRequest(res, "Email already registered");

      const passwordHash = await bcrypt.hash(password, 10);
      const id = `u_${nanoid(10)}`;
      const memberId = `m_${nanoid(10)}`;
      const defaultMemberRole = "Titular";
      const defaultMemberEmoji = "🧑";

      const rows = await sql.begin(async (tx) => {
        const userRows = await tx`
          insert into users (id, name, email, password_hash)
          values (${id}, ${name}, ${email}, ${passwordHash})
          returning id, name, email
        `;
        await tx`
          insert into members (id, user_id, name, role, emoji)
          values (${memberId}, ${id}, ${name}, ${defaultMemberRole}, ${defaultMemberEmoji})
        `;
        return userRows;
      });

      const user = mapUser(rows[0]);
      const token = signToken({ sub: user.id, email: user.email, name: user.name });
      return res.json({ token, user });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/login", async (req, res, next) => {
    try {
      const email = String(req.body?.email || "").trim().toLowerCase();
      const password = String(req.body?.password || "");

      if (!isNonEmptyString(email) || !email.includes("@")) return badRequest(res, "Valid email is required");
      if (!isNonEmptyString(password)) return badRequest(res, "Password is required");

      const sql = getSql(req);
      const rows = await sql`
        select id, name, email, password_hash
        from users
        where email = ${email}
        limit 1
      `;
      const user = rows[0];
      if (!user) return unauthorized(res, "Invalid credentials");

      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return unauthorized(res, "Invalid credentials");

      const token = signToken({ sub: user.id, email: user.email, name: user.name });
      return res.json({ token, user: mapUser(user) });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/logout", (_req, res) => {
    return res.json({ ok: true });
  });

  return router;
}
