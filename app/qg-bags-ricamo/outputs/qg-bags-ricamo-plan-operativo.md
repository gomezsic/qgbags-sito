# QG Bags Ricamo - Piano Operativo

Data: 2026-06-13

## Obiettivo Operativo

Costruire, verificare e installare una custom app privata Shopify per aggiungere il ricamo alle borse QG Bags senza modificare in modo distruttivo il tema esistente.

La prima release deve permettere:

1. Installazione controllata dell'app.
2. Inserimento del blocco `Ricamo QG Bags` nella pagina prodotto.
3. Attivazione tramite tag prodotto `ricamo si`.
4. Definizione prezzo fisso tramite prodotto Shopify `Ricamo personalizzato`.
5. Aggiunta automatica al carrello di borsa + servizio ricamo.
6. Dati ricamo visibili nell'ordine Shopify.

## Principio Di Sicurezza

Non si lavora direttamente sul tema pubblicato.

Il flusso corretto e':

1. Duplicare il tema attivo.
2. Installare e configurare l'app sul tema duplicato.
3. Testare il flusso completo.
4. Pubblicare il tema duplicato solo dopo verifica.
5. Tenere il tema attuale come rollback.

Questo evita modifiche distruttive e permette di tornare indietro rapidamente.

## Stato Attuale

Sono gia' stati creati:

- scaffold app privata
- Theme App Extension
- blocco Liquid `Ricamo QG Bags`
- CSS grafico storefront
- JavaScript per validazione e carrello
- test Node per logica ricamo
- preview HTML locale

File principali:

- `shopify.app.toml`
- `extensions/qg-ricamo/shopify.extension.toml`
- `extensions/qg-ricamo/blocks/qg-embroidery.liquid`
- `extensions/qg-ricamo/assets/qg-embroidery.css`
- `extensions/qg-ricamo/assets/qg-embroidery.js`
- `tests/qg-embroidery.test.js`
- `outputs/qg-bags-ricamo-preview.html`

## Step 1 - Preparazione Shopify

### Azioni

1. Creare un prodotto Shopify chiamato `Ricamo personalizzato`.
2. Impostare il prezzo fisso del ricamo.
3. Disattivare la pubblicazione in collezioni/menu/search dove possibile.
4. Copiare il variant ID del prodotto ricamo.
5. Applicare il tag `ricamo si` a 1 solo prodotto di test.

### Controlli

- Il prodotto `Ricamo personalizzato` esiste.
- Il prezzo fisso e' corretto.
- Il variant ID e' disponibile.
- Il prodotto di test ha tag `ricamo si`.
- Nessun altro prodotto viene modificato.

### Esito Atteso

Shopify ha il prodotto servizio che generera' il prezzo reale al checkout.

## Step 2 - Preparazione Tema Sicura

### Azioni

1. Duplicare il tema attivo da Shopify Admin.
2. Rinominare il duplicato, per esempio `QG Bags - Test Ricamo`.
3. Non pubblicare il duplicato.
4. Tenere installato Globo sul tema live finche' il nuovo flusso non e' verificato.

### Controlli

- Il tema live resta invariato.
- Esiste un tema duplicato non pubblicato.
- Il duplicato contiene ancora la configurazione attuale, incluso Globo.

### Esito Atteso

Abbiamo un ambiente sicuro dove testare la nuova app.

## Step 3 - Collegamento App Shopify

### Azioni

1. Creare o collegare la custom app privata Shopify.
2. Sostituire i placeholder in `shopify.app.toml`.
3. Autenticare Shopify CLI con lo store QG Bags.
4. Collegare il progetto locale all'app Shopify.
5. Deployare la Theme App Extension.

### Controlli

- Shopify CLI vede lo store corretto.
- L'app e' collegata allo store QG Bags.
- La Theme App Extension appare tra i blocchi app disponibili nel Theme Editor.
- Nessun file del tema viene modificato manualmente.

### Esito Atteso

Il blocco `Ricamo QG Bags` e' disponibile nel Theme Editor.

## Step 4 - Inserimento Nel Tema Duplicato

### Azioni

1. Aprire il Theme Editor del tema duplicato.
2. Aprire il template prodotto standard.
3. Disabilitare il blocco Globo solo nel tema duplicato.
4. Aggiungere il blocco app `Ricamo QG Bags` nella stessa posizione di Globo, prima dei bottoni acquisto.
5. Configurare:
   - `Variant ID servizio ricamo`
   - `Testo prezzo`
   - `Font disponibili`
   - `Numero massimo caratteri`
   - testi visibili al cliente

### Controlli

- Il tema live non viene toccato.
- Il blocco Globo resta disponibile per rollback.
- Il blocco `Ricamo QG Bags` appare solo nel tema duplicato.
- Su un prodotto senza tag `ricamo si`, il blocco non appare.
- Su un prodotto con tag `ricamo si`, il blocco appare.

### Esito Atteso

La UI ricamo e' visibile solo sui prodotti abilitati.

## Step 5 - Controllo Grafico

### Azioni

1. Aprire un prodotto con tag `ricamo si` sul tema duplicato.
2. Verificare desktop.
3. Verificare mobile.
4. Aprire e chiudere la checkbox ricamo.
5. Provare testi lunghi e font con nomi lunghi.

### Controlli

- Nessun testo si sovrappone.
- Il blocco e' leggibile vicino al pulsante acquisto.
- Il campo testo e' chiaro.
- I font sono selezionabili.
- Il messaggio prezzo e' visibile ma non invasivo.
- Il layout resta stabile su mobile.

### Esito Atteso

La parte grafica e' pronta per test cliente.

## Step 6 - Test Flusso Carrello

### Azioni

1. Prodotto senza ricamo: aggiungere al carrello.
2. Prodotto con ricamo: selezionare checkbox, inserire testo, scegliere font, aggiungere al carrello.
3. Provare testo vuoto con ricamo attivo.
4. Provare due borse uguali con ricami diversi, aggiunte separatamente.
5. Rimuovere una borsa ricamata dal carrello.

### Controlli

- Senza ricamo viene aggiunta solo la borsa.
- Con ricamo vengono aggiunti borsa + servizio ricamo.
- Testo vuoto blocca l'aggiunta e mostra errore.
- Due ricami diversi restano distinti.
- Se si rimuove la borsa, il servizio ricamo collegato viene rimosso.
- Il drawer carrello del tema si aggiorna correttamente.

### Esito Atteso

Il flusso operativo cliente funziona end-to-end.

## Step 7 - Test Checkout E Ordine

### Azioni

1. Creare un ordine di test.
2. Verificare il totale checkout.
3. Verificare le righe ordine in Shopify Admin.
4. Verificare che testo e font siano leggibili per la produzione.

### Controlli

- Il prezzo ricamo aumenta il totale reale.
- L'ordine contiene la borsa.
- L'ordine contiene il servizio ricamo.
- L'ordine contiene `Testo ricamo`.
- L'ordine contiene `Font ricamo`.
- Le property tecniche private non confondono il cliente nel carrello.

### Esito Atteso

QG Bags puo' produrre il ricamo leggendo l'ordine Shopify.

## Step 8 - Go Live Non Distruttivo

### Azioni

1. Annotare configurazione finale del blocco.
2. Fare ultimo test sul tema duplicato.
3. Pubblicare il tema duplicato.
4. Tenere il vecchio tema non modificato come rollback.
5. Monitorare i primi ordini con ricamo.

### Controlli

- Il vecchio tema resta disponibile.
- Il nuovo tema contiene il blocco configurato.
- Globo e' disabilitato solo dove sostituito.
- I primi ordini con ricamo hanno dati completi.

### Esito Atteso

La nuova app e' live senza perdita di configurazione precedente.

## Rollback

Se qualcosa non funziona:

1. Ripubblicare il vecchio tema.
2. Disabilitare il blocco `Ricamo QG Bags` sul tema duplicato.
3. Riattivare Globo se necessario.
4. Analizzare il problema in ambiente non pubblicato.

Il rollback non richiede cancellare prodotti, ordini o app.

## Second Round Di Sviluppo

Funzionalita' volutamente fuori dalla prima versione:

- scelta colore da parte del cliente
- anteprima grafica reale del ricamo sulla foto prodotto
- prezzi variabili in base a font o lunghezza
- pubblicazione su Shopify App Store
- pannello admin avanzato per regole collezione

Priorita' consigliata per il secondo round:

1. Anteprima grafica semplice del testo ricamo.
2. Regole colore interne visibili allo staff.
3. Pannello admin per prezzo/font senza usare Theme Editor.
4. Report o filtro ordini con ricamo.
5. Prezzi variabili solo se il processo produttivo lo richiede davvero.
