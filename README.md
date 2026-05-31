# Super Pezz 🟢

Un piccolo platform/adventure 2D con protagonista **Pezz**, giocabile nel
browser — desktop e iPhone (Safari) — senza installare nulla.

## Come si gioca

- **Desktop:** ← → per muoverti, **↑** o **Spazio** per saltare.
- **Mobile:** pulsanti a schermo ◀ ▶ e ⤒ (salto).
- Raccogli tutti i **pezzi** (monete gialle), salta sui nemici per
  schiacciarli, evita i buchi e raggiungi la **bandiera** in fondo.

## Avvio in locale

```bash
npm install
npm run dev
```

Apri `http://localhost:5173/super-pezz/` (nota la sottocartella: la `base`
di Vite è impostata per GitHub Pages). Per provarlo **sull'iPhone vero**,
sullo stesso Wi-Fi apri l'indirizzo `Network` mostrato nel terminale, es.
`http://192.168.1.x:5173/super-pezz/`, da Safari.

## Pubblicazione

Online su **GitHub Pages**: <https://pezzaliapp.github.io/super-pezz/>

Il deploy è automatico — a ogni `push` su `main`, la GitHub Action in
`.github/workflows/deploy.yml` builda e pubblica. Vedi `CLAUDE.md`.

---
Stack: [Phaser 3](https://phaser.io) · TypeScript · [Vite](https://vitejs.dev).
Grafica pixel-art generata via codice (`src/gfx/`).
