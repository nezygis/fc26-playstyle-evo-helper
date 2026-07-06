# PlayStyle Evo Helper (EA FC 26)

A Tampermonkey userscript for the EA FC 26 web app that **batch-applies
PlayStyle / PlayStyle+ evolutions** — to a single player, or a whole squad at
once — instead of EA's one-at-a-time UI.

<!-- To update the clip: open this README in the GitHub editor and drag demo-final.mp4 onto it; GitHub replaces the link below with a fresh attachment URL. -->
https://github.com/user-attachments/assets/b4dc23c6-c125-436b-b42d-4a726f7d7998

## Features
- **Two modes**
  - 👤 **Single** — search a player, see a preview (OVR, rarity, live caps 3 PS+ / 8 basic, current PlayStyles), then pick evolutions **by hand** or choose a **Position + Role** and hit **✨ Suggest**.
  - ⚡ **Bulk** — click players to queue them; each is auto-resolved to a role and its recommended evolutions, with a per-player playstyle preview. **Evolve the whole queue** in one go.
- 🔎 **Club search by name**, pre-filtered to evo-eligible rarities.
- 🧠 **Smart filtering** — hides cards that are already evolved (EA allows only one evo per player) and disables owned / ineligible / wrong-scope evos.
- 🎛️ **Real EA playstyle icons**; base/+ are mutually exclusive and caps are enforced.
- 🛡️ **In-panel confirm** before a bulk apply (no accidental changes); applies base PlayStyles first and PlayStyle+ last, then refreshes so the new playstyles show without a page reload.
- ⚙️ **Settings** (gear): claim &amp; finish, delay, and "start minimized". Responsive — fits mobile screens too.

## Install
1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. **Enable userscripts in your browser.** Recent Chrome/Edge versions require this for Tampermonkey to run userscripts — either turn on **Developer mode** in `chrome://extensions`, **or** open Tampermonkey's dashboard → **Settings** and enable **Allow User Scripts**. Full steps: [Tampermonkey guide](https://www.tampermonkey.net/faq.php?locale=en&q=Q209).
3. Click **[fc26-playstyle-evo-helper.user.js](https://raw.githubusercontent.com/nezygis/fc26-playstyle-evo-helper/main/fc26-playstyle-evo-helper.user.js)** → Tampermonkey opens an install page → **Install**.
4. Open the EA FC 26 web app. A floating **Evo Helper** panel appears.

### No-extension alternative (bookmarklet)
Don't want to install Tampermonkey? Load the tool on demand with a bookmarklet — it fetches this same script and injects it, so there's nothing to install:
1. Create a new bookmark (name it e.g. **Evo Helper**).
2. Paste this as the bookmark's **URL / address**:
   ```
   javascript:(function(){fetch('https://raw.githubusercontent.com/nezygis/fc26-playstyle-evo-helper/main/fc26-playstyle-evo-helper.user.js?t='+Date.now()).then(r=>r.text()).then(t=>{var s=document.createElement('script');s.textContent=t;document.body.appendChild(s);}).catch(e=>alert('Evo Helper failed to load: '+e));})();
   ```
3. Open the FC 26 web app and click the bookmark — the panel appears. Click it again after a page reload.

## Usage
- **Single:** search a player → pick **Position + Role** and hit **✨ Suggest** (or tick evolutions by hand) → **Apply selected evolutions**.
- **Bulk:** switch to the **Bulk** tab → click each player to queue them → **Evolve selected players** → confirm.

Changes show in-game without a page reload.

## ⚠️ Disclaimer
Automating the EA FC web app is **against EA's Terms of Service** and can get
your account banned. Use at your own risk. This is an unofficial fan tool, not
affiliated with EA.
