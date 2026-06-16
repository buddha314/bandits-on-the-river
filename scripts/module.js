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

/**
 * Required content for the adventure to run. The PF2e *system* must be the
 * world's system (its actors/items can't import otherwise); the two modules are
 * the showcase engine (automate-fvtt) and its crafting/gathering data model
 * (fabricate). Foundry can't "import" a module, only activate it — so installed
 * but disabled ones get an inline Enable & reload button.
 * @see module.json `relationships.requires` — keep this list in step with it.
 */
const REQUIRED = [
  { id: "pf2e", type: "system", label: "Pathfinder 2e (system)" },
  { id: "automate-fvtt", type: "module", label: "Automate FVTT" },
  { id: "fabricate", type: "module", label: "Fabricate" },
];

const SETTING_SPLASH_SEEN = "splashSeen";

/** Resolve a required dependency to a display + actionability status. */
function depStatus(dep) {
  const ICONS = {
    active: "fa-solid fa-circle-check",
    disabled: "fa-solid fa-circle-exclamation",
    missing: "fa-solid fa-circle-xmark",
  };
  let status, statusLabel, canEnable = false;

  if (dep.type === "system") {
    const ok = game.system.id === dep.id;
    status = ok ? "active" : "missing";
    statusLabel = ok ? "active" : `world system is ${game.system.id}`;
  } else {
    const mod = game.modules.get(dep.id);
    if (!mod) {
      status = "missing";
      statusLabel = "not installed";
    } else if (!mod.active) {
      status = "disabled";
      statusLabel = "installed, disabled";
      canEnable = true;
    } else {
      status = "active";
      statusLabel = "active";
    }
  }
  return { ...dep, status, statusLabel, canEnable, icon: ICONS[status] };
}

/**
 * New-world welcome splash. GM-only, shown once per world (until imported or
 * dismissed with "Don't show again"). Surfaces dependency status and opens
 * Foundry's native Adventure importer for one-click content import.
 */
class BanditsSplash extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  static DEFAULT_OPTIONS = {
    id: "bandits-splash",
    classes: ["bandits-splash"],
    tag: "div",
    window: {
      title: "Bandits on the River",
      icon: "fa-solid fa-water",
      resizable: false,
    },
    position: { width: 560, height: "auto" },
    actions: {
      enableDep: BanditsSplash.#onEnableDep,
      importAdventure: BanditsSplash.#onImport,
      dismiss: BanditsSplash.#onDismiss,
    },
  };

  static PARTS = {
    body: { template: `modules/${MODULE_ID}/templates/splash.hbs` },
  };

  /** @override */
  async _prepareContext() {
    return {
      title: "Bandits on the River",
      cover: `modules/${MODULE_ID}/assets/cover.webp`,
      description:
        "<p><strong>Welcome!</strong> Import the <em>Bandits on the River</em> " +
        "adventure — its scenes, journals, NPCs and items — into this world. " +
        "Re-importing later merges updates without discarding your changes.</p>",
      deps: REQUIRED.map(depStatus),
      systemOk: game.system.id === "pf2e",
      worldSystem: game.system.id,
    };
  }

  /** Enable an installed-but-disabled module, then reload to apply it. */
  static async #onEnableDep(event, target) {
    const id = target.dataset.id;
    const config = foundry.utils.deepClone(
      game.settings.get("core", "moduleConfiguration")
    );
    config[id] = true;
    await game.settings.set("core", "moduleConfiguration", config);
    ui.notifications.info(`Enabled "${id}". Reloading…`);
    globalThis.location.reload();
  }

  /** Open Foundry's native Adventure importer for our bundled adventure. */
  static async #onImport() {
    const pack = game.packs.get(`${MODULE_ID}.adventure`);
    if (!pack) {
      ui.notifications.error(
        "Bandits adventure compendium not found — rebuild packs and reload."
      );
      return;
    }
    const adventure = (await pack.getDocuments())[0];
    if (!adventure) {
      ui.notifications.error("Bandits adventure compendium is empty.");
      return;
    }
    // Engaging with import counts as "seen"; don't nag on future launches.
    await game.settings.set(MODULE_ID, SETTING_SPLASH_SEEN, true);
    await this.close();
    adventure.sheet.render(true); // → AdventureImporter (the checkbox-tree import UI)
  }

  /** Close; remember the choice only if the user opted out of future prompts. */
  static async #onDismiss() {
    const dontShow = this.element.querySelector('[name="dontShow"]')?.checked;
    if (dontShow) await game.settings.set(MODULE_ID, SETTING_SPLASH_SEEN, true);
    this.close();
  }
}

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | initialized`);

  // World-scoped, non-UI flag: have we already shown the splash / imported?
  game.settings.register(MODULE_ID, SETTING_SPLASH_SEEN, {
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
  });
});

Hooks.once("ready", () => {
  if (!game.user?.isGM) return;
  if (game.settings.get(MODULE_ID, SETTING_SPLASH_SEEN)) return;
  new BanditsSplash().render(true);
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

  // GATHERING (Fabricate, the implemented feature): when configured, the Keep
  // auto-gathers from a scene-linked environment/task each tick. The GM authors
  // the environment + task in Fabricate (see docs/GATHERING.md) and pastes the
  // ids into data/gathering/river.json. Yield lands in the Keep and projects into
  // the stockpile (engine handles it). Inert until enabled.
  let gathering = null;
  try {
    gathering = await foundry.utils.fetchJsonWithTimeout(
      `modules/${MODULE_ID}/data/gathering/river.json`
    );
  } catch { /* optional */ }
  if (gathering?.enabled && gathering.environmentId) {
    if (Array.isArray(gathering.componentMap) && gathering.componentMap.length) {
      api.rules.setComponentMap(gathering.componentMap);
    }
    api.rules.register(
      api.rules.makeFabricateRule({
        id: `${MODULE_ID}.gather.${gathering.taskId || "river"}`,
        intervalSeconds: gathering.intervalSeconds || 86400,
        fabricate: {
          op: api.rules.FAB_OP.HARVEST,
          environmentId: gathering.environmentId,
          taskId: gathering.taskId,
        },
      })
    );
    console.log(`${MODULE_ID} | gathering registered (env ${gathering.environmentId}).`);
  } else {
    console.log(`${MODULE_ID} | gathering not configured yet — see docs/GATHERING.md.`);
  }

  // CRAFTING DIRECTION: Fabricate's player Crafting tab is "Coming soon" in rc.87,
  // so crafting is NOT driven through Fabricate yet — it'll be automate-fvtt
  // numeric *converter* rules (raw-materials -> good) using data/crafting/items.json
  // as the spec. The Fabricate craft seed is parked until that tab ships.

  console.log(
    `${MODULE_ID} | registered Keep economy; ${crafting.items.length} craftable items staged.`
  );
});
