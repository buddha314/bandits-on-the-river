# Gathering setup (Fabricate)

In Fabricate **1.0.0-rc.87**, **Gathering** is the implemented feature (Crafting is
"Coming soon"). The Keep auto-gathers from a Fabricate **environment + task** each
tick: automate-fvtt starts a gathering attempt for the Keep, Fabricate creates a
timed run and resolves it on its own world-time hook (our tick advances it), and
the yield lands in the Keep and projects into its stockpile.

This part is authored **in Fabricate's UI** (it can't be scripted headlessly).
Once authored, paste the ids into `data/gathering/river.json` and the Keep starts
gathering automatically.

## Authoring checklist (GM, in Foundry)

1. **Enable gathering on a crafting system.** In the Fabricate crafting-system
   manager, turn on the **gathering** feature, and in **Economy settings** enable
   the **Resource nodes** toggle (required to author nodes on a scene).
2. **Create a gathering environment** and **link it to the river scene** (the
   bandits Title/encounter map). Environments are scene-linked.
3. **Add a gathering task** to the environment (e.g. "Fish the River",
   "Gather Reeds"). Make it a **timed task** (set a duration) so it becomes an
   *active run* that resolves on world-time. Give the task a **result group** with
   one or more **result items** — the components/items a successful gather awards
   (e.g. a Fish item, Raw Materials). Those items are what the Keep receives.
4. **Place resource nodes** on the river scene canvas (tiles); set *attempts per
   node* and respawn as desired (Fabricate handles node respawn on world-time).
5. **Enable/unlock the environment** so it's available to gather.
6. Note: **a GM must be online** for gathering to resolve.

## Wire it to the Keep

1. Open the environment/task in Fabricate and copy their **ids**.
2. Edit `data/gathering/river.json`:
   ```json
   {
     "enabled": true,
     "environmentId": "<environment id>",
     "taskId": "<task id>",
     "intervalSeconds": 86400,
     "componentMap": [
       { "componentId": "<fabricate component the task awards>", "resourceKey": "fish" }
     ]
   }
   ```
   - `intervalSeconds`: how often the Keep starts a gather (86400 = daily).
   - `componentMap`: maps the Fabricate component(s) the task yields to Keep
     stockpile resource keys, so the gathered items show up in the ledger. Leave
     empty for identity (component id used as the resource key).
3. Reload the world. `scripts/module.js` registers a Keep harvest rule on
   `automate-fvtt.ready`; advance time and the Keep accrues the yield.

## Notes
- The **Keep is the gatherer** — yield flows through automate-fvtt's existing
  inventory→stockpile projection, no separate deposit step.
- Players can also gather interactively at the same environments.
- Verify the engine path with `automate-fvtt`'s adapter
  (`api.fabricate.startGathering` / `gatheringDropBreakdown`) if debugging.
