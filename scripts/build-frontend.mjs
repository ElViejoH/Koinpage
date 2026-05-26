import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.resolve(rootDir, "dist");

async function copyIntoDist(relativePath) {
  const source = path.resolve(rootDir, relativePath);
  const target = path.resolve(distDir, relativePath);
  await cp(source, target, { recursive: true });
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

await copyIntoDist("assets");
await copyIntoDist("Components");
await copyIntoDist("css");
await copyIntoDist("js");
await cp(path.resolve(rootDir, "index.html"), path.resolve(distDir, "index.html"));

const runtimeConfigPath = path.resolve(distDir, "js", "runtime-config.js");
const runtimeConfig = {
  apiBaseUrl: String(process.env.APP_API_BASE_URL || "").trim()
};
const runtimeConfigContents =
  "\"use strict\";\n\nwindow.APP_CONFIG = Object.assign(" +
  JSON.stringify(runtimeConfig, null, 2) +
  ", window.APP_CONFIG || {});\n";

await writeFile(runtimeConfigPath, runtimeConfigContents, "utf8");

const sourceRuntimeConfigPath = path.resolve(rootDir, "js", "runtime-config.js");
const sourceRuntimeConfigContents = await readFile(sourceRuntimeConfigPath, "utf8");
if (!sourceRuntimeConfigContents.includes("window.APP_CONFIG")) {
  throw new Error("runtime-config.js template is invalid.");
}

console.log("Frontend build ready in dist/.");
