# Authoring module content

Foundry loads compendium content as **LevelDB packs** (the `packs/` directory,
declared in `module.json`). We author content as readable **source JSON** under
`src/packs/<name>/` and compile it — so changes are diff-friendly and the built
packs are reproducible.

```
src/packs/
  scenes/    title.json, ...     -> packs/scenes/   (type Scene)
  journals/  (placeholder)       -> packs/journals/ (type JournalEntry)
  actors/    (placeholder)       -> packs/actors/   (type Actor,  system pf2e)
  items/     (placeholder)       -> packs/items/    (type Item,   system pf2e)
assets/
  cover.webp                     module cover / title-scene background
  scenes/                        battle-map art
```

## Build

```bash
npm install        # one-time: installs @foundryvtt/foundryvtt-cli locally (no sudo)
npm run pack       # src/packs/<name>/*.json  ->  packs/<name>/  (LevelDB)
npm run unpack     # packs/<name>/  ->  src/packs/<name>/*.json   (round-trip)
```

Only non-empty source folders are compiled, so empty placeholders don't produce
broken packs. After building, declare the pack in `module.json` under `packs`
and **restart Foundry / return to Setup** so it discovers the new compendium.

> **A pack has one writer.** Foundry holds every module pack open *and rewrites
> them at load* (enriching documents with schema defaults + `_stats`). So
> compiling underneath a running Foundry can corrupt a pack. `build-packs.mjs`
> guards against this: `pack` refuses to run while a Foundry process is detected
> (override with `FORCE=1`), and `unpack` warns. **Quit Foundry before
> `npm run pack`.** Because Foundry rewrites packs at runtime, expect `git`
> churn under `packs/` after you launch a world — treat `packs/` as a build
> artifact and regenerate it from source with `npm run pack` (Foundry closed)
> before committing pack changes.

## Authoring a scene in Foundry, then capturing it (round-trip)

Hand-writing JSON is fine for simple documents, but walls/lights/tokens are far
easier to place in Foundry. To author there and capture clean source:

1. In a world, build the Scene (place the map, walls, lighting, notes…).
2. Open the **Bandits on the River — Scenes** compendium → right-click it →
   **Toggle Edit Lock** to unlock it (module packs are locked by default).
3. Drag the Scene into the compendium (or right-click the Scene →
   *Export to Compendium* → choose that pack). Foundry writes it into
   `packs/scenes/`.
4. **Quit Foundry**, then `npm run unpack` — this writes the source JSON back
   under `src/packs/scenes/` (filename `<Name>_<id>.json`, `_key` included).
5. `npm run pack` to regenerate a deterministic LevelDB, then commit `src/` and
   `packs/`.

Source filenames follow the unpack convention (`<SafeName>_<id>.json`) so that
re-editing a scene in Foundry and unpacking **overwrites** its existing source
file instead of creating a duplicate (two files sharing a `_key` make `pack`
fail).

## Source document rules

Every source JSON **must** include a `_key` of the form `!<collection>!<_id>`
(e.g. `"_key": "!scenes!AcdhMwcg4PdbjpV1"`) — the CLI silently skips documents
without one (this is why an early build produced an empty pack). `_id` is a
16-char `[A-Za-z0-9]` Foundry id. `unpack` always writes a correct `_key`, so
the round-trip is lossless.

## Current content

- **Scenes → "Bandits on the River — Title"**: a gridless splash scene whose
  background is the module cover art (`assets/cover.webp`).
