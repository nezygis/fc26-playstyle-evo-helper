# PlayStyle Evo Helper (EA FC 26)

A Tampermonkey userscript for the EA FC 26 web app that **batch-applies
PlayStyle / PlayStyle+ evolutions to a single player** — instead of EA's
one-at-a-time UI.

> Tip: to add your demo clip, drag the `.mp4` into this README while editing it
> on GitHub — it auto-uploads and embeds a player.

## Features
- 🔎 **Club search by name**, pre-filtered to evo-eligible rarities
- 🧾 **Player preview**: OVR, rarity, current PlayStyles, live caps (3 PS+ / 8 basic)
- ✨ **Role recommender** — pick the player's position + role and it preselects
  the recommended PlayStyles (top 3 as PS+), based on fut.gg's "best by role"
- 🎛️ **Card grid** with real EA playstyle icons; owned/ineligible evos disabled,
  base/+ mutually exclusive, caps enforced
- ⚡ One-click **apply → claim/finish** for the whole list

## Install
1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Click **[playstyle-evo-helper.user.js](https://raw.githubusercontent.com/nezygis/fc26-playstyle-evo-helper/main/fc26-playstyle-evo-helper.user.js)** → Tampermonkey opens an install page → **Install**.
3. Open the EA FC 26 web app → **Evolutions (Academy)** hub. A floating panel appears.

## Usage
Search a player → pick **Position + Role** and hit **✨ Suggest** (or tick evos by
hand) → **Apply selected**. Changes show in-game without a page reload.

## ⚠️ Disclaimer
Automating the EA FC web app is **against EA's Terms of Service** and can get
your account banned. Use at your own risk. This is an unofficial fan tool, not
affiliated with EA.
