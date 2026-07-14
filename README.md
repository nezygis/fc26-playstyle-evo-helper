# PlayStyle Evo Helper (EA FC 26)

Batch-apply PlayStyle / PlayStyle+ evolutions on the EA FC 26 web app — one
player or a whole squad at once, instead of EA's one-at-a-time UI.

https://github.com/user-attachments/assets/df5194ad-1511-4275-a000-de6d88d38d8a

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) and enable userscripts
   in your browser (Chrome/Edge: turn on **Developer mode** in
   `chrome://extensions`, or Tampermonkey → Settings → **Allow User Scripts** —
   [guide](https://www.tampermonkey.net/faq.php?locale=en&q=Q209)).
2. Click **[install the script](https://raw.githubusercontent.com/nezygis/fc26-playstyle-evo-helper/main/fc26-playstyle-evo-helper.user.js)** → **Install**.
3. Open the FC 26 web app — a floating **Evo Helper** panel appears.

No extension? Paste this as a bookmark URL and click it on the web app instead:

```
javascript:(function(){fetch('https://raw.githubusercontent.com/nezygis/fc26-playstyle-evo-helper/main/fc26-playstyle-evo-helper.user.js?t='+Date.now()).then(r=>r.text()).then(t=>{var s=document.createElement('script');s.textContent=t;document.body.appendChild(s);});})();
```

## License

[MIT](LICENSE) — credit **nezygis** and link back to this project.

## ⚠️ Disclaimer

Automating the EA FC web app is against EA's Terms of Service and can get your
account banned. Use at your own risk. Unofficial fan tool, not affiliated with EA.
