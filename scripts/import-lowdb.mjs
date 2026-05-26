import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseUrl = String(process.env.DATABASE_URL || "").trim();
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to import lowdb data.");
}

const dataPath = path.resolve(__dirname, "..", ".data", "db.json");
const raw = await readFile(dataPath, "utf8");
const source = JSON.parse(raw);
const sql = postgres(databaseUrl, {
  ssl: String(process.env.DATABASE_SSL || "require").trim().toLowerCase() === "disable" ? false : "require"
});

try {
  await sql.begin(async (tx) => {
    for (const user of source.users || []) {
      await tx`
        insert into users (id, name, email, password_hash, created_at)
        values (${user.id}, ${user.name}, ${user.email}, ${user.passwordHash}, ${user.createdAt})
        on conflict (id) do update
          set name = excluded.name,
              email = excluded.email,
              password_hash = excluded.password_hash
      `;
    }

    for (const member of source.members || []) {
      await tx`
        insert into members (id, user_id, name, role, emoji, created_at, updated_at)
        values (${member.id}, ${member.userId}, ${member.name}, ${member.role}, ${member.emoji}, ${member.createdAt}, ${member.updatedAt || null})
        on conflict (id) do update
          set user_id = excluded.user_id,
              name = excluded.name,
              role = excluded.role,
              emoji = excluded.emoji,
              updated_at = excluded.updated_at
      `;
    }

    for (const item of source.transactions || []) {
      await tx`
        insert into transactions (id, user_id, member_id, type, amount, category, date, description, created_at, updated_at)
        values (
          ${item.id},
          ${item.userId},
          ${item.memberId},
          ${item.type},
          ${item.amount},
          ${item.category},
          ${item.date},
          ${item.description || ""},
          ${item.createdAt},
          ${item.updatedAt || null}
        )
        on conflict (id) do update
          set user_id = excluded.user_id,
              member_id = excluded.member_id,
              type = excluded.type,
              amount = excluded.amount,
              category = excluded.category,
              date = excluded.date,
              description = excluded.description,
              updated_at = excluded.updated_at
      `;
    }

    for (const budget of source.budgets || []) {
      await tx`
        insert into budgets (id, user_id, category, month, limit_amount, created_at, updated_at)
        values (
          ${budget.id},
          ${budget.userId},
          ${budget.category},
          ${budget.month},
          ${budget.limit},
          ${budget.createdAt},
          ${budget.updatedAt || null}
        )
        on conflict (id) do update
          set user_id = excluded.user_id,
              category = excluded.category,
              month = excluded.month,
              limit_amount = excluded.limit_amount,
              updated_at = excluded.updated_at
      `;
    }
  });

  console.log("Lowdb data imported successfully.");
} finally {
  await sql.end();
}
