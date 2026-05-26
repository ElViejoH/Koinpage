import postgres from "postgres";

let sqlInstance = null;

function getDatabaseUrl() {
  const value = String(process.env.DATABASE_URL || "").trim();
  if (!value) {
    throw new Error("DATABASE_URL is required. Configure your Supabase Postgres connection string.");
  }
  return value;
}

function getSslMode() {
  const value = String(process.env.DATABASE_SSL || "require").trim().toLowerCase();
  if (value === "disable" || value === "false") return false;
  return "require";
}

export function getDb() {
  if (!sqlInstance) {
    sqlInstance = postgres(getDatabaseUrl(), {
      ssl: getSslMode(),
      max: 10,
      idle_timeout: 20,
      connect_timeout: 15
    });
  }

  return sqlInstance;
}

export async function initDb() {
  const sql = getDb();
  await sql`select 1 as ok`;
  return sql;
}
