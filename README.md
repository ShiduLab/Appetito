# Appetito

PWA mobile-first di ShiduLab.
https://shidulab.github.io/Appetito/

**Idea:** hai fame, non sai cucinare o hai poco in casa. Scrivi ciò che vedi nel frigo, nella dispensa e tra le spezie. Appetito prova a restituire:

- ricette del ricettario locale che puoi fare subito;
- ricette alle quali manca poco;
- modalità **Ho fame ORA** per privilegiare tempi brevi e ingredienti già presenti;
- modalità **Non buttare niente** per dare priorità agli alimenti che vuoi consumare;
- modalità **Ingegno** per proporre esperimenti plausibili con ciò che c'è.

L'interfaccia usa volutamente istruzioni semplici: non presume che chi la usa sappia cosa significhi "far appassire", "mantecare" o altri verbi da ricettario.

## Privacy e funzionamento

Questa build lavora interamente nel browser. Il ricettario e il motore di abbinamento sono locali; non è richiesto un server per analizzare ciò che inserisci. Lo stato di frigo/dispensa viene salvato in `localStorage` sul dispositivo.

Dopo il primo caricamento la PWA può funzionare offline grazie al service worker.

## Pubblicazione con GitHub Pages

La web app è già contenuta nella cartella `/docs`.

Per pubblicarla:

`Settings → Pages → Deploy from a branch → main → /docs`

L'indirizzo sarà del tipo:

`https://shidulab.github.io/Appetito/`

## Struttura

```text
Appetito/
├─ README.md
└─ docs/
   ├─ index.html
   ├─ styles.css
   ├─ app.js
   ├─ engine.js
   ├─ recipes.js
   ├─ manifest.webmanifest
   ├─ sw.js
   └─ assets/
   ├─ appetito-avatar.png
   ├─ appetito-192.png
   ├─ appetito-512.png
   └─ botolo.png
```

## Nota

Appetito è un utensile domestico, non un servizio medico o nutrizionale. Chi cucina deve controllare allergie, conservazione e corretta cottura degli alimenti.

**ShiduLab — 2026**  
Contatto: ShiduLab@gmail.com
