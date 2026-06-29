// ==UserScript==
// @name         PlayStyle Evo Helper — FC26
// @namespace    https://github.com/nezygis/fc26-playstyle-evo-helper
// @version      1.0.1
// @description  Batch-apply PlayStyle / PlayStyle+ evolutions to a single player on the EA FC 26 web app, with role-based suggestions, rarity-eligibility filtering, and live caps.
// @author       nezygis
// @homepageURL  https://github.com/nezygis/fc26-playstyle-evo-helper
// @supportURL   https://github.com/nezygis/fc26-playstyle-evo-helper/issues
// @match        https://www.ea.com/*ultimate-team/web-app*
// @match        https://www.ea.com/*/ultimate-team/web-app*
// @run-at       document-idle
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/nezygis/fc26-playstyle-evo-helper/main/fc26-playstyle-evo-helper.user.js
// @updateURL    https://raw.githubusercontent.com/nezygis/fc26-playstyle-evo-helper/main/fc26-playstyle-evo-helper.user.js
// ==/UserScript==

/*
 * PlayStyle Evo Helper — batch-apply PlayStyle / PlayStyle+ evolutions to one player.
 *
 * Install: Tampermonkey → new script → paste this file → save. Open the EA FC 26
 * web app, go to the Evolutions (Academy) hub. A floating panel appears.
 * Usage: search a player (search defaults to evo-eligible rarities), pick a
 * Position+Role and hit ✨ Suggest (or tick evos by hand), then Apply selected.
 *
 * ⚠ Automating the FC web app is against EA's Terms of Service and can get your
 * account banned. Use at your own risk.
 *
 * How it works: drives the web app's OWN service objects (state-safe), not raw HTTP.
 *   services.Academy.addItemToSlot(slotId, itemId)  -> apply an evo
 *   services.Academy.claimSlot(slotId)              -> claim/finish it
 *   repositories.Item.getClub().items               -> club players
 * PlayStyle traitId = rewardId - 301. Caps: 3 PS+ / 8 basic per player.
 * Console helpers on window.FCEvo: scrapeRarities(), clubRaritiesDump(),
 * eligibleRarities(slotId).
 */
(function () {
  "use strict";

  const CAP_PLUS = 3, CAP_BASIC = 8, TRAIT_OFFSET = 301; // traitId = rewardId - 301 (icon classes run 0..35)

  // Catalog: n=name, s=slotId, r=rewardId(=traitId+301), g=gk-only
  const PS = [{"n":"Finesse Shot","s":2141,"r":301,"g":0},{"n":"Far Throw","s":2142,"r":331,"g":1},{"n":"Enforcer","s":2143,"r":330,"g":0},{"n":"Intercept","s":2144,"r":317,"g":0},{"n":"Whipped Pass","s":2145,"r":313,"g":0},{"n":"Long Ball Pass","s":2146,"r":311,"g":0},{"n":"Incisive Pass","s":2147,"r":309,"g":0},{"n":"Deflector","s":2148,"r":336,"g":1},{"n":"Quick Step","s":2149,"r":326,"g":0},{"n":"Trickster","s":2150,"r":324,"g":0},{"n":"Slide Tackle","s":2151,"r":319,"g":0},{"n":"Aerial Fortress","s":2152,"r":320,"g":0},{"n":"Tiki Taka","s":2153,"r":312,"g":0},{"n":"Gamechanger","s":2154,"r":308,"g":0},{"n":"Chip Shot","s":2155,"r":302,"g":0},{"n":"Cross Claimer","s":2156,"r":333,"g":1},{"n":"Bruiser","s":2157,"r":329,"g":0},{"n":"Precision Header","s":2158,"r":305,"g":0},{"n":"Acrobatic","s":2159,"r":306,"g":0},{"n":"Long Throw","s":2160,"r":328,"g":0},{"n":"Press Proven","s":2161,"r":325,"g":0},{"n":"Block","s":2162,"r":316,"g":0},{"n":"Pinged Pass","s":2163,"r":310,"g":0},{"n":"Inventive","s":2164,"r":314,"g":0},{"n":"Power Shot","s":2165,"r":303,"g":0},{"n":"1v1 Close Down","s":2166,"r":334,"g":1},{"n":"Relentless","s":2167,"r":327,"g":0},{"n":"Rapid","s":2168,"r":322,"g":0},{"n":"Jockey","s":2169,"r":315,"g":0},{"n":"Anticipate","s":2170,"r":318,"g":0},{"n":"Low Driven Shot","s":2171,"r":307,"g":0},{"n":"Dead Ball","s":2172,"r":304,"g":0},{"n":"Far Reach","s":2173,"r":335,"g":1},{"n":"Footwork","s":2174,"r":332,"g":1},{"n":"Technical","s":2175,"r":321,"g":0},{"n":"First Touch","s":2176,"r":323,"g":0}];
  const PSP = [{"n":"Far Reach+","s":2181,"r":335,"g":1},{"n":"Technical+","s":2184,"r":321,"g":0},{"n":"Intercept+","s":2185,"r":317,"g":0},{"n":"Tiki Taka+","s":2186,"r":312,"g":0},{"n":"Low Driven Shot+","s":2187,"r":307,"g":0},{"n":"Footwork+","s":2188,"r":332,"g":1},{"n":"Jockey+","s":2191,"r":315,"g":0},{"n":"Anticipate+","s":2196,"r":318,"g":0},{"n":"Finesse Shot+","s":2200,"r":301,"g":0},{"n":"Incisive Pass+","s":2203,"r":309,"g":0},{"n":"Quick Step+","s":2210,"r":326,"g":0},{"n":"Rapid+","s":2211,"r":322,"g":0},{"n":"Pinged Pass+","s":2213,"r":310,"g":0},{"n":"Bruiser+","s":2189,"r":329,"g":0},{"n":"Relentless+","s":2183,"r":327,"g":0},{"n":"Long Ball Pass+","s":2192,"r":311,"g":0},{"n":"Inventive+","s":2197,"r":314,"g":0},{"n":"Cross Claimer+","s":2198,"r":333,"g":1},{"n":"First Touch+","s":2201,"r":323,"g":0},{"n":"1v1 Close Down+","s":2204,"r":334,"g":1},{"n":"Trickster+","s":2206,"r":324,"g":0},{"n":"Press Proven+","s":2207,"r":325,"g":0},{"n":"Block+","s":2212,"r":316,"g":0},{"n":"Gamechanger+","s":2214,"r":308,"g":0},{"n":"Deflector+","s":2215,"r":336,"g":1},{"n":"Power Shot+","s":2216,"r":303,"g":0},{"n":"Enforcer+","s":2182,"r":330,"g":0},{"n":"Chip Shot+","s":2190,"r":302,"g":0},{"n":"Acrobatic+","s":2193,"r":306,"g":0},{"n":"Dead Ball+","s":2194,"r":304,"g":0},{"n":"Slide Tackle+","s":2195,"r":319,"g":0},{"n":"Long Throw+","s":2199,"r":328,"g":0},{"n":"Aerial Fortress+","s":2202,"r":320,"g":0},{"n":"Far Throw+","s":2205,"r":331,"g":1},{"n":"Whipped Pass+","s":2208,"r":313,"g":0},{"n":"Precision Header+","s":2209,"r":305,"g":0}];
  PS.forEach((x) => (x.kind = "PS"));
  PSP.forEach((x) => (x.kind = "PS+"));
  const ALL = PS.concat(PSP);
  const traitName = {}; // traitId -> display name (base name, no '+')
  PS.forEach((x) => (traitName[x.r - TRAIT_OFFSET] = x.n));

  // Recommended playstyles per position/role. Top 3 -> PS+, rest -> base.
  const ROLES = {"ST":{"Advanced Forward":["Finesse Shot","Low Driven Shot","Rapid","Incisive Pass","Gamechanger","Quick Step","Technical","Tiki Taka","First Touch","Press Proven","Enforcer"],"Target Forward":["Finesse Shot","Enforcer","Precision Header","Low Driven Shot","Incisive Pass","Rapid","First Touch","Gamechanger","Tiki Taka","Press Proven","Pinged Pass"],"Poacher":["Finesse Shot","Low Driven Shot","Rapid","Incisive Pass","First Touch","Gamechanger","Quick Step","Technical","Press Proven","Pinged Pass","Enforcer"],"False 9":["Finesse Shot","Incisive Pass","Low Driven Shot","Gamechanger","Rapid","Tiki Taka","Technical","Pinged Pass","Quick Step","Inventive","First Touch"]},"RW / LW":{"Inside Forward":["Finesse Shot","Low Driven Shot","Rapid","Quick Step","Technical","Gamechanger","Incisive Pass","Pinged Pass","Tiki Taka","First Touch","Inventive"],"Winger":["Rapid","Finesse Shot","Pinged Pass","Quick Step","Technical","Low Driven Shot","Gamechanger","Incisive Pass","Tiki Taka","First Touch","Inventive"],"Wide Playmaker":["Finesse Shot","Incisive Pass","Technical","Tiki Taka","Pinged Pass","Rapid","Low Driven Shot","Gamechanger","Press Proven","First Touch","Inventive"]},"CAM":{"Shadow Striker":["Finesse Shot","Incisive Pass","Rapid","Low Driven Shot","Technical","Quick Step","Tiki Taka","Gamechanger","First Touch","Pinged Pass","Inventive"],"Playmaker":["Finesse Shot","Incisive Pass","Low Driven Shot","Tiki Taka","Pinged Pass","Technical","Gamechanger","First Touch","Press Proven","Quick Step","Inventive"],"Classic 10":["Finesse Shot","Incisive Pass","Technical","Tiki Taka","Pinged Pass","Low Driven Shot","Gamechanger","First Touch","Press Proven","Quick Step","Inventive"],"Half Winger":["Incisive Pass","Rapid","Technical","Tiki Taka","Pinged Pass","Gamechanger","Quick Step","First Touch","Press Proven","Inventive","Low Driven Shot"]},"CM":{"Box to Box":["Incisive Pass","Pinged Pass","Intercept","Finesse Shot","Tiki Taka","Bruiser","Anticipate","Quick Step","Technical","Relentless","Press Proven"],"Playmaker":["Incisive Pass","Pinged Pass","Finesse Shot","Tiki Taka","Technical","Intercept","Low Driven Shot","Anticipate","First Touch","Quick Step","Inventive"],"Deep Lying Playmaker":["Intercept","Pinged Pass","Bruiser","Tiki Taka","Incisive Pass","Anticipate","Jockey","Quick Step","First Touch","Press Proven","Long Ball Pass"],"Holding":["Intercept","Pinged Pass","Bruiser","Tiki Taka","Anticipate","Jockey","Incisive Pass","Quick Step","First Touch","Press Proven","Long Ball Pass"],"Half Winger":["Pinged Pass","Intercept","Quick Step","Tiki Taka","Incisive Pass","Finesse Shot","Anticipate","Technical","Jockey","Bruiser","Rapid"]},"RM / LM":{"Inside Forward":["Finesse Shot","Low Driven Shot","Rapid","Quick Step","Technical","Gamechanger","Incisive Pass","Pinged Pass","Tiki Taka","First Touch","Inventive"],"Winger":["Rapid","Finesse Shot","Pinged Pass","Quick Step","Technical","Low Driven Shot","Gamechanger","Incisive Pass","Tiki Taka","First Touch","Inventive"],"Wide Playmaker":["Finesse Shot","Incisive Pass","Technical","Tiki Taka","Pinged Pass","Rapid","Low Driven Shot","Gamechanger","Press Proven","First Touch","Inventive"],"Wide Midfielder":["Rapid","Quick Step","Pinged Pass","Tiki Taka","Incisive Pass","Intercept","Anticipate","Relentless","Whipped Pass","Jockey","Press Proven"]},"CDM":{"Holding":["Intercept","Pinged Pass","Bruiser","Tiki Taka","Anticipate","Jockey","Incisive Pass","Quick Step","First Touch","Press Proven","Long Ball Pass"],"Deep Lying Playmaker":["Intercept","Pinged Pass","Bruiser","Tiki Taka","Incisive Pass","Anticipate","Jockey","Quick Step","First Touch","Press Proven","Long Ball Pass"],"Box Crasher":["Incisive Pass","Intercept","Pinged Pass","Finesse Shot","Tiki Taka","Quick Step","Bruiser","Anticipate","Technical","Press Proven","Relentless"],"Centre Half":["Intercept","Bruiser","Jockey","Anticipate","Quick Step","Block","Tiki Taka","Pinged Pass","Aerial Fortress","Slide Tackle","Long Ball Pass"],"Wide Half":["Bruiser","Intercept","Quick Step","Jockey","Anticipate","Incisive Pass","Block","Tiki Taka","Pinged Pass","Press Proven","Relentless"]},"RB / LB":{"Fullback":["Bruiser","Intercept","Quick Step","Jockey","Anticipate","Incisive Pass","Block","Tiki Taka","Pinged Pass","Press Proven","Relentless"],"Wingback":["Intercept","Pinged Pass","Quick Step","Anticipate","Bruiser","Tiki Taka","Jockey","Incisive Pass","Rapid","Relentless","Press Proven"],"Falseback":["Intercept","Pinged Pass","Anticipate","Jockey","Tiki Taka","Incisive Pass","Bruiser","Quick Step","First Touch","Press Proven","Long Ball Pass"],"Inverted Wingback":["Incisive Pass","Tiki Taka","Quick Step","Intercept","Anticipate","Rapid","Pinged Pass","Jockey","Press Proven","Relentless","Bruiser"],"Attacking Wingback":["Rapid","Quick Step","Pinged Pass","Tiki Taka","Incisive Pass","Intercept","Anticipate","Relentless","Jockey","First Touch","Bruiser"]},"CB":{"Defender":["Intercept","Bruiser","Anticipate","Jockey","Quick Step","Block","Pinged Pass","Aerial Fortress","Slide Tackle","Tiki Taka","Press Proven"],"Stopper":["Intercept","Bruiser","Anticipate","Jockey","Quick Step","Block","Slide Tackle","Tiki Taka","Pinged Pass","Relentless","Aerial Fortress"],"Wide Back":["Intercept","Anticipate","Quick Step","Jockey","Bruiser","Block","Pinged Pass","Aerial Fortress","Slide Tackle","Tiki Taka","Press Proven"],"Ball Playing Defender":["Intercept","Bruiser","Anticipate","Jockey","Quick Step","Block","Pinged Pass","Tiki Taka","First Touch","Press Proven","Aerial Fortress"]},"GK":{"Goalkeeper":["Far Reach","Footwork","1v1 Close Down","Deflector","Cross Claimer","Far Throw","Pinged Pass","Long Ball Pass","Tiki Taka","Press Proven","First Touch"],"Ball Playing":["Far Reach","Footwork","1v1 Close Down","Deflector","Cross Claimer","Pinged Pass","Far Throw","Long Ball Pass","Tiki Taka","Press Proven","First Touch"],"Sweeper Keeper":["Far Reach","Footwork","1v1 Close Down","Deflector","Cross Claimer","Pinged Pass","Far Throw","Long Ball Pass","Tiki Taka","Press Proven","First Touch"]}};
  const psByName = {}, pspByName = {};
  PS.forEach((x) => (psByName[x.n] = x));
  PSP.forEach((x) => (pspByName[x.n.replace(/\+$/, "")] = x)); // keyed by base name

  // rareflag ids these evos can be applied to (defaults the club-search filter).
  const ELIGIBLE_RARITIES = [30,94,98,109];

  // position id (UTLocalizationUtil) -> role group
  const POS_GROUP = {
    0: "GK", 1: "CB", 2: "RB / LB", 3: "RB / LB", 4: "CB", 5: "CB", 6: "CB", 7: "RB / LB", 8: "RB / LB",
    9: "CDM", 10: "CDM", 11: "CDM", 12: "RM / LM", 13: "CM", 14: "CM", 15: "CM", 16: "RM / LM",
    17: "CAM", 18: "CAM", 19: "CAM", 20: "RW / LW", 21: "ST", 22: "RW / LW", 23: "RW / LW",
    24: "ST", 25: "ST", 26: "ST", 27: "RW / LW",
  };

  // rareflag -> name (EA obfuscates in-app names). Editable via data/rarities.json.
  const RARITIES = {"0":"Common","1":"Rare","3":"Team of the Week","5":"Team of the Year","8":"Star Performer","11":"Team of the Season","12":"Icon","14":"Knockout Royalty Hero","15":"Knockout Royalty ICON","18":"Festival of Football ICON","20":"FoF: Answer the Call","21":"Prime Hero","22":"Ratings Reload","23":"Future Stars Hero","26":"UCL Primetime Hero","27":"UWCL Primetime Hero","28":"Festival of Football: Captains","30":"FUT Birthday","31":"UEFA Women's Champions League Primetime","32":"UEFA Women's Champions League Road to the Final","33":"Thunderstruck","34":"FC Pro Live","35":"Winter Wildcards ICON","36":"Journey of Nations","46":"UEFA Europa League Primetime","49":"Winter Wildcards Hero","50":"UEFA Champions League Primetime","55":"Knockout Royalty","57":"Showdown Upgrade","58":"Showdown","62":"Festival of Football Showdown","63":"Festival of Football Showdown Upgrade","64":"TOTY Honourable Mentions","65":"TOTS Honourable Mentions","69":"World Tour Silver Superstar","71":"Future Stars","72":"Heroes","76":"Trophy Titans ICON","77":"Trophy Titans Hero","81":"Classic XI Hero","82":"Unbreakables","83":"Unbreakables Hero","85":"Unbreakables ICON","88":"Unbreakables Evolution","90":"Moments","91":"World Tour","94":"Festival of Football: Star Performer","96":"Joga Bonito","97":"Joga Bonito Hero","104":"Festival of Football: Glory Hunters Red","105":"UEFA Conference League Primetime","107":"Festival of Football: Path to Glory","108":"Time Warp","109":"Festival of Football: Glory Hunters","111":"Fantasy FC","112":"Time Warp ICON","116":"Festival of Football: Captains ICON","117":"Winter Wildcards","120":"TOTS Breakthrough","124":"UEFA Champions League Road to the Final","125":"UEFA Europa League Road to the Final","126":"UEFA Conference League Road to the Final","130":"Festival of Football: Greats of the Game Hero","131":"Festival of Football: Greats of the Game ICON","132":"TOTY HM Evolution","135":"Fantasy FC Hero","147":"FUT Birthday EVO","148":"FUT Birthday Hero","149":"FUT Birthday ICON","150":"Cornerstones","151":"Ultimate Scream","155":"Team of the Year ICON","157":"Thunderstruck ICON","168":"Ultimate Scream Hero","170":"Future Stars ICON"};

  const state = {
    item: null, // selected club item entity
    selected: new Set(), // slotIds
    running: false, abort: false,
    rarities: new Set(), // allowed rareflags for club search; empty = all
    clubItems: null, // players we loaded ourselves (full club / eligible rarities)
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const ACAD = () => (window.services && window.services.Academy) || (typeof services !== "undefined" ? services.Academy : null);
  const CLUB = () => { try { return window.repositories.Item.getClub(); } catch (_) { return null; } };

  // --- Engine ---------------------------------------------------------------
  function svcObserve(observable) {
    return new Promise((resolve, reject) => {
      if (!observable || typeof observable.observe !== "function") return reject(new Error("not an observable"));
      let done = false;
      observable.observe(window, function (obs, res) {
        if (done) return; done = true;
        try { obs.unobserve(window); } catch (_) {}
        if (res && res.success) resolve(res); else reject(res || new Error("call failed"));
      });
    });
  }
  const applyEvo = (slotId, itemId) => svcObserve(ACAD().addItemToSlot(slotId, itemId, undefined));
  const claimEvo = (slotId) => svcObserve(ACAD().claimSlot(slotId));

  async function runBatch(slotIds, opts) {
    if (state.running) return;
    if (!state.item) return log("✋ No player selected.", "warn");
    if (!slotIds.length) return log("✋ Nothing selected.", "warn");
    state.running = true; state.abort = false; setRunning(true);
    const itemId = state.item.id;
    let ok = 0, fail = 0;
    log(`▶ ${slotIds.length} evo(s) → ${playerName(state.item)} (delay ${opts.delayMs}ms, claim=${opts.claim})`, "head");
    for (let i = 0; i < slotIds.length; i++) {
      if (state.abort) { log("⏹ Aborted.", "warn"); break; }
      const evo = byId(slotIds[i]);
      const tag = `[${i + 1}/${slotIds.length}] ${evo ? evo.n : slotIds[i]}`;
      try {
        const res = await applyEvo(slotIds[i], itemId);
        if (res.data && res.data.isMaximumNumberOfSlotsReached) log(`⚠ ${tag}: max active slots — claim needed`, "warn");
        if (opts.claim) { try { await claimEvo(slotIds[i]); } catch (ce) { log(`   (claim skipped: ${errMsg(ce)})`, "dim"); } }
        ok++; log(`✔ ${tag}`, "ok");
      } catch (e) { fail++; log(`✗ ${tag} — ${errMsg(e)}`, "err"); }
      if (i < slotIds.length - 1 && !state.abort) await sleep(opts.delayMs);
    }
    refreshClub();
    // refresh preview (counts/playstyles changed)
    try { state.item = findItemById(itemId) || state.item; } catch (_) {}
    renderPreview(); renderGrid();
    state.running = false; setRunning(false);
    log(`■ Done: ${ok} ok, ${fail} failed.`, "head");
  }

  // Mirror what the app's own academy flow does after an apply, so views pick up
  // the change without a page reload (the addItemToSlot service already updated
  // the club/squad item entities).
  function refreshClub() {
    try {
      const pile = (window.ItemPile && window.ItemPile.CLUB != null) ? window.ItemPile.CLUB : 7;
      window.repositories.Item.setDirty(pile);
      window.repositories.Academy.requiresHubCall = true;
    } catch (_) {}
  }
  const CODE = { 458: "captcha required", 460: "ineligible (already has it, maxed, or rarity/OVR not allowed)", 461: "permission denied", 426: "feature disabled", 470: "not enough currency" };
  function errMsg(e) {
    if (!e) return "?";
    const code = (e.error && e.error.code) || e.status;
    if (code && CODE[code]) return `${code} — ${CODE[code]}`;
    if (e.error && e.error.message) return `${e.error.code || ""} ${e.error.message}`.trim();
    return code ? "status=" + code : (e.message || String(e));
  }
  const byId = (s) => ALL.find((x) => x.s === s);

  // --- Player helpers -------------------------------------------------------
  function clubPlayers() {
    // Prefer the items we loaded ourselves (full / eligible); fall back to whatever
    // the app has cached (usually just the active squad).
    let items = state.clubItems;
    if (!items || !items.length) { const c = CLUB(); items = (c && (c.items || (c.getItems ? c.getItems() : []))) || []; }
    return (items || []).filter((it) => { try { return it && it.isPlayer && it.isPlayer(); } catch (_) { return false; } });
  }
  // Build a club search criteria (UTSearchCriteriaDTO), optionally rarity-filtered.
  function makeClubCriteria(offset, count, rarities) {
    const Ctor = window.UTSearchCriteriaDTO;
    if (!Ctor) return null;
    const c = new Ctor();
    try { c.type = (window.SearchType && window.SearchType.PLAYER) || "player"; } catch (_) {}
    try { c.count = count; } catch (_) {}
    try { c.offset = offset; } catch (_) {}
    if (rarities && rarities.length) { try { c.rarities = rarities.slice(); } catch (_) {} }
    return c;
  }
  function setClubStatus(text, cls) {
    if (els.clubstat) { els.clubstat.textContent = text; els.clubstat.className = "clubstat " + (cls || ""); }
  }
  // The active squad being loaded is a good "app is ready for club searches" signal.
  function getActiveSquad() {
    const R = window.repositories, S = window.services;
    const tries = [
      () => R.Squad && R.Squad.getActiveSquad && R.Squad.getActiveSquad(),
      () => R.Squad && R.Squad.getCurrentSquad && R.Squad.getCurrentSquad(),
      () => S.Squad && S.Squad.getActiveSquad && S.Squad.getActiveSquad(),
      () => R.Squad && R.Squad.activeSquad,
    ];
    for (const f of tries) { try { const sq = f(); if (sq) return sq; } catch (_) {} }
    return null;
  }
  function squadReady() {
    const sq = getActiveSquad();
    if (!sq) return false;
    try { if (typeof sq.getPlayers === "function") return sq.getPlayers().filter(Boolean).length >= 1; } catch (_) {}
    try { if (Array.isArray(sq.players)) return sq.players.filter(Boolean).length >= 1; } catch (_) {}
    return true; // squad object exists even if we can't read players
  }
  // Load club players via paginated search. With `rarities`, only those load.
  // Throws if the FIRST page fails (app not ready) so the caller can retry.
  async function loadClub(rarities) {
    if (!(window.services && window.services.Club && window.services.Club.search)) throw new Error("Club service unavailable");
    const all = [], seen = new Set();
    let offset = 0, guard = 0;
    while (guard++ < 80) {
      const crit = makeClubCriteria(offset, 91, rarities);
      if (!crit) throw new Error("no UTSearchCriteriaDTO");
      let res;
      try { res = await svcObserve(window.services.Club.search(crit)); }
      catch (e) { if (offset === 0) throw e; break; } // first page fails -> not ready; later -> keep partial
      const items = (res && res.response && res.response.items) || (res && res.data && res.data.items) || [];
      if (!items.length) break;
      let added = 0;
      for (const it of items) { const id = it && it.id; if (id != null && !seen.has(id)) { seen.add(id); all.push(it); added++; } }
      offset += items.length;
      state.clubItems = all.slice();
      setClubStatus("Club: loading… " + all.length + " players", "load");
      if (added === 0) break;
      await sleep(120);
    }
    state.clubItems = all;
    if (els.rarpanel) els.rarpanel.dataset.built = ""; // rebuild rarity list with real counts
    renderResults();
    return all.length;
  }
  // Retry wrapper: waits/retries until the club search is accepted by the app.
  let clubLoading = false;
  async function startClubLoad(attempt, manual) {
    if (clubLoading && !manual) return;
    clubLoading = true;
    const rarities = (ELIGIBLE_RARITIES && ELIGIBLE_RARITIES.length) ? ELIGIBLE_RARITIES : null;
    setClubStatus("Club: loading…" + (attempt > 1 ? " (retry " + attempt + ")" : ""), "load");
    try {
      const n = await loadClub(rarities);
      if (!n) throw new Error("0 players returned");
      setClubStatus("Club: " + n + " players loaded" + (rarities ? " (eligible)" : "") + " · ↻", "ok");
      clubLoading = false;
    } catch (e) {
      clubLoading = false;
      if (attempt < 8) {
        setClubStatus("Club: app not ready, retrying (" + attempt + ")…", "load");
        setTimeout(() => startClubLoad(attempt + 1), 2500);
      } else {
        setClubStatus("Club: load failed (" + errMsg(e) + ") — click to retry", "err");
      }
    }
  }
  function findItemById(id) { return clubPlayers().find((it) => it.id === id || it.id === Number(id)); }
  function playerName(it) {
    try { const sd = it.getStaticData ? it.getStaticData() : it._staticData; if (sd && sd.name) return sd.name; } catch (_) {}
    return "Player";
  }
  function rarityName(it) {
    const n = RARITIES[it.rareflag];
    return n || ("Rarity " + it.rareflag);
  }

  // Scrape rareflag -> name from the open transfer-market rarity filter DOM
  // (bg url cards_bg_e_1_{id}_N.png + label). Merges into RARITIES live and logs
  // a JSON block to paste into data/rarities.json. Open TM search > rarity first.
  function scrapeRarities() {
    const found = {};
    document.querySelectorAll("li.with-icon, ul.inline-list li").forEach((li) => {
      let bg = "";
      try { bg = li.style.backgroundImage || getComputedStyle(li).backgroundImage; } catch (_) {}
      const m = bg && bg.match(/cards_bg_e_1_(\d+)_/);
      const name = (li.textContent || "").trim();
      if (m && name && name.toLowerCase() !== "any") found[m[1]] = name;
    });
    const n = Object.keys(found).length;
    if (n) { Object.assign(RARITIES, found); renderResults(); renderPreview(); }
    log(n ? `↻ Scraped ${n} rarities (applied live).` : "✋ No rarity dropdown found — open TM search → rarity filter first.", n ? "head" : "warn");
    console.log("[FCEvo] rarities for data/rarities.json:\n" + JSON.stringify(found));
    return found;
  }

  // List every distinct rarity present in the club (id, name, count).
  function clubRaritiesDump() {
    const rs = clubRarities();
    console.log("[FCEvo] club rarities (id \\t name \\t count):\n" + rs.map((r) => `${r.rf}\t${r.name}\t×${r.count}`).join("\n"));
    return rs;
  }
  // Empirically find which rarities an evo accepts, via the app's canApplyTo().
  function eligibleRarities(slotId) {
    let slot = null;
    try { slot = window.repositories.Academy.getSlotById(Number(slotId)); } catch (_) {}
    if (!slot) { log("✋ Slot " + slotId + " not loaded — open the Academy hub (that category) first.", "warn"); return null; }
    const players = clubPlayers();
    const byRf = {};
    let tested = 0, eligible = 0, threw = 0;
    players.forEach((it) => {
      if (typeof it.canApplyTo !== "function") return;
      tested++;
      let ok = false;
      try { ok = !!it.canApplyTo(slot); } catch (_) { threw++; return; }
      if (ok) { eligible++; const rf = it.rareflag; (byRf[rf] = byRf[rf] || { rf, name: rarityName(it), count: 0 }).count++; }
    });
    const res = Object.values(byRf).sort((a, b) => b.count - a.count);
    log(`canApplyTo(${slotId}): ${eligible}/${tested} eligible across ${res.length} rarities${threw ? " (" + threw + " errored)" : ""}.`, "head");
    console.log("[FCEvo] eligible rarities for slot " + slotId + ":\n" + res.map((r) => `${r.rf}\t${r.name}\t×${r.count}`).join("\n") + "\n\nids: " + JSON.stringify(res.map((r) => r.rf)));
    return res;
  }
  const isGKItem = (it) => { try { return !!it.isGK(); } catch (_) { return false; } };
  // Player's role groups from current positions (preferred first, then alts), deduped.
  function playerPositionGroups(it) {
    let ids = null;
    try { if (Array.isArray(it.possiblePositions)) ids = it.possiblePositions; } catch (_) {}
    if (!ids) { try { ids = it.getBasePossiblePositions(); } catch (_) {} }
    ids = ids || [];
    const groups = [];
    [it.preferredPosition].concat(ids).forEach((id) => {
      if (id == null) return;
      const g = POS_GROUP[id];
      if (g && !groups.includes(g)) groups.push(g);
    });
    return groups;
  }
  const numBasic = (it) => { try { return it.getNumBasicPlayStyles(); } catch (_) { return null; } };
  const numPlus = (it) => { try { return it.getNumPlusPlayStyles(); } catch (_) { return null; } };
  function hasEvo(it, evo) {
    const t = evo.r - TRAIT_OFFSET;
    try { return evo.kind === "PS+" ? !!it.hasPlusPlayStyle(t) : !!it.hasBasePlayStyle(t); } catch (_) { return false; }
  }
  const evoTrait = (evo) => evo.r - TRAIT_OFFSET;
  const iconClass = (kindIsPlus, traitId) => (kindIsPlus ? "icon_icontrait" : "icon_basetrait") + traitId;
  function currentPlayStyles(it) { try { return it.getPlayStyles() || []; } catch (_) { return []; } }
  // Distinct rarities present in the club: [{rf, name, count}]
  function clubRarities() {
    const m = new Map();
    clubPlayers().forEach((it) => {
      const rf = it.rareflag;
      if (!m.has(rf)) m.set(rf, { rf, name: rarityName(it), count: 0 });
      m.get(rf).count++;
    });
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
  }
  const rarityAllowed = (it) => !state.rarities.size || state.rarities.has(it.rareflag);

  // ==========================================================================
  // UI
  // ==========================================================================
  let els = {}, tab = "PS+", filter = "", searchQ = "";

  function css() {
    const s = document.createElement("style");
    s.textContent = `
    #fcevo{position:fixed;top:54px;right:16px;width:360px;max-height:90vh;z-index:2147483647;background:#0f141a;color:#e7edf3;
      font:12px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;border:1px solid #2a3b4d;border-radius:11px;box-shadow:0 10px 34px rgba(0,0,0,.55);display:flex;flex-direction:column;overflow:hidden}
    #fcevo *{box-sizing:border-box}
    #fcevo select,#fcevo input{min-width:0}
    #fcevo header{display:flex;align-items:center;gap:8px;padding:9px 11px;background:#15202b;cursor:move;user-select:none}
    #fcevo header b{font-size:13px}#fcevo header .sp{flex:1}
    #fcevo header button{background:#223040;color:#cfe;border:0;border-radius:5px;padding:3px 8px;cursor:pointer}
    #fcevo .body{padding:10px;overflow:auto;display:flex;flex-direction:column;gap:9px}
    #fcevo.min .body{display:none}
    #fcevo input,#fcevo select{background:#0a0f14;border:1px solid #2a3b4d;color:#e7edf3;border-radius:6px;padding:5px 7px}
    #fcevo input[type=text]{width:100%}
    #fcevo .row{display:flex;gap:6px;align-items:center}
    #fcevo .sec{background:#0b1117;border:1px solid #1e2b38;border-radius:9px;padding:8px}
    #fcevo .sec h4{margin:0 0 6px;font-size:11px;color:#7fb4e6;text-transform:uppercase;letter-spacing:.04em}
    #fcevo .results{display:flex;flex-direction:column;gap:4px;margin-top:6px}
    #fcevo .rarpanel{display:none;flex-direction:column;gap:3px;margin-top:6px;max-height:240px;overflow:auto;padding:6px;background:#0a0f14;border:1px solid #233140;border-radius:7px}
    #fcevo .rarpanel.open{display:flex}
    #fcevo .rarpanel label{display:flex;align-items:center;gap:6px;font-size:11px;padding:3px 4px;border-radius:5px;cursor:pointer}
    #fcevo .rarpanel label:hover{background:#13202c}
    #fcevo .rarpanel label .rc{margin-left:auto;color:#7c8b99;font-size:10px}
    #fcevo .pr{display:flex;align-items:center;gap:8px;padding:5px 7px;border:1px solid #20303f;border-radius:7px;cursor:pointer;background:#0d141b}
    #fcevo .pr:hover{background:#13202c}
    #fcevo .pr .ov{font-weight:800;color:#ffd27d;min-width:24px;text-align:center}
    #fcevo .pr .nm{flex:1}#fcevo .pr .rr{font-size:10px;color:#9fb6c9}
    #fcevo .pr .gk{font-size:9px;color:#9adcff;border:1px solid #2c5872;border-radius:4px;padding:0 4px}
    #fcevo .card{display:flex;gap:10px;align-items:center}
    #fcevo .card .ov{font:800 20px/1 system-ui;color:#ffd27d;min-width:40px;text-align:center}
    #fcevo .card .meta{flex:1}
    #fcevo .card .meta .pn{font-weight:700;font-size:13px}
    #fcevo .caps{display:flex;gap:8px;margin-top:7px}
    #fcevo .cap{flex:1;background:#0d141b;border:1px solid #20303f;border-radius:7px;padding:5px 8px;text-align:center}
    #fcevo .cap b{font-size:15px}#fcevo .cap.full b{color:#ff7a6b}#fcevo .cap small{color:#8aa0b2;display:block}
    #fcevo .tabs{display:flex;gap:6px}
    #fcevo .tabs button{flex:1;background:#1b2733;border:1px solid #2a3b4d;color:#bcd;border-radius:7px;padding:6px;cursor:pointer}
    #fcevo .tabs button.on{background:#2d6cdf;color:#fff;border-color:#2d6cdf}
    #fcevo .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
    #fcevo .ec{position:relative;background:#0d141b;border:1px solid #233444;border-radius:9px;padding:7px 6px;cursor:pointer;text-align:center;transition:.08s}
    #fcevo .ec:hover{border-color:#3a6ea5}
    #fcevo .ec.sel{background:#15314f;border-color:#3d8bff;box-shadow:0 0 0 1px #3d8bff inset}
    #fcevo .ec.owned{opacity:.45}
    #fcevo .ec.dis{opacity:.3;cursor:not-allowed}
    #fcevo .ec .ico{width:36px;height:36px;margin:0 auto 4px;border-radius:50%;display:flex;align-items:center;justify-content:center;
      background:#1d2c3a;color:#dbe7f0;border:1px solid #2c4358}
    #fcevo .ec.psp .ico{background:linear-gradient(160deg,#3a2c00,#6b5100);color:#ffe08a;border-color:#7d6320}
    #fcevo .ec .ico i{font-family:'UltimateTeam-Icons',sans-serif;font-style:normal;font-weight:400;font-size:21px;line-height:1}
    #fcevo .psrow{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
    #fcevo .psrow .chip{width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;background:#0d141b;border:1px solid #243140;color:#cfe}
    #fcevo .psrow .chip.ic{background:linear-gradient(160deg,#3a2c00,#6b5100);color:#ffe08a;border-color:#7d6320}
    #fcevo .psrow .chip i{font-family:'UltimateTeam-Icons',sans-serif;font-style:normal;font-weight:400;font-size:15px;line-height:1}
    #fcevo .ec .nm{font-size:10px;line-height:1.15;color:#dbe7f0}
    #fcevo .ec .tag{position:absolute;top:3px;right:4px;font-size:8px;color:#9adcff}
    #fcevo .ec .own{position:absolute;top:3px;left:4px;font-size:10px;color:#67e08a}
    #fcevo .opts{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
    #fcevo .go{background:#2f9e51;color:#fff;border:0;border-radius:8px;padding:9px;cursor:pointer;font-weight:800}
    #fcevo .go:disabled{opacity:.5}#fcevo .stop{background:#c0392b}
    #fcevo .mini{background:#223040;color:#cfe;border:0;border-radius:6px;padding:6px 9px;cursor:pointer}
    #fcevo .status{font-size:11px;color:#9fb6c9;padding:2px 2px 0;min-height:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #fcevo .status.ok{color:#67e08a}#fcevo .status.err{color:#ff7a6b}#fcevo .status.warn{color:#ffcf6b}#fcevo .status.head{color:#8fd6ff}#fcevo .status.dim{color:#7c8b99}
    #fcevo .count{color:#8fd6ff;font-weight:700}#fcevo .muted{color:#7c8b99}
    #fcevo .clubstat{margin-top:6px;padding:5px 7px;border-radius:6px;font-size:11px;background:#0d141b;border:1px solid #233140;cursor:pointer}
    #fcevo .clubstat.load{color:#ffcf6b;border-color:#5a4a1f}#fcevo .clubstat.ok{color:#67e08a;border-color:#1f5a36}#fcevo .clubstat.err{color:#ff7a6b;border-color:#5a2420}
    `;
    document.head.appendChild(s);
  }

  function build() {
    css();
    const root = document.createElement("div");
    root.id = "fcevo";
    root.innerHTML = `
      <header><b>🧬 PlayStyle Evo Helper</b><span class="sp"></span><button data-act="min">–</button></header>
      <div class="body">
        <div class="sec">
          <h4>1 · Pick player from club</h4>
          <div class="row">
            <input type="text" id="fcevo-search" placeholder="search club by name…">
            <button class="mini" data-act="rar" id="fcevo-rarbtn">Rarity: all ▾</button>
          </div>
          <div class="rarpanel" id="fcevo-rarpanel"></div>
          <div class="clubstat" id="fcevo-clubstat" data-act="reloadclub" title="Click to reload the club">Club: waiting for app…</div>
          <div class="results" id="fcevo-results"></div>
        </div>

        <div class="sec" id="fcevo-preview" style="display:none"></div>

        <div class="sec">
          <h4>2 · Choose evolutions</h4>
          <div class="tabs">
            <button data-tab="PS+">PlayStyle+ (36)</button>
            <button data-tab="PS">PlayStyle (36)</button>
          </div>
          <div class="row" style="margin-top:7px">
            <select id="fcevo-pos" style="flex:1"></select>
            <select id="fcevo-role" style="flex:1.3"></select>
            <button class="mini" data-act="suggest" title="Preselect this role's playstyles (top 3 as PS+). You can then tweak.">✨ Suggest</button>
          </div>
          <div class="row" style="margin:7px 0">
            <input type="text" id="fcevo-filter" placeholder="filter evolutions…">
            <button class="mini" data-act="none">Clear</button>
          </div>
          <div class="grid" id="fcevo-grid"></div>
        </div>

        <div class="opts">
          <label title="Add the player to each slot, then claim/finish it so the PlayStyle is locked in."><input type="checkbox" id="fcevo-claim" checked> claim &amp; finish</label>
          <label>delay <input type="number" id="fcevo-delay" value="500" min="200" step="100" style="width:60px"></label>
          <span class="sp"></span><span class="count" id="fcevo-count">0 selected</span>
        </div>
        <div class="row">
          <button class="go" data-act="run" style="flex:1">Apply selected</button>
          <button class="go stop" data-act="stop" style="display:none;flex:1">Stop</button>
        </div>
        <div class="status" id="fcevo-status">Ready.</div>
      </div>`;
    document.body.appendChild(root);
    els = {
      root, results: q("#fcevo-results"), preview: q("#fcevo-preview"), grid: q("#fcevo-grid"),
      count: q("#fcevo-count"), status: q("#fcevo-status"), run: q('[data-act="run"]'), stop: q('[data-act="stop"]'),
      claim: q("#fcevo-claim"), delay: q("#fcevo-delay"),
      rarbtn: q("#fcevo-rarbtn"), rarpanel: q("#fcevo-rarpanel"), clubstat: q("#fcevo-clubstat"),
      pos: q("#fcevo-pos"), role: q("#fcevo-role"),
    };
    function q(s) { return root.querySelector(s); }

    root.addEventListener("click", onClick);
    q("#fcevo-search").addEventListener("input", (e) => { searchQ = e.target.value.trim().toLowerCase(); renderResults(); });
    q("#fcevo-filter").addEventListener("input", (e) => { filter = e.target.value.toLowerCase(); renderGrid(); });
    els.pos.addEventListener("change", populateRoles);
    populatePositions();
    makeDraggable(root, root.querySelector("header"));
    setTab("PS+");
    // Default the club-search filter to the evos' eligible rarities.
    if (ELIGIBLE_RARITIES && ELIGIBLE_RARITIES.length) {
      ELIGIBLE_RARITIES.forEach((id) => state.rarities.add(id));
      els.rarbtn.textContent = "Rarity: " + state.rarities.size + " ▾";
    }
    log("Ready. " + (ACAD() ? "Academy connected, " + clubPlayers().length + " club players." : "Waiting for Academy…"), "head");
    if (ELIGIBLE_RARITIES.length) log("Search limited to " + ELIGIBLE_RARITIES.length + " eligible rarities (adjust via Rarity ▾).", "dim");
  }

  function onClick(e) {
    const act = e.target.getAttribute("data-act");
    const t = e.target.getAttribute("data-tab");
    if (t) return setTab(t);
    if (act === "min") return els.root.classList.toggle("min");
    if (act === "reloadclub") return startClubLoad(1, true);
    if (act === "rar") return toggleRarPanel();
    if (act === "suggest") return suggest();
    if (act === "none") { current().forEach((x) => state.selected.delete(x.s)); return (renderGrid(), updateCount()); }
    if (act === "run") return runBatch([...state.selected], { delayMs: +els.delay.value, claim: els.claim.checked });
    if (act === "stop") state.abort = true;
  }

  const current = () => (tab === "PS+" ? PSP : PS);
  function setTab(t) { tab = t; els.root.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("on", b.getAttribute("data-tab") === t)); renderGrid(); }

  // ---- rarity multi-select ----
  function toggleRarPanel() {
    const open = els.rarpanel.classList.toggle("open");
    if (open && !els.rarpanel.dataset.built) renderRarPanel();
  }
  // All rarities (full map ∪ club ids), with club counts, sorted by name.
  function allRaritiesList() {
    const counts = {};
    clubPlayers().forEach((it) => { counts[it.rareflag] = (counts[it.rareflag] || 0) + 1; });
    const ids = new Set([...Object.keys(RARITIES).map(Number), ...Object.keys(counts).map(Number)]);
    return [...ids].map((id) => ({ rf: id, name: RARITIES[id] || ("Rarity " + id), count: counts[id] || 0 }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  function renderRarPanel() {
    const rs = allRaritiesList();
    els.rarpanel.dataset.built = "1";
    els.rarpanel.innerHTML =
      `<label style="font-weight:700"><input type="checkbox" id="fcevo-rarall" ${state.rarities.size ? "" : "checked"}> all rarities</label>` +
      rs.map((r) => `<label><input type="checkbox" data-rf="${r.rf}" ${state.rarities.has(r.rf) ? "checked" : ""}> ${esc(r.name)}<span class="rc">${r.count ? "×" + r.count : ""}</span></label>`).join("");
    els.rarpanel.querySelectorAll("input").forEach((cb) => cb.addEventListener("change", onRarChange));
  }
  function onRarChange(e) {
    const cb = e.target;
    if (cb.id === "fcevo-rarall") {
      if (cb.checked) state.rarities.clear();
      renderRarPanel();
    } else {
      const rf = Number(cb.dataset.rf);
      cb.checked ? state.rarities.add(rf) : state.rarities.delete(rf);
      const all = els.rarpanel.querySelector("#fcevo-rarall");
      if (all) all.checked = state.rarities.size === 0;
    }
    els.rarbtn.textContent = "Rarity: " + (state.rarities.size ? state.rarities.size + " ▾" : "all ▾");
    renderResults();
  }

  // ---- player results ----
  function renderResults() {
    const box = els.results; box.innerHTML = "";
    if (!searchQ) { box.innerHTML = '<div class="muted" style="padding:4px">Type a name to search your club…</div>'; return; }
    const matches = clubPlayers().filter((it) => rarityAllowed(it) && playerName(it).toLowerCase().includes(searchQ));
    matches.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (!matches.length) { box.innerHTML = '<div class="muted" style="padding:4px">No matches.</div>'; return; }
    matches.slice(0, 18).forEach((it) => {
      const row = document.createElement("div");
      row.className = "pr";
      const gk = (() => { try { return it.isGK(); } catch (_) { return false; } })();
      row.innerHTML = `<span class="ov">${it.rating ?? "?"}</span><span class="nm">${esc(playerName(it))}</span>
        ${gk ? '<span class="gk">GK</span>' : ""}<span class="rr">${esc(rarityName(it))} · ${it.id}</span>`;
      row.addEventListener("click", () => selectPlayer(it));
      box.appendChild(row);
    });
    if (matches.length > 18) box.insertAdjacentHTML("beforeend", `<div class="muted" style="padding:4px">+${matches.length - 18} more — refine search</div>`);
  }

  function selectPlayer(it) {
    state.item = it;
    state.selected.clear();
    populatePositions(); // now restricted to this player's positions, preferred first
    renderPreview(); renderGrid(); updateCount();
    const pos = playerPositionGroups(it).join(", ") || "?";
    log("🎯 Selected " + playerName(it) + " (" + it.rating + ") · " + pos + " · " + it.id, "head");
  }

  // ---- role-based suggestion ----
  function populatePositions() {
    if (state.item) {
      const groups = playerPositionGroups(state.item);
      const list = groups.length ? groups : Object.keys(ROLES);
      els.pos.innerHTML = list.map((p) => `<option>${esc(p)}</option>`).join("");
    } else {
      els.pos.innerHTML = '<option value="">position…</option>' + Object.keys(ROLES).map((p) => `<option>${esc(p)}</option>`).join("");
    }
    populateRoles();
  }
  function populateRoles() {
    const pos = els.pos.value;
    const rs = pos && ROLES[pos] ? Object.keys(ROLES[pos]) : [];
    els.role.innerHTML = '<option value="">role…</option>' + rs.map((r) => `<option>${esc(r)}</option>`).join("");
  }
  function suggest() {
    if (!state.item) return log("✋ Select a player first.", "warn");
    const pos = els.pos.value, role = els.role.value;
    if (!pos || !role || !ROLES[pos] || !ROLES[pos][role]) return log("✋ Pick a position and role.", "warn");
    const it = state.item, gk = isGKItem(it);
    let plusUsed = numPlus(it) ?? 0, baseUsed = numBasic(it) ?? 0, added = 0, owned = 0;
    const skip = [];
    state.selected.clear();
    ROLES[pos][role].forEach((name, idx) => {
      const wantPlus = idx < 3; // top 3 -> PS+
      const evo = wantPlus ? pspByName[name] : psByName[name];
      if (!evo) { skip.push(name); return; }
      if (evo.g && !gk) { skip.push(name + " (GK-only)"); return; }
      if (hasEvo(it, evo)) { owned++; return; } // already has it
      if (wantPlus) { if (plusUsed >= CAP_PLUS) { skip.push(name + "+ (no room)"); return; } plusUsed++; }
      else { if (baseUsed >= CAP_BASIC) { skip.push(name + " (no room)"); return; } baseUsed++; }
      state.selected.add(evo.s);
      added++;
    });
    setTab(idxTab());
    renderGrid(); updateCount();
    log(`✨ ${pos} · ${role}: preselected ${added}${owned ? `, ${owned} already owned` : ""}${skip.length ? `, skipped ${skip.length}` : ""}. Tweak freely, then Apply.`, "head");
    if (skip.length) log("   skipped: " + skip.join(", "), "dim");
  }
  function idxTab() { // show the tab that has the most selected, default PS+
    const selPlus = [...state.selected].filter((s) => byId(s) && byId(s).kind === "PS+").length;
    return selPlus >= state.selected.size - selPlus ? "PS+" : "PS";
  }

  function renderPreview() {
    const box = els.preview;
    if (!state.item) { box.style.display = "none"; return; }
    const it = state.item;
    const gk = (() => { try { return it.isGK(); } catch (_) { return false; } })();
    const nb = numBasic(it), np = numPlus(it);
    const basicFull = nb != null && nb >= CAP_BASIC, plusFull = np != null && np >= CAP_PLUS;
    box.style.display = "";
    box.innerHTML = `
      <div class="card">
        <div class="ov">${it.rating ?? "?"}</div>
        <div class="meta">
          <div class="pn">${esc(playerName(it))} ${gk ? '<span class="gk" style="font-size:10px;color:#9adcff">GK</span>' : ""}</div>
          <div class="muted">${esc(rarityName(it))} · item ${it.id}</div>
        </div>
      </div>
      <div class="caps">
        <div class="cap ${plusFull ? "full" : ""}"><b>${np ?? "?"}/${CAP_PLUS}</b><small>PS+ used</small></div>
        <div class="cap ${basicFull ? "full" : ""}"><b>${nb ?? "?"}/${CAP_BASIC}</b><small>Basic used</small></div>
      </div>
      <div class="psrow">${currentPlayStyles(it).map((p) => {
        const nm = traitName[p.traitId] || ("trait " + p.traitId);
        return `<div class="chip ${p.isIcon ? "ic" : ""}" title="${esc(nm)}${p.isIcon ? "+" : ""}"><i class="${iconClass(p.isIcon, p.traitId)}"></i></div>`;
      }).join("") || '<span class="muted">no playstyles</span>'}</div>`;
  }

  // ---- evo grid ----
  function renderGrid() {
    const box = els.grid; box.innerHTML = "";
    const it = state.item;
    const gkPlayer = it ? (() => { try { return it.isGK(); } catch (_) { return false; } })() : null;
    current().filter((x) => !filter || x.n.toLowerCase().includes(filter)).forEach((evo) => {
      const owned = it ? hasEvo(it, evo) : false;
      // GK-exclusive evos (g=1) need a GK; "any player" evos (g=0) are open to all (incl. GKs)
      const wrongScope = it ? (!!evo.g && !gkPlayer) : false;
      const dis = wrongScope || owned; // owned -> not selectable (would 460)
      const sel = state.selected.has(evo.s);
      const card = document.createElement("div");
      card.className = "ec" + (evo.kind === "PS+" ? " psp" : "") + (sel ? " sel" : "") + (owned ? " owned" : "") + (dis ? " dis" : "");
      card.title = (wrongScope ? "GK-only evo — needs a goalkeeper. " : "") + (owned ? "Player already has this PlayStyle. " : "");
      card.innerHTML = `<div class="ico"><i class="${iconClass(evo.kind === "PS+", evoTrait(evo))}"></i></div><div class="nm">${esc(evo.n.replace(/\+$/, ""))}</div>
        <span class="tag">${evo.kind === "PS+" ? "+" : ""}</span>${owned ? '<span class="own">✓</span>' : ""}`;
      if (!dis) card.addEventListener("click", () => toggleEvo(evo, card));
      box.appendChild(card);
    });
  }

  function counterpart(evo) { return ALL.find((x) => x.r === evo.r && x.kind !== evo.kind); }
  function toggleEvo(evo, card) {
    const on = !state.selected.has(evo.s);
    if (on) {
      if (!checkCap(evo)) return;
      // base & + of the same playstyle are mutually exclusive
      const cp = counterpart(evo);
      if (cp && state.selected.has(cp.s)) {
        state.selected.delete(cp.s);
        log(`↔ Replaced ${cp.n} with ${evo.n} (same PlayStyle).`, "dim");
      }
      state.selected.add(evo.s);
    } else {
      state.selected.delete(evo.s);
    }
    card.classList.toggle("sel", on);
    updateCount();
  }

  function checkCap(evo) {
    if (!state.item) return true;
    const it = state.item;
    if (evo.kind === "PS+") {
      const used = numPlus(it) ?? 0;
      const selPlus = [...state.selected].filter((s) => { const e = byId(s); return e && e.kind === "PS+"; }).length;
      if (used + selPlus >= CAP_PLUS) { log(`✋ PS+ cap: player has ${used}/${CAP_PLUS}, ${selPlus} queued. No room.`, "warn"); return false; }
    } else {
      const used = numBasic(it) ?? 0;
      const selB = [...state.selected].filter((s) => { const e = byId(s); return e && e.kind === "PS"; }).length;
      if (used + selB >= CAP_BASIC) { log(`✋ Basic cap: player has ${used}/${CAP_BASIC}, ${selB} queued. No room.`, "warn"); return false; }
    }
    return true;
  }

  function updateCount() {
    const selPlus = [...state.selected].filter((s) => byId(s) && byId(s).kind === "PS+").length;
    const selB = state.selected.size - selPlus;
    els.count.textContent = `${state.selected.size} selected (${selPlus} PS+, ${selB} PS)`;
  }

  function setRunning(on) { els.run.disabled = on; els.stop.style.display = on ? "" : "none"; els.run.style.display = on ? "none" : ""; }

  // Single-line status (latest message only). Full history goes to the console.
  function log(msg, cls) {
    if (els.status) { els.status.textContent = msg; els.status.className = "status " + (cls || ""); }
    (cls === "err" ? console.error : cls === "warn" ? console.warn : console.log)("[FCEvo]", msg);
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const initials = (n) => n.replace(/\+$/, "").split(/\s+/).map((w) => w[0]).join("").slice(0, 3).toUpperCase();

  function makeDraggable(el, handle) {
    let sx, sy, ox, oy, drag = false;
    handle.addEventListener("mousedown", (e) => {
      if (e.target.tagName === "BUTTON") return;
      drag = true; sx = e.clientX; sy = e.clientY;
      const r = el.getBoundingClientRect(); ox = r.left; oy = r.top;
      el.style.right = "auto"; el.style.left = ox + "px"; el.style.top = oy + "px"; e.preventDefault();
    });
    window.addEventListener("mousemove", (e) => { if (drag) { el.style.left = ox + e.clientX - sx + "px"; el.style.top = oy + e.clientY - sy + "px"; } });
    window.addEventListener("mouseup", () => (drag = false));
  }

  // --- boot -----------------------------------------------------------------
  function boot() {
    let tries = 0;
    const iv = setInterval(() => {
      tries++;
      if (ACAD() && CLUB()) {
        clearInterval(iv);
        if (!document.getElementById("fcevo")) build();
        window.FCEvo = { applyEvo, claimEvo, runBatch, state, PS, PSP, clubPlayers, selectPlayer, scrapeRarities, clubRaritiesDump, eligibleRarities, loadClub, startClubLoad };
        // Wait until the active squad is loaded (app ready for club searches), then
        // load the club. Hard fallback at 15s so it can't hang; retries cover the rest.
        setClubStatus("Club: waiting for squad…", "load");
        let waited = 0;
        const checkSquad = () => {
          if (squadReady() || waited >= 15000) { clearInterval(gate); startClubLoad(1); return; }
          waited += 200;
        };
        const gate = setInterval(checkSquad, 200);
        checkSquad(); // check immediately, don't wait for the first interval
      } else if (tries > 160) { clearInterval(iv); if (!document.getElementById("fcevo")) build(); log("⚠ Academy/club not ready. Open the app & your Club tab.", "warn"); }
    }, 500);
  }
  if (document.readyState !== "loading") boot(); else window.addEventListener("DOMContentLoaded", boot);
})();
