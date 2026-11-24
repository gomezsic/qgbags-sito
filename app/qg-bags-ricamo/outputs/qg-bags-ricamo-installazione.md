# QG Bags Ricamo - Installazione

## Prima Configurazione Shopify

1. Crea un prodotto Shopify chiamato `Ricamo personalizzato`.
2. Imposta su quel prodotto il prezzo fisso del ricamo.
3. Nascondi il prodotto da menu, collezioni e ricerca.
4. Copia il variant ID del prodotto `Ricamo personalizzato`.
5. Aggiungi il tag `ricamo si` ai prodotti ricamabili.

Valore verificato per QG Bags:

```text
Variant ID servizio ricamo: 54104028774733
Prezzo: 10,00 EUR
Custom app: QG Bags Ricamo
Client ID: 8a0e259ed3f210cfe4476b7fb93f892a
Tema duplicato configurato: Copia di QGbags_Bazar (#192288457037)
```

## Installazione App

Questa cartella contiene lo scaffold della custom app privata e la Theme App Extension.

Stato attuale:

- Shopify CLI installata e autenticata.
- App `QG Bags Ricamo` creata, collegata e installata nello store.
- Theme App Extension rilasciata.
- Config reale in `shopify.app.qg-bags-ricamo.toml`.
- Tema duplicato `Copia di QGbags_Bazar` configurato, senza pubblicare il tema live.

Nel Theme Editor:

1. Apri il template prodotto.
2. Disabilita o rimuovi il blocco Globo Product Options.
3. Aggiungi il blocco app `Ricamo QG Bags` nella stessa posizione.
4. Inserisci:
   - `Variant ID servizio ricamo`
   - `Testo prezzo`, per esempio `+ €10`
   - font disponibili, per esempio `Corsivo, Stampatello, Elegante`
   - numero massimo caratteri

Nota tecnica: il blocco app carica CSS e JavaScript tramite lo schema della Theme App Extension. Non serve modificare manualmente i file del tema.

Deep link usato per aggiungere il blocco al tema duplicato:

```text
https://admin.shopify.com/store/qgnegozio/themes/192288457037/editor?template=product&addAppBlockId=8a0e259ed3f210cfe4476b7fb93f892a/qg-embroidery&target=mainSection
```

## Comportamento

Il blocco appare sui prodotti con tag `ricamo si`.

Nota compatibilita': l'app accetta anche il vecchio tag `ricamo-si`, ma da ora in poi usa `ricamo si` per i nuovi prodotti.

Quando il cliente seleziona il ricamo, l'app richiede testo e font, poi aggiunge al carrello:

- la borsa
- il servizio `Ricamo personalizzato`

Le due righe vengono collegate da property tecniche private, così l'ordine contiene tutte le informazioni necessarie per produrre il ricamo.

## Preview Grafica

Apri:

`outputs/qg-bags-ricamo-preview.html`

La preview mostra la UI cliente nella posizione prevista della pagina prodotto.

## Go Live

Non pubblicare il tema finche' non e' stato fatto un test manuale completo:

1. Aprire il prodotto test con tag `ricamo si`.
2. Selezionare `Aggiungi ricamo`.
3. Inserire testo e font.
4. Aggiungere al carrello.
5. Verificare carrello con borsa + `Ricamo personalizzato`.
6. Verificare checkout/totale.
7. Verificare nell'ordine Shopify le property del ricamo.

Quando il test e' corretto, pubblicare il tema duplicato `Copia di QGbags_Bazar`.
