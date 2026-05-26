import express from "express";
import { nanoid } from "nanoid";
import { badRequest, notFound } from "../lib/http.js";
import { mapMember } from "../lib/mappers.js";
import { isNonEmptyString } from "../lib/validate.js";
import { requireAuth } from "../middleware/auth.js";

function getSql(req) {
  return req.app.get("db");
}

export function membersRouter() {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/", async (req, res, next) => {
    try {
      const sql = getSql(req);
      const rows = await sql`
        select id, user_id, name, role, emoji, created_at, updated_at
        from members
        where user_id = ${req.user.sub}
        order by created_at asc
      `;
      return res.json({ members: rows.map(mapMember) });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const name = String(req.body?.name || "").trim();
      const role = String(req.body?.role || "").trim();
      const emoji = String(req.body?.emoji || "🧑").trim() || "🧑";

      if (!isNonEmptyString(name)) return badRequest(res, "Name is required");
      if (!isNonEmptyString(role)) return badRequest(res, "Role is required");

      const sql = getSql(req);
      const rows = await sql`
        insert into members (id, user_id, name, role, emoji)
        values (${`m_${nanoid(10)}`}, ${req.user.sub}, ${name}, ${role}, ${emoji})
        returning id, user_id, name, role, emoji, created_at, updated_at
      `;
      return res.status(201).json({ member: mapMember(rows[0]) });
    } catch (error) {
      return next(error);
    }
  });

  router.put("/:id", async (req, res, next) => {
    try {
      const id = String(req.params.id || "");
      const name = String(req.body?.name || "").trim();
      const role = String(req.body?.role || "").trim();
      const emoji = String(req.body?.emoji || "🧑").trim() || "🧑";

      if (!isNonEmptyString(name)) return badRequest(res, "Name is required");
      if (!isNonEmptyString(role)) return badRequest(res, "Role is required");

      const sql = getSql(req);
      const rows = await sql`
        update members
        set name = ${name},
            role = ${role},
            emoji = ${emoji},
            updated_at = now()
        where id = ${id} and user_id = ${req.user.sub}
        returning id, user_id, name, role, emoji, created_at, updated_at
      `;
      if (!rows.length) return notFound(res, "Member not found");

      return res.json({ member: mapMember(rows[0]) });
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const id = String(req.params.id || "");
      const sql = getSql(req);
      const rows = await sql`
        delete from members
        where id = ${id} and user_id = ${req.user.sub}
        returning id
      `;
      if (!rows.length) return notFound(res, "Member not found");

      return res.json({ ok: true });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
