// Leonida Platinum — entry program for gta6-trophy-guide-01 (Node 22, standard library only).
// What it does, in order: resolve the output directory, copy the static guide (app/) and the
// maker's screenshots (screenshots/) into it, then ask the vendored make.fun library to write
// dossier.json from exactly those files. The dossier must be the library's own bytes — the
// scorer rebuilds it and compares — so this file never edits or post-processes it.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// The gate's published caps for this competition, handed to buildDossier so an over-limit
// entry fails here, at build time, instead of at the scorer.
const GATE_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
} as const;

function copyTree(from: string, to: string): void {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

function countShots(dir: string): number {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((name) => !name.startsWith(".")).length;
}

mkdirSync(outputDir, { recursive: true });
copyTree(join(repoRoot, "app"), join(outputDir, "app"));
copyTree(join(repoRoot, "screenshots"), join(outputDir, "screenshots"));

const shotCount = countShots(join(outputDir, "screenshots"));
if (shotCount < 3 || shotCount > 4) {
  throw new Error(`screenshots/ must hold 3 or 4 images, found ${shotCount}`);
}

// The guide's promise is all 55 trophies; refuse to hand in a data file that lost one.
const trophyData = JSON.parse(readFileSync(join(outputDir, "app", "data", "trophies.json"), "utf8"));
const trophyCount = Array.isArray(trophyData) ? trophyData.length : trophyData.trophies?.length;
if (trophyCount !== 55) {
  throw new Error(`app/data/trophies.json must list 55 trophies, found ${trophyCount}`);
}

writeFileSync(join(outputDir, "dossier.json"), buildDossier(outputDir, GATE_LIMITS));
console.log(`Leonida Platinum handed in: app/ + ${shotCount} screenshots + dossier.json -> ${outputDir}`);
