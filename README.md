# Bandits On The River

![Bandits On The River](assets/cover.webp)

A 1st-level **Pathfinder Second Edition** river adventure, and the showcase content for the [`automate-fvtt`](https://github.com/buddha314/automate-fvtt) ecosystem. The party travels the river for a few weeks securing the supply line their home village depends on — while the village's resources tick down under Automate FVTT's economy engine.

> Formerly `automate-fvtt-pathfinder`. The repository, module id, and title were renamed to `bandits-on-the-river`; GitHub redirects the old URLs.

## Installing in Foundry VTT

### Prerequisites
This is a PF2e adventure that drives the Automate FVTT economy, so install these first (Foundry will not auto-install them):

- **Foundry VTT v13** or newer (required by the Automate FVTT dependency).
- The **Pathfinder Second Edition** game system — added under *Game Systems → Install System* (manifest from the [pf2e system page](https://foundryvtt.com/packages/pf2e)). A world using this system is required to run the adventure.
- The **[Automate FVTT](https://github.com/buddha314/automate-fvtt)** module (provides the Keep / resource-automation engine this content showcases), plus its own required dependency **Fabricate**.

### Install by manifest (recommended)
1. Launch Foundry VTT and open the **Setup** screen.
2. Go to the **Add-on Modules** tab and click **Install Module**.
3. Paste this **Manifest URL** into the field at the bottom:

   ```
   https://raw.githubusercontent.com/buddha314/bandits-on-the-river/main/module.json
   ```
4. Click **Install**. Foundry downloads and registers the module.

### Manual install (alternative)
If you can't reach the manifest URL, download the latest `module.zip` from the
[Releases page](https://github.com/buddha314/bandits-on-the-river/releases/latest)
and extract it into your Foundry `Data/modules/bandits-on-the-river/` directory,
then restart Foundry.

### Enable in your world
1. Launch (or create) a **Pathfinder Second Edition** world and log in as the Game Master.
2. Open **Settings → Manage Modules**.
3. Tick **Bandits On The River** — also ensure **Automate FVTT** (and **Fabricate**) are enabled.
4. Click **Save Module Settings**; the world reloads with the adventure available.

The adventure's maps, journals, and NPCs are imported from the module's compendium packs once enabled.

## Repository purpose
This repository is structured as an installable Foundry VTT module (manifest at `/module.json`) and provides a 1st-level PF2e adventure (maps, journals, NPCs) showcasing Automate FVTT's Keep / resource-automation features.

## Licensing
This repository includes the Open Game License v1.0a and an Open Game Content designation:

- `/OPEN-GAME-LICENSE.txt`
- `/OPEN-GAME-CONTENT.md`
