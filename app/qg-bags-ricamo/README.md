> **Nota (24/11/2026):** copia dell'app privata "QG Bags Ricamo" fatta con Codex il 13/06/2026, presa dal Mac di Giacomo (`Documents/Codex/2026-06-13/sono-su-shopify-e-vendop-borse`). È la versione installata su qgbags.com (estensione `qg-bags-ricamo-4`). Esclusi: `.shopify/` (pacchetto di deploy generato), `work/` (copie del vecchio tema Bazar) e lo zip in `outputs/`. Il file `.shopifyignore` alla radice tiene questa cartella fuori da `shopify theme push`.
>
> **Horizon (24/11/2026):** il blocco trova il modulo d'acquisto anche quando sta fuori dal modulo (cerca nella stessa sezione), avvisa il carrello del tema con gli eventi standard Shopify (`@shopify/events`, il cassetto si aggiorna senza ricaricare la pagina) e toglie il ricamo rimasto da solo quando il cliente toglie la borsa dal carrello. Sui temi vecchi senza quegli eventi funziona come prima (`ajaxCart` o pagina `/cart`).
>
> Prossimi passi (piano V2, step 1): installare l'app anche su qgbags-v2, adattare il blocco a pagina prodotto e carrello di Horizon, aggiungere l'anteprima del ricamo sulle borse modello.

# QG Bags Ricamo

Custom Shopify app scaffold for QG Bags embroidery options.

## What It Includes

- Private Shopify app config placeholder.
- Theme App Extension.
- Product-page app block `Ricamo QG Bags`.
- Scoped storefront CSS.
- Vanilla JavaScript for validation, Ajax cart add, and orphan embroidery cleanup.
- Node tests for core cart behavior.

## Local Verification

Run:

```bash
/Users/giacomofelicesiccardi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/qg-embroidery.test.js
```

Preview:

`outputs/qg-bags-ricamo-preview.html`

## Shopify Setup Summary

1. Create a Shopify product named `Ricamo personalizzato`.
2. Set the fixed embroidery price on that product variant.
3. Keep the product hidden from storefront navigation and collections.
4. Copy the service variant ID.
5. Deploy the theme app extension with Shopify CLI.
6. In the Theme Editor, replace the Globo block with `Ricamo QG Bags`.
7. Enter the service variant ID, price label, font list, and max characters.
8. Tag eligible products with `ricamo si`.
