import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseUrl = String(process.env.DATABASE_URL || "").trim();
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to apply the schema.");
}

const schemaPath = path.resolve(__dirname, "..", "database", "schema.sql");
const schemaSql = await readFile(schemaPath, "utf8");
const sql = postgres(databaseUrl, {
  ssl: String(process.env.DATABASE_SSL || "require").trim().toLowerCase() === "disable" ? false : "require"
});

try {
  await sql.unsafe(schemaSql);
  console.log("Schema applied successfully.");
} finally {
  await sql.end();
}
