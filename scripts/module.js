/**
 * Bandits On The River — content registration.
 *
 * This module is *content*: it supplies the rules, items, and (soon) the
 * Fabricate crafting system. The engine — automate-fvtt — does the rule
 * *management*. So we wait for `automate-fvtt.ready` and register our economy
 * through its public API rather than re-implementing any engine logic.
 *
 * @see the "engine vs content" split: automate-fvtt owns the tick + rules
 *      engine + Fabricate seam; we own the data.
 */

const MODULE_ID = "bandits-on-the-river";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | initialized`);
});

Hooks.once("automate-fvtt.ready", async (_adapter, _ok) => {
  const api = game.modules.get("automate-fvtt")?.api;
  if (!api?.rules) {
    console.warn(`${MODULE_ID} | automate-fvtt API not available; economy not registered.`);
    return;
  }

  // Load our craftable-items data (real pf2e items + basic-crafting metadata).
  let crafting;
  try {
    crafting = await foundry.utils.fetchJsonWithTimeout(
      `modules/${MODULE_ID}/data/crafting/items.json`
    );
  } catch (err) {
    console.error(`${MODULE_ID} | failed to load crafting data:`, err);
    return;
  }

  // The village gathers crafting raw materials over time. Basic PF2e crafting
  // consumes raw materials worth half an item's Price, so the Keep first needs a
  // supply of `raw-materials`. Register a simple producer for it (asset-bound so
  // it runs on any Keep without extra config).
  api.rules.register({
    id: `${MODULE_ID}.raw-materials`,
    kind: "producer",
    binding: "asset",
    assetUnits: 1,
    intervalSeconds: 86400, // per day
    inputs: {},
    outputs: { "raw-materials": 5 },
  });

  // NEXT (needs the authored Fabricate system JSON — see data/fabricate/, issue #4):
  // seed the crafting system, then register a Fabricate-backed craft rule per item
  // so the Keep can turn `raw-materials` into the real pf2e item over time:
  //
  //   await api.fabricate.seedSystem(
  //     `modules/${MODULE_ID}/data/fabricate/riverbend-crafting.json`);
  //   api.rules.setComponentMap([{ componentId: "<raw-materials-component>", resourceKey: "raw-materials" }]);
  //   for (const item of crafting.items) {
  //     api.rules.register(api.rules.makeFabricateRule({
  //       id: `${MODULE_ID}.craft.${item.key}`,
  //       intervalSeconds: 86400,
  //       fabricate: { op: api.rules.FAB_OP.CRAFT, recipeId: `<recipe-for-${item.key}>`,
  //                    ingredients: { "raw-materials": item.rawMaterials } },
  //     }));
  //   }

  console.log(
    `${MODULE_ID} | registered Keep economy; ${crafting.items.length} craftable items staged.`
  );
});
