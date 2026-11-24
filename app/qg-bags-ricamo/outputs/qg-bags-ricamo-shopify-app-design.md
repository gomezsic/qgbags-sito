# QG Bags Ricamo Shopify App - Design

Data: 2026-06-13

## Obiettivo

Creare una custom app privata Shopify per QG Bags che sostituisca Globo Product Options e permetta al cliente di aggiungere un ricamo a prezzo fisso dalla pagina prodotto.

L'opzione deve comparire nella scheda prodotto, vicino al flusso di acquisto, prima del pulsante "Aggiungi al carrello". Il cliente deve poter inserire il testo del ricamo e scegliere il font. Il colore non viene scelto dal cliente: resta gestito da QG Bags secondo criteri interni.

## Contesto Tema

Tema esportato analizzato:

`/Users/giacomofelicesiccardi/Downloads/theme_export__qgbags-com-qgbags_bazar__13JUN2026-0203pm`

File rilevanti:

- `sections/main-product.liquid`
- `snippets/product.liquid`
- `templates/product.json`
- `sections/cart.liquid`
- `assets/california.js`

Il tema supporta gia' i blocchi app `@app` dentro la sezione prodotto. Il template prodotto contiene attualmente un blocco Globo Product Options posizionato prima dei bottoni di acquisto. Questo punto verra' usato per installare il nuovo blocco app "Ricamo QG Bags".

Il carrello del tema salta gia' le line item properties che iniziano con `_`, quindi possiamo usare properties private per collegare la borsa al servizio ricamo senza mostrarle al cliente nel carrello.

## Decisioni Approvate

- Tipo app: custom app privata per QG Bags.
- Integrazione storefront: Shopify Theme App Extension.
- Visibilita' ricamo: tramite tag prodotto.
- Tag abilitante: `ricamo si`.
- Prezzo ricamo: fisso.
- Meccanismo prezzo: prodotto Shopify separato "Ricamo personalizzato".
- Posizione UI: pagina prodotto, prima di "Aggiungi al carrello".
- Gestione colore ricamo: interna a QG Bags, non selezionabile dal cliente.

## Architettura

L'app sara' composta da:

1. Shopify app privata
   - Necessaria per installare e distribuire la Theme App Extension.
   - Non richiede pubblicazione nello Shopify App Store.

2. Theme App Extension
   - App block `Ricamo QG Bags`.
   - Inseribile dal Theme Editor nella sezione prodotto.
   - Sostituira' il blocco Globo nel template prodotto.

3. Prodotto servizio Shopify
   - Titolo consigliato: `Ricamo personalizzato`.
   - Prezzo fisso configurato da Shopify.
   - Prodotto nascosto da collezioni, menu e ricerca.
   - L'app usera' il variant ID di questo prodotto per aggiungerlo al carrello.

4. Script storefront dell'estensione
   - Intercetta il submit del form prodotto quando il ricamo e' attivo.
   - Aggiunge al carrello borsa + servizio ricamo nella stessa operazione.
   - Mantiene compatibilita' con il comportamento Ajax del tema.

## Comportamento Cliente

Se il prodotto non ha il tag `ricamo si`, il blocco non mostra nulla.

Se il prodotto ha il tag `ricamo si`, il blocco mostra:

- checkbox "Aggiungi ricamo"
- campo testo ricamo
- selezione font
- informazione sintetica sul prezzo fisso del ricamo

Quando la checkbox non e' attiva, il prodotto viene aggiunto normalmente.

Quando la checkbox e' attiva:

- il testo ricamo diventa obbligatorio
- il font diventa obbligatorio
- il carrello riceve due righe:
  - prodotto borsa
  - prodotto servizio "Ricamo personalizzato"

## Dati Salvati Nell'Ordine

Sulla riga della borsa:

- `Ricamo`: `Si`
- `Testo ricamo`: valore inserito dal cliente
- `Font ricamo`: font scelto
- `_qg_ricamo_group`: identificatore tecnico privato

Sulla riga del servizio ricamo:

- `Testo ricamo`: valore inserito dal cliente
- `Font ricamo`: font scelto
- `_qg_ricamo_group`: stesso identificatore della borsa
- `_qg_ricamo_parent_variant`: variant ID della borsa

Le properties private che iniziano con `_` sono tecniche. Servono a collegare le righe e non devono essere mostrate al cliente nel carrello.

## Collegamento Borsa-Ricamo

Ogni aggiunta con ricamo genera un identificatore univoco, per esempio:

`qg-ricamo-<timestamp>-<random>`

Questo evita collisioni quando un cliente acquista due borse uguali con ricami diversi.

## Font

L'app block deve avere una lista font configurabile in modo semplice.

Prima versione consigliata:

- Font configurati come impostazione del blocco nel Theme Editor, in formato testo separato da virgole.
- Esempio: `Corsivo, Stampatello, Elegante`

Questo evita un pannello admin complesso nella prima versione.

## Prezzo

Il prezzo del ricamo non viene simulato nel tema. Viene calcolato realmente da Shopify perche' il servizio ricamo e' un prodotto aggiunto al carrello.

Il prezzo visibile nel blocco deve essere informativo. Il checkout usera' il prezzo reale della variante "Ricamo personalizzato".

## Requisiti Di Configurazione

Prima dell'uso in produzione servono:

- Prodotto Shopify "Ricamo personalizzato".
- Variant ID del prodotto ricamo.
- Tag `ricamo si` applicato ai prodotti ricamabili.
- Blocco Globo rimosso o disabilitato dal template prodotto.
- Blocco "Ricamo QG Bags" inserito nella stessa posizione del blocco Globo.

## Gestione Carrello

La versione installabile deve garantire:

- Aggiunta coerente di borsa + ricamo.
- Dati ricamo visibili nell'ordine.
- Messaggi di errore se testo o font mancano.
- Nessun blocco visibile per prodotti senza tag.
- Rimozione automatica del servizio ricamo se la borsa collegata viene rimossa dal carrello.
- Quantita' coerente tra borsa e servizio ricamo: nella prima versione ogni aggiunta ricamata crea una coppia borsa + ricamo con quantita' 1. Se il cliente vuole due borse uguali con ricami diversi, deve aggiungerle separatamente.

Questo evita ordini con un servizio ricamo rimasto nel carrello senza la borsa associata.

## Compatibilita' Tema

Il tema usa Ajax add-to-cart in `assets/california.js`. Lo script dell'estensione dovra':

- evitare doppie aggiunte al carrello
- rispettare il form prodotto esistente
- aggiornare il drawer/cart dopo l'aggiunta
- non rompere i prodotti senza ricamo
- degradare in modo chiaro se JavaScript non e' disponibile

## Error Handling

Errori da gestire:

- Ricamo selezionato ma testo vuoto.
- Ricamo selezionato ma font non scelto.
- Variant ID servizio ricamo non configurato.
- Shopify Ajax API risponde con errore 422 o altro errore.
- Prodotto servizio ricamo non disponibile.

In caso di errore, il cliente deve vedere un messaggio vicino al blocco ricamo o al pulsante carrello.

## Test

Test funzionali minimi:

- Prodotto senza tag `ricamo si`: blocco non visibile.
- Prodotto con tag `ricamo si`: blocco visibile.
- Ricamo non selezionato: viene aggiunta solo la borsa.
- Ricamo selezionato con testo e font: vengono aggiunti borsa + servizio ricamo.
- Due borse uguali con ricami diversi: ogni ricamo resta collegato alla borsa corretta.
- Testo vuoto con ricamo attivo: aggiunta bloccata con errore.
- Carrello e checkout mostrano prezzo totale corretto.
- Ordine Shopify contiene testo e font ricamo.

Test tema:

- Desktop pagina prodotto.
- Mobile pagina prodotto.
- Cart drawer o carrello Ajax.
- Pagina carrello standard.
- Prodotti con varianti.
- Prodotti senza varianti.

## Fuori Scope Prima Versione

- Scelta colore da parte del cliente.
- Anteprima grafica reale del ricamo sulla foto prodotto.
- Prezzi variabili in base a font o lunghezza.
- Pubblicazione su Shopify App Store.
- Pannello admin avanzato per regole collezione.

## Criterio Di Successo

La feature e' pronta quando QG Bags puo':

1. Installare facilmente l'app in Shopify.
2. Taggare un prodotto con `ricamo si`.
3. Definire un prezzo fisso per il ricamo.
4. Vedere il blocco ricamo nella pagina prodotto.
5. Far inserire testo e font al cliente.
6. Far aggiungere automaticamente al carrello il servizio ricamo a prezzo fisso.
7. Ricevere nell'ordine Shopify tutte le informazioni necessarie per produrre il ricamo.
