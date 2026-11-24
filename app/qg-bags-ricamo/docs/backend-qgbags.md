# Backend QGbags: descrizione per il progetto del nuovo sito Shopify

Versione del 24/11/2026. Testo da dare come contesto al Claude che lavora sul nuovo sito QGbags in Shopify. Descrive com'è il backend oggi e dove sito e backend possono parlarsi. Le parti «oggi» sono verificate sul codice; le parti «proposta» sono idee, non ancora decise né costruite.

## 1. Che cos'è

QUEENDC SRL vende borse con il marchio QGbags, quasi sempre a privati, molte personalizzate (modello, tessuto, manico, zip, ricamo). Il backend è il gestionale interno dell'azienda. Lo usa solo l'amministratore (Giacomo), non i clienti.

Fa tre lavori:

1. **Ordini e produzione.** Clienti, ordini (una riga per prodotto), preventivi, ricevute, magazzino, configuratore delle borse, email al cliente (preventivo, ricevuta, ordine pronto).
2. **Contabilità.** Prima Nota, riconciliazione degli incassi (banca, PayPal, Shopify Payments, Stripe, SumUp, Scalapay), fatture emesse e ricevute, pacchetto trimestrale per il commercialista.
3. **Controllo.** Dimostra che ogni euro incassato corrisponde a un ordine o a una fattura, e che ogni euro speso corrisponde a una fattura ricevuta.

## 2. Tecnologia

- App web React + TypeScript + Vite + Tailwind/shadcn, sviluppata con **Lovable** (progetto Lovable `00fd70db-2ac0-4708-a7aa-25354f80aecc`).
- Pubblicata su https://qg.lovable.app.
- Database e funzioni su **Lovable Cloud (Supabase)**, progetto `vtihlvywtkyaviuqfewt`: PostgreSQL con regole di accesso per ruolo (admin), funzioni SQL (RPC) per tutte le scritture delicate, Edge Functions in Deno.
- Il codice lo modifica Lovable. Claude analizza e verifica. Ogni modifica al database e ogni pubblicazione richiede l'approvazione esplicita di Giacomo.

## 3. I dati principali

| Tabella | Contenuto |
|---|---|
| `qg_ordini` | Ordini dei privati, una riga per prodotto. Campi chiave: `numero_ordine` (es. 2607-0139 = anno, mese, progressivo), `cliente_id`, `modello_id`, `tessuto_id`, `manico_id`, `zip_id`, `colore_id`, `materiale_id`, `ricamo`, `ricamo_scritta`, `prezzo`, `sconto_*`, `spedizione*`, `provenienza_id`, `metodo_pagamento_id`, `incasso_v`, `incasso_a`, `pagato`, `data_pagamento`, `stato`, `produzione`, `shopify_order_name`, `external_id` |
| `qg_clienti` | Anagrafica: nome, cognome, email, telefono, indirizzo, codice fiscale, partita IVA, SDI, PEC |
| `qg_configuratore_modelli`, `_tessuti`, `_manici`, `_zip` | Catalogo delle opzioni della borsa, con codice, nome, ordine, attivo, immagini e maschere per l'anteprima grafica |
| `qg_prodotti`, `qg_magazzino_movimenti` | Prodotti, costi e movimenti di magazzino |
| `qg_preventivi`, `qg_ricevute`, `qg_fatture` | Documenti verso il cliente |
| `qg_provenienze`, `qg_metodi_pagamento` | Liste: provenienza (Bazar, Sito, Showroom, Evento, Chat, Instagram, Mail…) e metodo (Bonifico, PayPal, Shopify, Stripe, Scalapay, POS, Contanti, Consegna, Campioni) |
| `qg_ordini_riconciliati` | Copia di lavoro degli ordini per la riconciliazione. L'ordine originale non viene mai riscritto in automatico |
| `qg_movimenti_bancari` | Movimenti di banca e piattaforme |
| `qg_sp_import`, `qg_sp_ordini`, `qg_sp_payout`, `qg_sp_eventi` | Registri Shopify caricati dai file esportati |
| `qg_shopify_staging` | Tabella di appoggio per ordini Shopify da «travasare» in `qg_ordini` (campi già pensati: cliente, indirizzo, prodotto Shopify, modello/manico/zip, ricamo, codice sconto, stato finanziario). Oggi nessun codice la riempie |

## 4. Come entrano oggi i dati di Shopify

**Oggi non c'è nessun collegamento automatico con Shopify.** Nessuna API, nessun webhook.

- Gli ordini arrivano nel gestionale dal foglio Ordini (import da foglio, funzioni `import-ordini` / `import-ordini-v2`) o a mano. Il legame con Shopify è il campo `shopify_order_name` (es. `#1234`).
- Per la contabilità Giacomo carica a mano i file esportati da Shopify: elenco ordini, elenco pagamenti/payout di Shopify Payments. Il gestionale li legge, classifica ogni vendita (Shopify Payments carta/Klarna, PayPal, Scalapay, bonifico) e li confronta con gli accrediti in banca.
- Esiste un endpoint MCP di sola lettura (Edge Function `mcp`, strumento `list_recent_orders`) per leggere gli ultimi ordini.

## 5. Regole del backend che il sito deve rispettare

1. **Il foglio Ordini e l'ordine originale sono la fonte manuale.** Nessun sistema esterno scrive direttamente in `qg_ordini` o in `qg_ordini_riconciliati`. Un ordine non si modifica mai per far tornare un totale.
2. **Il pagamento lo certifica il backend, non il sito.** Un ordine è pagato quando il backend trova l'incasso reale (banca o piattaforma) con lo stesso importo lordo. Il sito può dire «pagato su Shopify», ma la conferma contabile la dà l'amministratore.
3. **Si confronta sempre il lordo pagato dal cliente**, mai il netto dopo la commissione.
4. **I versamenti di Shopify in banca sono giroconti**, non vendite. Il ricavo si conta una volta sola, alla data in cui il cliente paga.
5. **Un ordine Shopify può essere pagato con Shopify Payments oppure con PayPal.** Se è pagato con PayPal si conta solo sul conto PayPal.
6. **Inc. V** è l'importo incassato su un canale tracciato (tutti i pagamenti del sito). **Inc. A** si usa solo con Contanti, Consegna o Campioni: un ordine del sito non ha mai Inc. A.
7. **Le vendite ad aziende con fattura** non passano dagli ordini: partono dalla fattura emessa.
8. Le scritture delicate passano solo da funzioni SQL controllate (ruolo admin), mai da scritture dirette sulle tabelle.

## 6. Dove sito e backend possono parlarsi (proposta)

In ordine di utilità, dal più semplice:

1. **Ordini dal sito al backend.** Un webhook Shopify `orders/paid` chiama una nuova Edge Function che scrive in `qg_shopify_staging` (una riga per prodotto, con le opzioni della borsa). L'amministratore vede la riga e la conferma: solo allora diventa un ordine in `qg_ordini`, con `shopify_order_name` e provenienza Sito. Così il foglio Ordini resta la fonte e niente entra senza controllo.
2. **Opzioni della borsa dal backend al sito.** Il configuratore del backend ha già modelli, tessuti, manici e zip con codici e immagini. Il sito può usare gli stessi **codici** nelle proprietà della riga d'ordine (line item properties) o nei metafield dei prodotti. Con codici uguali l'ordine arriva nel backend già leggibile, senza interpretare testi.
3. **Stato dell'ordine dal backend al sito.** Il backend sa quando una borsa è in produzione o pronta (oggi manda già l'email «ordine pronto»). Può aggiornare l'ordine Shopify (tag, nota o evasione) per mostrare lo stato al cliente.
4. **Clienti.** Email, nome, indirizzo e telefono dell'ordine Shopify possono creare o aggiornare il cliente in `qg_clienti`, con controllo dei duplicati che il backend già fa.
5. **Pagamenti.** Più avanti, l'API Shopify Payments (payout e transazioni) può sostituire il caricamento manuale dei file. Il backend deve continuare a usare la banca come unica prova del denaro arrivato.

Cosa serve, in ogni caso: una app personalizzata nel pannello Shopify con permessi di sola lettura su ordini e clienti (più scrittura su ordini solo per il punto 3), e il segreto del webhook custodito nelle impostazioni del backend, mai nel tema del sito.

## 7. Cose da non fare

- Non scrivere dal sito nei dati contabili (movimenti, Prima Nota, riconciliazione, fatture).
- Non segnare un ordine come pagato nel backend partendo solo dal dato Shopify.
- Non duplicare il catalogo con nomi diversi: usare i codici del configuratore.
- Non modificare il database del backend senza l'approvazione di Giacomo sul testo esatto della modifica.
