import express from "express";
import { nanoid } from "nanoid";
import { badRequest, notFound } from "../lib/http.js";
import { mapTransaction } from "../lib/mappers.js";
import { isIsoDate, isNonEmptyString, toNumber } from "../lib/validate.js";
import { requireAuth } from "../middleware/auth.js";

function getSql(req) {
  return req.app.get("db");
}

function contribution(type, amount) {
  return type === "income" ? amount : -amount;
}

async function getBalance(sql, userId) {
  const rows = await sql`
    select coalesce(sum(case when type = 'income' then amount else -amount end), 0) as balance
    from transactions
    where user_id = ${userId}
  `;
  return Number(rows[0]?.balance || 0);
}

export function transactionsRouter() {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/", async (req, res, next) => {
    try {
      const sql = getSql(req);
      const rows = await sql`
        select id, user_id, member_id, type, amount, category, date, description, created_at, updated_at
        from transactions
        where user_id = ${req.user.sub}
        order by date desc, created_at desc
      `;
      return res.json({ transactions: rows.map(mapTransaction) });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const memberId = String(req.body?.memberId || "").trim();
      const type = String(req.body?.type || "").trim();
      const amount = toNumber(req.body?.amount);
      const category = String(req.body?.category || "").trim();
      const date = String(req.body?.date || "").trim();
      const description = String(req.body?.description || "").trim();

      if (!isNonEmptyString(memberId)) return badRequest(res, "memberId is required");
      if (!(type === "income" || type === "expense")) return badRequest(res, "type must be income|expense");
      if (!(amount > 0)) return badRequest(res, "amount must be > 0");
      if (!isNonEmptyString(category)) return badRequest(res, "category is required");
      if (!isIsoDate(date)) return badRequest(res, "date must be YYYY-MM-DD");

      const sql = getSql(req);
      const memberRows = await sql`
        select id
        from members
        where id = ${memberId} and user_id = ${req.user.sub}
        limit 1
      `;
      if (!memberRows.length) return badRequest(res, "memberId does not exist");

      const balance = await getBalance(sql, req.user.sub);
      if (type === "expense" && balance + contribution(type, amount) < 0) {
        return badRequest(res, "Insufficient balance");
      }

      const rows = await sql`
        insert into transactions (id, user_id, member_id, type, amount, category, date, description)
        values (${`t_${nanoid(12)}`}, ${req.user.sub}, ${memberId}, ${type}, ${amount}, ${category}, ${date}, ${description})
        returning id, user_id, member_id, type, amount, category, date, description, created_at, updated_at
      `;
      return res.status(201).json({ transaction: mapTransaction(rows[0]) });
    } catch (error) {
      return next(error);
    }
  });

  router.put("/:id", async (req, res, next) => {
    try {
      const id = String(req.params.id || "");
      const memberId = String(req.body?.memberId || "").trim();
      const type = String(req.body?.type || "").trim();
      const amount = toNumber(req.body?.amount);
      const category = String(req.body?.category || "").trim();
      const date = String(req.body?.date || "").trim();
      const description = String(req.body?.description || "").trim();

      if (!isNonEmptyString(memberId)) return badRequest(res, "memberId is required");
      if (!(type === "income" || type === "expense")) return badRequest(res, "type must be income|expense");
      if (!(amount > 0)) return badRequest(res, "amount must be > 0");
      if (!isNonEmptyString(category)) return badRequest(res, "category is required");
      if (!isIsoDate(date)) return badRequest(res, "date must be YYYY-MM-DD");

      const sql = getSql(req);
      const txRows = await sql`
        select id, type, amount
        from transactions
        where id = ${id} and user_id = ${req.user.sub}
        limit 1
      `;
      const current = txRows[0];
      if (!current) return notFound(res, "Transaction not found");

      const memberRows = await sql`
        select id
        from members
        where id = ${memberId} and user_id = ${req.user.sub}
        limit 1
      `;
      if (!memberRows.length) return badRequest(res, "memberId does not exist");

      const balance = await getBalance(sql, req.user.sub);
      const projectedBalance =
        balance -
        contribution(current.type, Number(current.amount)) +
        contribution(type, amount);
      if (projectedBalance < 0) return badRequest(res, "Insufficient balance");

      const rows = await sql`
        update transactions
        set member_id = ${memberId},
            type = ${type},
            amount = ${amount},
            category = ${category},
            date = ${date},
            description = ${description},
            updated_at = now()
        where id = ${id} and user_id = ${req.user.sub}
        returning id, user_id, member_id, type, amount, category, date, description, created_at, updated_at
      `;
      return res.json({ transaction: mapTransaction(rows[0]) });
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const id = String(req.params.id || "");
      const sql = getSql(req);
      const rows = await sql`
        delete from transactions
        where id = ${id} and user_id = ${req.user.sub}
        returning id
      `;
      if (!rows.length) return notFound(res, "Transaction not found");

      return res.json({ ok: true });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
