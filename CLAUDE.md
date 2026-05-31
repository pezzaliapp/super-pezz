# Super Pezz — Piano di sviluppo

Platform/adventure 2D con protagonista **Pezz**, pensato per essere
**provato facilmente** da chiunque: si apre un link nel browser, anche su
iPhone (Safari), senza installazioni né account.

## Scelte tecniche (il "perché")

- **Phaser 3 + TypeScript + Vite.** Engine 2D maturo, tutto-codice (niente
  editor separato), iterazione in secondi, build statico.
- **Web come piattaforma primaria.** Niente account Apple, niente Xcode,
  niente App Store. Si pubblica gratis su **itch.io** caricando uno zip.
  Funziona su desktop (tastiera) e mobile (touch).
- **Pixel-art generata via codice** (`src/gfx/`). Ogni sprite è una griglia
  di caratteri + palette: zero file binari, tutto versionabile e modificabile.
  Si sostituirà con sprite/PNG veri quando vorremo curare l'estetica.
- **Apple Silicon (M5):** usato solo per sviluppare; il gioco gira nel browser
  del destinatario, quindi la potenza del Mac non è un vincolo.

## Struttura del progetto

```
index.html              # contenitore + meta per mobile (no-zoom, fullscreen)
vite.config.ts          # base './' (necessario per itch.io), dev server in LAN
src/
  main.ts               # config Phaser (scale FIT, physics arcade, scene)
  scenes/
    PreloadScene.ts     # genera le texture, poi avvia il gioco
    GameScene.ts        # livello, fisica, nemici, monete, HUD, win/lose
  objects/
    Player.ts           # Pezz: movimento, salto, squash&stretch, rimbalzo
  ui/
    TouchControls.ts    # pulsanti on-screen ◀ ▶ SALTA (solo su touch)
  gfx/
    pixels.ts           # generatore texture da griglia di caratteri
    sprites.ts          # definizioni pixel-art (Pezz, nemico, moneta, ecc.)
```

## Comandi

- `npm run dev` — sviluppo con hot-reload. URL locale:
  `http://localhost:5173/super-pezz/` (sottocartella per via della `base`).
  Espone anche l'IP di LAN: apri `http://<ip-mac>:5173/super-pezz/` da Safari
  su iPhone per provare sul telefono vero.
- `npm run build` — typecheck + build di produzione in `dist/`.
- `npm run preview` — anteprima del build.

## Pubblicazione: GitHub Pages (automatica)

- Repo: <https://github.com/pezzaliapp/super-pezz>
- URL pubblico: <https://pezzaliapp.github.io/super-pezz/>
- `vite.config.ts` ha `base: '/super-pezz/'` (necessario per la sottocartella).
- La GitHub Action `.github/workflows/deploy.yml` builda e pubblica a ogni
  `push` su `main`. Su GitHub serve impostare una volta:
  **Settings → Pages → Source = GitHub Actions**.

## Stato attuale (MVP v0.1)

Funziona: movimento + salto, livello con piattaforme e dislivelli, 3 buchi
mortali, monete ("pezzi") da raccogliere, 3 nemici che pattugliano (schiacciabili
saltandoci sopra), vite, traguardo con bandiera, schermate vinci/perdi e
restart, HUD, controlli touch + tastiera, camera che segue.

## Roadmap (prossimi passi)

1. **Estetica:** sostituire la pixel-art generata con sprite/animazioni vere
   (camminata, salto), parallax di sfondo più ricco.
2. **Audio:** salto, raccolta moneta, musica di sottofondo (WebAudio/Howler).
3. **Animazioni:** frame multipli per Pezz e nemici (spritesheet generato).
4. **Livelli:** più livelli + sistema di transizione; eventualmente Tiled
   per editare le mappe.
5. **Feel:** coyote-time e jump-buffer per un salto più "perdonante".
6. **Persistenza:** salvataggio record/monete in `localStorage`.
7. **Pubblicazione:** primo upload su itch.io e test reale su iPhone.

## Convenzioni

- Codice in inglese, commenti brevi in italiano dove aiutano.
- Niente asset binari finché la pixel-art generata basta: tutto resta diff-abile.
- Risoluzione logica fissa 960×540, scale `FIT` → si adatta a ogni schermo.
