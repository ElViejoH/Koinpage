import express from "express";
import { nanoid } from "nanoid";
import { badRequest, notFound } from "../lib/http.js";
import { mapBudget } from "../lib/mappers.js";
import { isMonthIso, isNonEmptyString, toNumber } from "../lib/validate.js";
import { requireAuth } from "../middleware/auth.js";

function getSql(req) {
  return req.app.get("db");
}

export function budgetsRouter() {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/", async (req, res, next) => {
    try {
      const sql = getSql(req);
      const rows = await sql`
        select id, user_id, category, month, limit_amount, created_at, updated_at
        from budgets
        where user_id = ${req.user.sub}
        order by month desc, category asc
      `;
      return res.json({ budgets: rows.map(mapBudget) });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const category = String(req.body?.category || "").trim();
      const month = String(req.body?.month || "").trim();
      const limit = toNumber(req.body?.limit);

      if (!isNonEmptyString(category)) return badRequest(res, "category is required");
      if (!isMonthIso(month)) return badRequest(res, "month must be YYYY-MM");
      if (!(limit > 0)) return badRequest(res, "limit must be > 0");

      const sql = getSql(req);
      const existing = await sql`
        select id, user_id, category, month, limit_amount, created_at, updated_at
        from budgets
        where user_id = ${req.user.sub}
          and month = ${month}
          and lower(category) = lower(${category})
        limit 1
      `;
      if (existing.length) {
        const mergedRows = await sql`
          update budgets
          set limit_amount = ${limit},
              updated_at = now()
          where id = ${existing[0].id}
          returning id, user_id, category, month, limit_amount, created_at, updated_at
        `;
        return res.json({ budget: mapBudget(mergedRows[0]), merged: true });
      }

      const rows = await sql`
        insert into budgets (id, user_id, category, month, limit_amount)
        values (${`b_${nanoid(12)}`}, ${req.user.sub}, ${category}, ${month}, ${limit})
        returning id, user_id, category, month, limit_amount, created_at, updated_at
      `;
      return res.status(201).json({ budget: mapBudget(rows[0]) });
    } catch (error) {
      return next(error);
    }
  });

  router.put("/:id", async (req, res, next) => {
    try {
      const id = String(req.params.id || "");
      const category = String(req.body?.category || "").trim();
      const month = String(req.body?.month || "").trim();
      const limit = toNumber(req.body?.limit);

      if (!isNonEmptyString(category)) return badRequest(res, "category is required");
      if (!isMonthIso(month)) return badRequest(res, "month must be YYYY-MM");
      if (!(limit > 0)) return badRequest(res, "limit must be > 0");

      const sql = getSql(req);
      const rows = await sql`
        update budgets
        set category = ${category},
            month = ${month},
            limit_amount = ${limit},
            updated_at = now()
        where id = ${id} and user_id = ${req.user.sub}
        returning id, user_id, category, month, limit_amount, created_at, updated_at
      `;
      if (!rows.length) return notFound(res, "Budget not found");

      return res.json({ budget: mapBudget(rows[0]) });
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const id = String(req.params.id || "");
      const sql = getSql(req);
      const rows = await sql`
        delete from budgets
        where id = ${id} and user_id = ${req.user.sub}
        returning id
      `;
      if (!rows.length) return notFound(res, "Budget not found");

      return res.json({ ok: true });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
