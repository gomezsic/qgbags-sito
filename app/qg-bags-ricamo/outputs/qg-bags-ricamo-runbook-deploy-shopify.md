# QG Bags Ricamo - Runbook Deploy Shopify

## Premessa

Questo runbook serve per portare l'app dallo scaffold locale allo store Shopify QG Bags.

Non eseguire il deploy direttamente sul tema live. Prima si lavora su un tema duplicato.

## Prerequisiti

- Accesso admin allo store Shopify QG Bags.
- Shopify CLI installata e autenticata.
- Custom app privata creata o collegabile.
- Prodotto `Ricamo personalizzato` creato in Shopify.
- Variant ID del prodotto `Ricamo personalizzato`.
- Tema live duplicato e non pubblicato.

Valore QG Bags gia' verificato:

```text
Variant ID servizio ricamo: 54104028774733
Prezzo: 10,00 EUR
App: QG Bags Ricamo
Client ID: 8a0e259ed3f210cfe4476b7fb93f892a
Tema duplicato test: Copia di QGbags_Bazar (#192288457037)
```

## Comandi Locali Di Verifica

Da questa cartella:

```bash
/Users/giacomofelicesiccardi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/qg-embroidery.test.js
```

Esito atteso:

```text
pass 7
fail 0
```

## Collegamento App

Quando Shopify CLI e' disponibile:

```bash
/opt/homebrew/bin/shopify login --store qgnegozio
/opt/homebrew/bin/shopify app config link
```

Controllo:

- `shopify.app.qg-bags-ricamo.toml` viene aggiornato con i dati reali dell'app.
- I placeholder non devono restare nel file prima del deploy.

Stato attuale:

```text
App installata nello store qgnegozio.
Config attiva: shopify.app.qg-bags-ricamo.toml
```

## Avvio Ambiente Di Sviluppo

```bash
shopify app dev
```

Controllo:

- Shopify CLI mostra lo store corretto.
- La Theme App Extension viene servita.
- Nel Theme Editor del tema duplicato compare il blocco app `Ricamo QG Bags`.

## Deploy Extension

Dopo test in sviluppo:

```bash
/opt/homebrew/bin/shopify app deploy --config shopify.app.qg-bags-ricamo.toml
```

Controllo:

- Shopify CLI crea una nuova versione dell'app.
- La Theme App Extension risulta disponibile nello store.

## Installazione Nel Tema Duplicato

Metodo supportato Shopify:

```text
https://admin.shopify.com/store/qgnegozio/themes/192288457037/editor?template=product&addAppBlockId=8a0e259ed3f210cfe4476b7fb93f892a/qg-embroidery&target=mainSection
```

Nel Theme Editor del tema duplicato:

1. Aprire il template prodotto.
2. Disabilitare il blocco Globo Product Options.
3. Aggiungere `Ricamo QG Bags` nella stessa posizione.
4. Configurare:
   - Variant ID servizio ricamo
   - prezzo visuale
   - font
   - limite caratteri
5. Salvare.

Stato attuale sul tema duplicato:

```text
Globo Product Options: disabilitato nel template prodotto.
Ricamo QG Bags: aggiunto prima di buy_buttons.
Variant ID servizio ricamo: 54104028774733.
```

Verifica CLI:

```bash
/opt/homebrew/bin/shopify theme pull --store qgnegozio --theme 192288457037 --path work/theme-verify-192288457037-final --only templates/product.json --force
rg -n "qg_bags_ricamo|qg-embroidery|54104028774733" work/theme-verify-192288457037-final/templates/product.json
```

## Test Obbligatori Prima Del Go Live

1. Prodotto senza tag `ricamo si`: il blocco non appare.
2. Prodotto con tag `ricamo si`: il blocco appare.
3. Ricamo non selezionato: viene aggiunta solo la borsa.
4. Ricamo selezionato: vengono aggiunti borsa + servizio ricamo.
5. Testo vuoto: compare errore e non aggiunge al carrello.
6. Due borse uguali con ricami diversi: le righe restano distinte.
7. Rimozione borsa ricamata: il servizio ricamo collegato viene rimosso.
8. Checkout: totale corretto.
9. Ordine Shopify: presenti testo e font ricamo.

## Go Live

Solo dopo i test:

1. Annotare configurazione finale.
2. Pubblicare il tema duplicato.
3. Tenere il vecchio tema come rollback.
4. Monitorare i primi ordini.

## Rollback

Se qualcosa non funziona:

1. Ripubblicare il vecchio tema.
2. Non cancellare l'app.
3. Correggere sul tema duplicato.
4. Ripetere i test prima di ripubblicare.
