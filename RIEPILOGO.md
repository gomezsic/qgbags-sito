# QG Bags — nuovo sito V2: riepilogo

Aggiornato al 24 novembre 2026, sera.

## Il progetto in breve

Rifacciamo il sito di QG Bags (oggi qgbags.com, tema "Bazar") con un nuovo tema e nuove funzioni:
ricamo personalizzato con anteprima, opzioni di consegna, configuratore delle borse su misura, ordini fuori negozio tutti in Shopify.
Stile ispirato a L/UNIFORM, font Jost, slogan "INTELLIGENZA ARTIGIANALE — Tu immagini. Le nostre mani realizzano."

Regola fissa: **qgbags.com non si tocca**. Tutto si prova sul negozio di sviluppo qgbags-v2 e niente si pubblica senza l'ok di Giacomo.

## Dove siamo arrivati

| Fatto | Dove |
|---|---|
| Piano di sviluppo a step | [Doc "QG Bags V2 — Piano di sviluppo"](https://claude.ai/artifact/D7DFDW6TsQF1QyQWVWh1aY) |
| Tema nuovo (Horizon 4.5.0 + sezioni QG) con foto, film e logo | qgbags-v2, tema "QG V2 bozza A" (non pubblicato) |
| 40 borse vere + prodotto "Ricamo personalizzato" (10 €) | qgbags-v2, Prodotti |
| Collezioni: Le più amate (8), Travel Bag, City Bag, Grace Bag, Beauty e Pochette, Pillola | qgbags-v2, Collezioni |
| Home con prodotti veri ("Le più amate") e schede modello collegate alle collezioni | tema bozza A |
| App ricamo "QG Bags Ricamo V2" installata e funzionante | qgbags-v2, versione qg-bags-ricamo-v2-6 |
| Ricamo nel carrello: borsa + riga "Ricamo personalizzato" 10 € | provato da Giacomo il 24/11 |
| Anteprima del ricamo sulla City modello, filo rosso mattone, al centro tra i manici | provata da Giacomo il 24/11 ("fantastico") |

| Pulsante "Nuovo ordine su misura" in Ordini > Altre azioni (anche in Ordini bozza) | app V2; da approvare i nuovi permessi e provare |

**Step 1 (ricamo): quasi finito.** Manca solo l'anteprima sugli altri modelli.
**Ordini fuori negozio: costruito**, campi allineati al gestionale (`app/qg-bags-ricamo/docs/ordine-su-misura.md`).

## Organizzazione

### Negozi Shopify
- **qgbags.com** — negozio vero, piano Basic. Non si tocca.
- **qgbags-v2.myshopify.com** — negozio di sviluppo (organizzazione Shopify 246546888), protetto da password.
  - Tema di lavoro: **"QG V2 bozza A"** (id 189486727504), non pubblicato.
  - Anteprima: https://qgbags-v2.myshopify.com?preview_theme_id=189486727504
  - Editor: https://admin.shopify.com/store/qgbags-v2/themes/189486727504/editor
  - Prodotto di prova con ricamo: https://qgbags-v2.myshopify.com/products/city-bag-neoprene-blu-72?preview_theme_id=189486727504

### Repository GitHub
- **gomezsic/qgbags-sito** (questo) — tutto il codice del sito nuovo, ramo principale `main`.
  - Cartelle del tema: `sections/` (le sezioni QG si chiamano `qg-*.liquid`), `templates/`, `blocks/`, `snippets/`, `assets/`, `config/`, `layout/`, `locales/`.
  - `templates/index.json` = home; `templates/product.json` = pagina prodotto (con il blocco ricamo).
  - `app/qg-bags-ricamo/` = l'app del ricamo (esclusa dal tema con `.shopifyignore`).
- **gomezsic/bag-configurator** — il configuratore. `main` = nuovo (Archivio, Studio, Prova cliente, pilota Travel Bag), `archivio-lovable` = vecchia versione Lovable.

### App del ricamo
- **QG Bags Ricamo V2** (nuova): organizzazione 246546888, installata su qgbags-v2. Codice in `app/qg-bags-ricamo/`.
  - Blocco "Ricamo QG Bags" in pagina prodotto, tra varianti e pulsanti d'acquisto.
  - Si attiva sui prodotti con tag **"ricamo si"** (maiuscole indifferenti).
  - Font: Corsivo, Stampatello, Compatto. Max 20 caratteri. Prezzo +10 € (variante 54055138754896).
  - Anteprima: `assets/qg-embroidery-preview.js`, foto `assets/qg-modello-city.jpg`. Dall'editor si possono cambiare foto modello, colore filo e zona del ricamo.
  - Rilascio dal Mac: `shopify app deploy --config qg-bags-ricamo-v2 --allow-updates`.
    Il file `shopify.app.qg-bags-ricamo-v2.toml` esiste solo sul Mac (non nel repo).
- **QG Bags Ricamo** (vecchia): è quella di qgbags.com (organizzazione 61388379). Non va mai rilasciata da qui.
- Codice originale fatto con Codex: `~/Documents/Codex/2026-06-13/sono-su-shopify-e-vendop-borse` (non modificare).

### Cartelle sul Mac (`~/Claude_progetti/Bags`)
- `qgbags-sito-repo/` — copia di lavoro del repo qgbags-sito.
- `prova-qgbags-v2/prodotti-selezione-v2.csv` — le 40 borse + ricamo importate su qgbags-v2. **Non importare** il vecchio `prodotti-prova.csv` (ricamo a 15 €).
- Piano V2 originale, export di tema e prodotti di qgbags.com, foto e video.

### File del progetto (cartella condivisa)
- `sito-v2/bozza-home-A/` — copia della bozza home scelta.
- `sito-v2/ricamo/` — immagini delle anteprime del ricamo.
- `sito-v2/RIEPILOGO.md` — questo file.

### Come lavoriamo
- Contenuti (testi, foto, impostazioni) li cambia Giacomo nell'editor Shopify.
- Codice: modifiche piccole su GitHub, subito unite su `main`. Prima di caricare il tema dal repo si scaricano le modifiche fatte nell'editor, altrimenti si perdono.
- Un solo thread di lavoro per il sito.

### Gestionale QGbags (backend ordini e contabilità)
- App Lovable https://qg.lovable.app, database Supabase. Descrizione completa: `app/qg-bags-ricamo/docs/backend-qgbags.md`.
- Oggi nessun collegamento automatico con Shopify: gli ordini entrano dal foglio Ordini (CSV come `ordini_2026-11.csv`) o a mano.
- Regole: il sito non scrive mai nei dati contabili né in `qg_ordini`; il pagamento lo certifica il gestionale; si usano i codici del configuratore.
- Collegamento proposto: webhook Shopify → tabella `qg_shopify_staging` → conferma di Giacomo → `qg_ordini`.
  Per gli ordini su misura "da pagare" serve il webhook alla **creazione** dell'ordine (`orders/create`), non solo `orders/paid`.
- Corrispondenza campi Shopify ↔ colonne del foglio Ordini: `docs/ordine-su-misura.md`.

## Decisioni prese
- Ricamo: 10 €, non allunga i tempi di consegna, colore deciso da QG (nell'anteprima sempre rosso mattone).
- Borsa e ricamo restano due righe collegate nel carrello (piano Basic).
- Anteprima del ricamo: il modello di borsa si sceglie dai tag del prodotto; tag "Grande" = borsa grande (4 modelli: pochette, beauty, borsa, borsa grande).
- Consegna: niente scelta di data o urgenza da parte del cliente.
- Ordini fuori negozio (WhatsApp, telefono, showroom, pezzi fuori catalogo): tutti nell'admin Shopify (ordine manuale, POS, articolo personalizzato) + pulsante "Nuovo ordine su misura" nell'app, tag di provenienza. Il gestionale scaricherà gli ordini da Shopify; basta Excel.

## Prossimi passi
1. **Foto dei modelli** pochette, beauty e borsa grande (fondo bianco, di fronte) per completare l'anteprima del ricamo per tag. Da confermare i nomi esatti dei tag.
2. **Step 2 — Consegna**: opzioni e prezzi di spedizione, ritiro in showroom (indirizzo), giorni per pronta consegna e su misura, blocco "Tempi di consegna" in pagina prodotto (da confermare).
3. **Ordini fuori negozio**: approvare i permessi dell'app e fare un ordine di prova. Poi, nel gestionale, la funzione che legge gli ordini Shopify (webhook → `qg_shopify_staging`), da approvare da Giacomo.
4. **Configuratore pilota** Travel Bag su qgbags-v2: prodotto nascosto, prezzo, tessuti e manici del pilota.
5. **Nuovo video** (atteso il 25/11) da mettere nella home.
6. Ordine di prova completo fino al checkout.
7. Pulizia: prodotto doppio "PILLOLA tessuto arancione + ricamo nero" (handle pillola-tessuto-arancione-1) è in bozza, da eliminare se Giacomo vuole. Alleggerire `qg-embroidery.js` (14,7 KB, Shopify consiglia 10 KB).
8. Poi: catalogo e pagine, configuratore completo, gestionale e lancio.

## Storico delle modifiche al codice (PR su qgbags-sito)
- #1 tema Horizon con sezioni QG · #2 app ricamo nel repo · #3 app adattata a Horizon · #4 tag "ricamo si" senza badare alle maiuscole
- #10 pulsante "Nuovo ordine su misura" allineato al gestionale
- #5 home con collezioni vere e blocco ricamo · #6 ricamo nel carrello con Horizon · #7 anteprima ricamo sulla City · #8 anteprima più piccola, visibile e senza spazio vuoto
