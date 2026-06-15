// Shim the Foundry globals the Fabricate models touch (ids etc.)
let _n = 0;
const rid = (len = 16) => {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  // deterministic-ish but unique per call
  let s = ""; let x = (++_n) * 2654435761 % 2 ** 31;
  for (let i = 0; i < len; i++) { x = (x * 1103515245 + 12345) & 0x7fffffff; s += c[x % 62]; }
  return s;
};
globalThis.game = { user: { name: "bandits-seed", isGM: true }, modules: { get: () => undefined }, i18n: { localize: (s)=>s, format: (s)=>s } };
globalThis.ui = { notifications: { info(){}, warn(){}, error(){} } };
globalThis.foundry = {
  utils: {
    randomID: rid,
    deepClone: (o) => structuredClone(o),
    mergeObject: (a, b) => ({ ...(a||{}), ...(b||{}) }),
    duplicate: (o) => structuredClone(o),
    isNewerVersion: () => false,
    getProperty: (o,p)=>p.split('.').reduce((a,k)=>a?.[k],o),
    setProperty: ()=>true,
  },
};

const { Recipe } = await import("/tmp/fab-src/fabricate-1.0.0-rc.87/src/models/Recipe.js");
const { validateImportData } = await import("/tmp/fab-src/fabricate-1.0.0-rc.87/src/systems/CraftingSystemExporter.js");
const { readFileSync, writeFileSync } = await import("node:fs");

const data = JSON.parse(readFileSync("/home/buddha/src/bandits-on-the-river/data/crafting/items.json","utf8"));
const STARTER = ["torch","rope","alchemists-fire-lesser","antidote-lesser","healing-potion-minor"];
const items = data.items.filter(i => STARTER.includes(i.key));

const systemId = rid();
const components = items.map(it => ({
  id: rid(), name: it.name, sourceItemUuid: it.uuid,
  disabled: false, essences: {}, salvageOptions: [],
}));

const recipes = items.map(it => {
  const r = Recipe.createSimple(it.name, [], { itemUuid: it.uuid, quantity: 1 });
  const j = r.toJSON();
  j.craftingSystemId = systemId;
  return j;
});

const payload = {
  fabricateVersion: "1.0.0-rc.87",
  exportedAt: "2026-06-15T00:00:00.000Z",
  system: {
    id: systemId,
    name: "Riverbend Crafting",
    description: "Starter crafting for the riverside fishing village (bandits-on-the-river). 5-item starter; see issue #4.",
    components,
    essenceDefinitions: [], itemTags: [], categories: [], gatheringRealms: [],
  },
  recipes,
};

const v = validateImportData(payload);
console.log("validateImportData:", JSON.stringify(v));
console.log("components:", components.length, "recipes:", recipes.length);
console.log("sample recipe keys:", Object.keys(recipes[0]).join(","));
writeFileSync("/tmp/riverbend-crafting.json", JSON.stringify(payload, null, 2));
console.log("wrote /tmp/riverbend-crafting.json");
