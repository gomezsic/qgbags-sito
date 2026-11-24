# QG Bags Ricamo - Stato Avanzamento

Ultimo aggiornamento: 2026-06-13 15:36 CEST

## Stato Generale

Fase corrente: app custom installata nello store e Theme App Extension configurata su tema duplicato di test.

Il tema live non e' stato pubblicato/modificato. Tutta la configurazione tema e' sul duplicato `Copia di QGbags_Bazar` ID `192288457037`.

## Decisioni Confermate

- App privata custom per QG Bags.
- Integrazione tramite Theme App Extension.
- Inserimento nella pagina prodotto, prima del pulsante acquisto.
- Attivazione prodotti tramite tag `ricamo si`.
- Compatibilita' mantenuta anche con il vecchio tag `ricamo-si`, per non rompere prodotti gia' taggati.
- Prezzo fisso tramite prodotto Shopify `Ricamo personalizzato`.
- Colore ricamo gestito internamente da QG Bags.
- Prima release senza pannello admin avanzato.

## File Creati

- `outputs/qg-bags-ricamo-shopify-app-design.md`
- `outputs/qg-bags-ricamo-plan-operativo.md`
- `outputs/qg-bags-ricamo-installazione.md`
- `outputs/qg-bags-ricamo-preview.html`
- `outputs/qg-bags-ricamo-app.zip`
- `outputs/qg-bags-ricamo-runbook-deploy-shopify.md`
- `docs/superpowers/specs/2026-06-13-qg-bags-ricamo-shopify-app-design.md`
- `docs/superpowers/plans/2026-06-13-qg-bags-ricamo-app-implementation.md`
- `shopify.app.toml`
- `package.json`
- `README.md`
- `extensions/qg-ricamo/shopify.extension.toml`
- `extensions/qg-ricamo/blocks/qg-embroidery.liquid`
- `extensions/qg-ricamo/assets/qg-embroidery.css`
- `extensions/qg-ricamo/assets/qg-embroidery.js`
- `tests/qg-embroidery.test.js`
- `shopify.app.qg-bags-ricamo.toml`

## Verifiche Gia' Eseguite

- Test Node logica ricamo: passati.
- Syntax check JavaScript: passato.
- Controllo statico CSS/HTML per TODO e pattern grafici rischiosi: passato.
- Corretto errore preview locale `Failed to fetch`: la preview simula l'aggiunta al carrello senza chiamare endpoint Shopify.
- Blocco Liquid allineato al formato Theme App Extension: CSS/JS caricati dallo schema e blocco limitato ai template prodotto.
- Shopify CLI installata via npm globale: versione `4.1.0`.
- Prodotto Shopify `Ricamo personalizzato` verificato in Admin.
- Prezzo prodotto ricamo verificato: `10,00 EUR`.
- Variant ID servizio ricamo recuperato: `54104028774733`.
- Tema duplicato per test: `Copia di QGbags_Bazar`.
- App Shopify creata e collegata: `QG Bags Ricamo`.
- Config Shopify CLI attiva: `shopify.app.qg-bags-ricamo.toml`.
- Client ID app: `8a0e259ed3f210cfe4476b7fb93f892a`.
- Theme App Extension rilasciata su Shopify: versione iniziale `qg-bags-ricamo-2`.
- Aggiunta cartella `locales` alla Theme App Extension per evitare warning/errori di theme check in futuri deploy.
- Theme App Extension rilasciata nuovamente con `locales`: versione pulita `qg-bags-ricamo-3`.
- Theme App Extension aggiornata con tag ufficiale `ricamo si`: versione `qg-bags-ricamo-4`.
- Theme App Extension aggiornata con compatibilita' `ricamo si` + `ricamo-si`: versione `qg-bags-ricamo-5`.
- App `QG Bags Ricamo` installata nello store Shopify `qgnegozio`.
- Blocco app `Ricamo QG Bags` aggiunto al template prodotto del tema duplicato.
- Blocco Globo Product Options disabilitato nel template prodotto del tema duplicato.
- Blocco QG ordinato prima di `buy_buttons`, quindi prima del pulsante `Aggiungi al carrello`.
- Variant ID servizio ricamo configurato nel blocco: `54104028774733`.
- Prodotto test disponibile usato per verifica compatibilita' tag:
  - prodotto: `GRESSINA tessuto malva + manico beige`
  - product ID: `10708220805453`
  - handle: `gressina-tessuto-salvia-manico-89-copia-copia`
  - variant ID: `54104132157773`
- Preview storefront verificata sul prodotto test: il blocco appare e precede il pulsante carrello.
- Preview storefront riverificata dopo tag fix: il blocco appare con `enabled_tag` impostato a `ricamo si` anche su prodotto che aveva ancora `ricamo-si`.
- Verifica remota del template Shopify: il blocco app e il variant ID sono persistiti su Shopify.

## Ultimo Output Test

Comando:

```bash
/Users/giacomofelicesiccardi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/qg-embroidery.test.js
```

Risultato:

```text
tests 7
pass 7
fail 0
```

## Ultime Verifiche Eseguite

Comandi:

```bash
/Users/giacomofelicesiccardi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/qg-embroidery.test.js
/Users/giacomofelicesiccardi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check extensions/qg-ricamo/assets/qg-embroidery.js
/opt/homebrew/bin/shopify app info --config shopify.app.qg-bags-ricamo.toml
```

Esito:

- Test Node: 7 pass, 0 fail.
- Syntax check JavaScript: exit code 0.
- Shopify CLI: app `QG Bags Ricamo` riconosciuta, Shopify CLI `4.1.0`, estensione `qg-bags-ricamo` presente.
- Template remoto tema duplicato: blocco `shopify://apps/qg-bags-ricamo/blocks/qg-embroidery/019ec114-0ade-76da-9140-96167219a6bc` presente prima di `buy_buttons`, con `enabled_tag` = `ricamo si`.

Nota test carrello: la verifica via browser storefront e' stata avviata dalla preview; la verifica via shell sugli endpoint `/cart.js` e `/cart/add.js` e' bloccata da Cloudflare sul dominio primario `qgbags.com`, quindi non e' usabile come prova automatica da terminale.

## Prossime Azioni

1. Fare un test manuale completo dal browser storefront:
   - prodotto test `GRESSINA tessuto malva + manico beige`
   - selezionare ricamo
   - inserire testo
   - scegliere font
   - aggiungere al carrello
   - verificare righe borsa + `Ricamo personalizzato`
2. Se il test manuale e' corretto, pubblicare il tema duplicato `Copia di QGbags_Bazar`.
3. Dopo il go live, taggare con `ricamo si` solo i prodotti ricamabili.

## Rischi Aperti

- Il tema live non e' ancora pubblicato con la nuova configurazione.
- La prova automatica da terminale sugli endpoint cart e' bloccata da Cloudflare sul dominio `qgbags.com`.
- Il prodotto test `GRESSINA tessuto malva + manico beige` aveva il vecchio tag `ricamo-si`; l'app ora lo supporta comunque. Per i nuovi prodotti usare `ricamo si`.

## Rollback Previsto

Il rollback avviene ripubblicando il tema precedente. Nessuna modifica diretta deve essere fatta sul tema live durante i test.
