#!/usr/bin/env node
/**
 * Genera el .zip listo para publicar en Azure App Service (sin Docker).
 *
 * Usa `output: "standalone"` (next.config.mjs) — Next ya deja en
 * `.next/standalone` un server Node autocontenido con solo los node_modules
 * realmente usados. Este script solo completa lo que Next NO copia ahí por
 * defecto (`.next/static` y `public/`) y empaqueta el resultado.
 *
 * El zip generado NO incluye node_modules de la raíz del repo, `.git`,
 * `scripts/` (esta misma carpeta), archivos `.env*` (los valores van en
 * Application Settings de Azure, nunca en el zip), ni nada fuera de
 * `.next/standalone` — solo se empaqueta esa carpeta ya curada por Next.
 *
 * Uso:
 *   node scripts/build-deploy-zip.mjs
 *   npm run deploy:zip
 *
 * Azure App Service — Startup Command tras publicar este zip:
 *   node server.js
 */

import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  cpSync,
  rmSync,
  statSync,
  createWriteStream,
  readdirSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ZipArchive } from "archiver";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const STANDALONE_DIR = path.join(ROOT, ".next", "standalone");
const STATIC_SRC = path.join(ROOT, ".next", "static");
const STATIC_DEST = path.join(STANDALONE_DIR, ".next", "static");
const PUBLIC_SRC = path.join(ROOT, "public");
const PUBLIC_DEST = path.join(STANDALONE_DIR, "public");

const OUTPUT_DIR = path.join(ROOT, "deploy");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_ZIP = path.join(OUTPUT_DIR, `taxflow-platform-${timestamp}.zip`);

function step(msg) {
  console.log(`\n▶ ${msg}`);
}

function run(cmd) {
  execSync(cmd, { cwd: ROOT, stdio: "inherit" });
}

step("1/5 — Compilando el proyecto (next build)...");
run("npm run build");

if (!existsSync(STANDALONE_DIR)) {
  console.error(
    "\n✗ No se encontró .next/standalone tras el build. Confirma que " +
      'next.config.mjs tiene `output: "standalone"`.',
  );
  process.exit(1);
}

step("2/5 — Copiando .next/static y public/ dentro del standalone...");
rmSync(STATIC_DEST, { recursive: true, force: true });
cpSync(STATIC_SRC, STATIC_DEST, { recursive: true });

if (existsSync(PUBLIC_SRC)) {
  rmSync(PUBLIC_DEST, { recursive: true, force: true });
  cpSync(PUBLIC_SRC, PUBLIC_DEST, { recursive: true });
}

step("3/5 — Quitando archivos .env* que Next copia solo por conveniencia...");
// Next.js copia .env/.env.production/.env.local etc. a .next/standalone
// automáticamente en build. Nunca deben ir en el zip: los secretos (Stripe,
// etc.) viven en Application Settings de Azure, no en un archivo empaquetado.
const ENV_FILE_PATTERN = /^\.env(\..+)?$/;
for (const entry of readdirSync(STANDALONE_DIR, { withFileTypes: true })) {
  if (entry.isFile() && ENV_FILE_PATTERN.test(entry.name)) {
    rmSync(path.join(STANDALONE_DIR, entry.name));
    console.log(`  - eliminado ${entry.name}`);
  }
}

step("4/5 — Preparando carpeta de salida...");
mkdirSync(OUTPUT_DIR, { recursive: true });

step(`5/5 — Empaquetando ${STANDALONE_DIR} → ${path.relative(ROOT, OUTPUT_ZIP)}`);
await new Promise((resolve, reject) => {
  const output = createWriteStream(OUTPUT_ZIP);
  const archive = new ZipArchive({ zlib: { level: 9 } });

  output.on("close", resolve);
  archive.on("error", reject);
  archive.pipe(output);
  // Contenido de .next/standalone directo en la raíz del zip (no la carpeta
  // "standalone" en sí) — así Azure encuentra server.js en la raíz.
  archive.directory(STANDALONE_DIR, false);
  archive.finalize();
});

const sizeMB = (statSync(OUTPUT_ZIP).size / (1024 * 1024)).toFixed(1);

console.log(`\n✓ Listo: ${path.relative(ROOT, OUTPUT_ZIP)} (${sizeMB} MB)`);
console.log(
  "\nEn Azure App Service, el Startup Command para este paquete es:\n  node server.js\n" +
    "(no `next start` — ese es el server generado por output: standalone)",
);
