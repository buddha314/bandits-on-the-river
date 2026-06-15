/**
 * Compile / extract Bandits On The River compendium packs.
 *
 * Foundry v11+ loads compendiums as LevelDB directories (the `packs/` dir
 * declared in module.json). We author content as readable source JSON under
 * `src/packs/<name>/` and compile it here, so the source is diff-friendly and
 * the built packs are reproducible.
 *
 *   npm run pack     src/packs/<name>/*.json  ->  packs/<name>/   (LevelDB)
 *   npm run unpack   packs/<name>/            ->  src/packs/<name>/*.json
 *
 * Only non-empty source dirs are compiled, so you can scaffold a pack folder
 * before it has content without producing a broken (declared-but-missing) pack.
 */

import { compilePack, extractPack } from "@foundryvtt/foundryvtt-cli";
import { readdirSync, readFileSync } from "node:fs";

const SRC = "src/packs";
const OUT = "packs";
const mode = process.argv[2] ?? "pack";

/**
 * A LevelDB pack allows only one writer. Foundry holds every module pack open
 * while it runs AND rewrites them (enriching with schema defaults) at load —
 * so compiling underneath a live Foundry can corrupt the pack, and even reads
 * may catch a mid-write. Detect a running Foundry (Linux /proc scan) and stop.
 * @returns {string|null} the Foundry pid, or null
 */
function foundryPid() {
  try {
    for (const pid of readdirSync("/proc")) {
      if (!/^\d+$/.test(pid)) continue;
      let cmd;
      try {
        cmd = readFileSync(`/proc/${pid}/cmdline`, "utf8").replace(/\0/g, " ");
      } catch {
        continue;
      }
      if (cmd.includes("foundryvtt") && cmd.includes("main.js")) return pid;
    }
  } catch {
    /* non-Linux or no /proc — skip the check */
  }
  return null;
}

const pid = foundryPid();
if (pid && !process.env.FORCE) {
  const msg =
    `Foundry appears to be running (pid ${pid}). It holds the LevelDB packs open` +
    ` and rewrites them at load.`;
  if (mode === "pack") {
    console.error(`${msg}\nCompiling now risks corrupting a pack. Quit Foundry and retry, or set FORCE=1 to override.`);
    process.exit(1);
  }
  console.warn(`${msg}\nExtracting may catch a mid-write; quit Foundry for a clean capture. (continuing)`);
}

const hasDocs = (dir) =>
  readdirSync(dir).some((f) => /\.(json|ya?ml)$/i.test(f));

const packs = readdirSync(SRC, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

for (const name of packs) {
  const src = `${SRC}/${name}`;
  const out = `${OUT}/${name}`;
  if (mode === "unpack") {
    await extractPack(out, src, { log: true });
  } else {
    if (!hasDocs(src)) {
      console.log(`skip ${name} (no source documents yet)`);
      continue;
    }
    await compilePack(src, out, { log: true });
  }
}
console.log(`done (${mode}).`);
