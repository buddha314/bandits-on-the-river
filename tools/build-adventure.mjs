/**
 * Assemble the Bandits On The River **Adventure** document from the module's
 * content packs, then compile just that pack.
 *
 * WHY
 *   The splash screen imports the adventure through Foundry's native Adventure
 *   importer — a single `Adventure` document that bundles every scene, actor,
 *   item and journal and recreates them (with their original ids, so links
 *   survive) on import. Hand-maintaining that bundle would drift from the real
 *   content, so we GENERATE it: read the source docs already authored under
 *   `src/packs/{scenes,journals,actors,items}/`, embed them into one Adventure
 *   source doc, and write it to `src/packs/adventure/`.
 *
 * SAFE WHILE FOUNDRY RUNS
 *   Unlike `build-packs.mjs` (which rewrites every LevelDB pack and therefore
 *   refuses to run under a live Foundry), this script only READS the static
 *   source JSON and only WRITES the `adventure` pack — a pack a running Foundry
 *   isn't holding open until it's declared in module.json and reloaded. So it's
 *   safe to run now; `npm run pack` (all packs) still requires quitting Foundry.
 *
 *   npm run build:adventure
 */

import { compilePack } from "@foundryvtt/foundryvtt-cli";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";

const SRC = "src/packs";
const OUT = "packs";

// Stable id so re-running overwrites the same Adventure (and import re-merges
// rather than duplicating). 16-char [A-Za-z0-9] per Foundry's id rules.
const ADV_ID = "BanditsRiverAdv1";
const ADV_NAME = "Bandits on the River";
const COVER = "modules/bandits-on-the-river/assets/cover.webp";

const DESCRIPTION = `<p><strong>Bandits on the River</strong> — a 1st-level Pathfinder Second
Edition river adventure, and the showcase content for <em>Automate FVTT</em>.</p>
<p>Importing creates the adventure's scenes, journals, NPCs and items in this
world. Re-importing later merges updates without losing your changes.</p>`;

// Which source pack folder feeds which Adventure embedded collection.
const COLLECTIONS = [
  { dir: "scenes", key: "scenes" },
  { dir: "journals", key: "journal" }, // note: the Adventure field is `journal`
  { dir: "actors", key: "actors" },
  { dir: "items", key: "items" },
];

/** Read every *.json doc from a source pack dir, stripping the pack-only `_key`. */
function readDocs(dir) {
  const path = `${SRC}/${dir}`;
  if (!existsSync(path)) return [];
  return readdirSync(path)
    .filter((f) => f.toLowerCase().endsWith(".json"))
    .map((f) => {
      const doc = JSON.parse(readFileSync(`${path}/${f}`, "utf8"));
      delete doc._key; // `_key` is a top-level-pack artifact; embedded docs don't carry it
      // Same for embedded sub-collections (e.g. JournalEntry pages keyed
      // `!journal.pages!...`) — keep their `_id`, drop the pack-storage key.
      for (const page of doc.pages ?? []) delete page._key;
      return doc;
    });
}

const adventure = {
  _key: `!adventures!${ADV_ID}`,
  _id: ADV_ID,
  name: ADV_NAME,
  img: COVER,
  caption: "A 1st-level PF2e river adventure — the Automate FVTT showcase.",
  description: DESCRIPTION,
  sort: 0,
  folders: [],
  // Every Adventure embedded collection — populated where we have content,
  // empty otherwise, so the document validates against the full schema.
  actors: [],
  combats: [],
  items: [],
  journal: [],
  scenes: [],
  tables: [],
  macros: [],
  cards: [],
  playlists: [],
  flags: { "bandits-on-the-river": { generated: true } },
  ownership: { default: 0 },
};

const counts = {};
for (const { dir, key } of COLLECTIONS) {
  const docs = readDocs(dir);
  adventure[key] = docs;
  counts[dir] = docs.length;
}

// Write the source doc (so the round-trip stays diff-friendly like the others).
const advSrc = `${SRC}/adventure`;
mkdirSync(advSrc, { recursive: true });
const srcFile = `${advSrc}/Bandits_on_the_River_${ADV_ID}.json`;
writeFileSync(srcFile, `${JSON.stringify(adventure, null, 2)}\n`);
console.log(`Wrote ${srcFile}`);
console.log(
  `  embedded: scenes=${counts.scenes} journals=${counts.journals} actors=${counts.actors} items=${counts.items}`
);

// Compile ONLY the adventure pack (fresh LevelDB; safe under a live Foundry).
const out = `${OUT}/adventure`;
rmSync(out, { recursive: true, force: true });
await compilePack(advSrc, out, { log: true });
console.log("done (build:adventure).");
