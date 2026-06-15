/**
 * Bandits On The River — seed a starter Fabricate crafting system (5 items).
 *
 * WHY A MACRO (not a hand-authored export JSON): Fabricate's export/import JSON
 * is deep (recipes carry steps/ingredientSets/resultGroups/results/visibility/
 * outcomeRouting; components nest in the system object) and can't be validated
 * offline. Its **supported create API** takes plain item UUIDs and is the robust
 * way in. This builds the starter through that API so it's easy to run + iterate.
 *
 * HOW TO RUN: in the pf2e world, as GM, with Fabricate active — create a Script
 * macro, paste this file's contents, and execute. Idempotent: re-running skips a
 * system / recipes that already exist.
 *
 * This is the **starter** (5 of the 10 items in issue #4) and recipes are
 * *result-only* for the first pass — they confirm the pf2e items resolve and
 * craft. Next iteration layers in the basic-PF2e-crafting cost (raw materials
 * worth ½ Price) once we confirm the ingredient/currency shape in-app.
 *
 * @see data/crafting/items.json — the single source of truth (UUIDs, prices).
 */
(async () => {
  const MODULE_ID = "bandits-on-the-river";
  const SYSTEM_NAME = "Riverbend Crafting";
  // 5 to get started — a spread across gear / alchemy / magic.
  const STARTER_KEYS = [
    "torch",
    "rope",
    "alchemists-fire-lesser",
    "antidote-lesser",
    "healing-potion-minor",
  ];

  if (!game.user?.isGM) return ui.notifications.error("Run this as a GM.");
  const fab = game.fabricate;
  if (!fab?.getCraftingSystemManager || !fab?.getRecipeManager || !fab?.api?.Recipe) {
    return ui.notifications.error("Fabricate is not active (or its API changed).");
  }

  // Source of truth: this module's craftable-items data.
  let data;
  try {
    data = await foundry.utils.fetchJsonWithTimeout(
      `modules/${MODULE_ID}/data/crafting/items.json`
    );
  } catch (err) {
    return ui.notifications.error(`Could not load items.json: ${err.message}`);
  }
  const items = data.items.filter((i) => STARTER_KEYS.includes(i.key));

  // 1) Get or create the crafting system.
  const sysMgr = fab.getCraftingSystemManager();
  let system = sysMgr.getSystems().find((s) => s.name === SYSTEM_NAME);
  if (!system) {
    system = await sysMgr.createSystem({
      name: SYSTEM_NAME,
      description: "Starter crafting for the riverside fishing village (bandits-on-the-river).",
    });
    console.log(`[bandits] created crafting system "${SYSTEM_NAME}" (${system.id})`);
  } else {
    console.log(`[bandits] using existing crafting system "${SYSTEM_NAME}" (${system.id})`);
  }

  // 2) Create one result-only recipe per starter item (idempotent by name).
  const { Recipe } = fab.api;
  const recipeMgr = fab.getRecipeManager();
  const existing = new Set(
    recipeMgr.getRecipes({ craftingSystemId: system.id }).map((r) => r.name)
  );

  const made = [], skipped = [], failed = [];
  for (const item of items) {
    if (existing.has(item.name)) { skipped.push(item.name); continue; }
    try {
      const uuid = item.uuid.startsWith("Compendium.") ? item.uuid : item.uuid;
      const recipe = Recipe.createSimple(item.name, [], { itemUuid: uuid, quantity: 1 });
      const json = recipe.toJSON();
      json.craftingSystemId = system.id;
      await recipeMgr.createRecipe(json, { notify: false });
      made.push(item.name);
    } catch (err) {
      failed.push(`${item.name}: ${err.message}`);
      console.error(`[bandits] recipe "${item.name}" failed`, err);
    }
  }

  console.log("[bandits] seed result — created:", made, "| skipped:", skipped, "| failed:", failed);
  ui.notifications.info(
    `Riverbend Crafting: +${made.length} recipe(s), ${skipped.length} already present, ${failed.length} failed (see console F12).`
  );
})();
