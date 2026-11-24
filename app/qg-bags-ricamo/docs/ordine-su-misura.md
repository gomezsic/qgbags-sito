# Nuovo ordine su misura

Pulsante nell'admin Shopify (app QG Bags Ricamo V2) per registrare gli ordini che non passano dal negozio online:
WhatsApp, telefono, showroom, email, spesso con pezzi fuori catalogo o su misura.
Ogni ordine nasce in Shopify con tutti i dati già compilati, così il gestionale lo scarica via API come gli ordini online.

## Dove si trova

Admin Shopify > **Ordini** > **Altre azioni** > **Nuovo ordine su misura**
(estensione admin `qg-ordine-su-misura`, target `admin.order-index.action.render`).

Lo stesso modulo si apre anche da:

- **Ordini bozza** > **Altre azioni** (`qg-ordine-su-misura-bozze`, `admin.draft-order-index.action.render`)
- **Prodotti** > **Altre azioni** (`qg-ordine-su-misura-prodotti`, `admin.product-index.action.render`):
  sempre visibile, anche quando non ci sono ancora ordini o bozze (con elenchi vuoti Shopify non mostra "Altre azioni")
- **Clienti** > un cliente > **Altre azioni** (`qg-ordine-su-misura-cliente`, `admin.customer-details.action.render`):
  il cliente è già scelto (`preselectedCustomerId` in `src/ordine.mjs`)

## Cosa si compila

I valori sono gli stessi del gestionale QGbags (foglio Ordini, tabelle `qg_provenienze`, `qg_metodi_pagamento`,
`qg_configuratore_*`), vedi `docs/backend-qgbags.md`.

| Campo | Obbligatorio | Valori |
|---|---|---|
| Provenienza | sì | CHAT (WhatsApp), SHOWROOM, MAIL, IG, BAZAR, EVENTO, VERSILIANI, ANDREA, BABI |
| Cliente | sì | cliente esistente (ricerca) oppure nuovo: nome, cognome, email e/o telefono |
| Tipo di articolo | sì | **Dal catalogo** (si cerca la borsa) oppure **Su misura / fuori catalogo** (titolo + prezzo) |
| Modello | su misura | nomi del foglio Ordini: CITY BAG, TRAVEL BAG, GRACE BAG, BEAUTY CLASSIC, BRIOCHE BAG, GRESSINA… |
| Materiale | su misura | NEOPRENE, VELLUTO, FROZEN, PELOSINO, JAPAN, TRAME', CANVAS… |
| Colore | no | testo, maiuscolo (es. BLU SCURO) |
| Manico | no | codice manico (es. HDL-10) |
| Zip | no | testo |
| Quantità | sì | default 1 |
| Ricamo | no | testo (max 20 caratteri) + font Corsivo / Stampatello / Compatto; aggiunge la riga "Ricamo personalizzato" a 10 € |
| Da spedire | no | sì/no (colonna Spedizione) |
| Consegna prevista | no | data |
| Note per il laboratorio | no | testo libero |
| Pagamento | sì | **Già pagato** (ordine completato in Shopify) oppure **Da pagare** (bozza con link di pagamento) |
| Metodo di pagamento | se già pagato | BONIFICO, PAYPAL, POS, CONTANTI, CONSEGNA, SHOPIFY, STRIPE, SCALAPAY, CAMPIONI, OMAGGIO |

"Già pagato" è solo lo stato in Shopify: il pagamento lo certifica il gestionale quando trova l'incasso reale.

## Come viene salvato in Shopify (per il gestionale)

Ordine (o bozza d'ordine se "Da pagare"):

- **Tag ordine**: `qg-su-misura`, `provenienza-<valore minuscolo>` (es. `provenienza-chat`), `fuori-catalogo` se c'è un articolo personalizzato.
- **Attributi dell'ordine** (`customAttributes` / note attributes):
  - `qg_provenienza` = codice provenienza (CHAT, SHOWROOM, …)
  - `qg_tipo` = catalogo | su-misura
  - `qg_metodo_pagamento` = codice metodo (se indicato)
  - `qg_spedizione` = Sì | No
  - `qg_consegna_prevista` = AAAA-MM-GG (se indicata)
  - `qg_creato_da` = "Nuovo ordine su misura"
- **Nota ordine**: le note per il laboratorio.

Riga della borsa (prodotto del catalogo oppure articolo personalizzato con titolo e prezzo):

- Attributi riga: `Modello`, `Materiale`, `Colore`, `Manico`, `Zip` (solo se compilati)
- Se c'è il ricamo: `Ricamo` = Si, `Testo ricamo`, `Font ricamo`, `_qg_ricamo_group`

Riga del ricamo (variante "Ricamo personalizzato", 10 €), uguale agli ordini online:

- `Testo ricamo`, `Font ricamo`, `_qg_ricamo_group`, `_qg_ricamo_service` = true

## Corrispondenza con il foglio Ordini del gestionale

| Colonna foglio Ordini / `qg_ordini` | Da Shopify |
|---|---|
| Numero Ordine (2611-0296) | lo assegna il gestionale; il legame è `shopify_order_name` (es. #1012) |
| Data | data dell'ordine |
| Cliente Nome / Cognome / Email / Telefono | cliente dell'ordine |
| Modello, Materiale, Colore, Manico | attributi riga `Modello`, `Materiale`, `Colore`, `Manico` |
| Ricamo (SI/NO), Ricamo Scritta | attributo riga `Ricamo` = Si → SI; `Testo ricamo` → Ricamo Scritta |
| Prezzo | prezzo della borsa **+ la riga Ricamo personalizzato collegata** (stesso `_qg_ricamo_group`): nel foglio è una riga sola |
| Spedizione | `qg_spedizione` (ordini online: c'è una spedizione nell'ordine) |
| Metodo Pagamento | `qg_metodo_pagamento`; ordini online: SHOPIFY o PAYPAL secondo il gateway |
| Pagato, Incasso V / A | **non da Shopify**: li decide il gestionale con la riconciliazione |
| Provenienza | `qg_provenienza`; ordini online = SITO |
| Note | nota ordine |
| Stato, Produzione, Costo | solo gestionale |

Ogni riga Shopify "borsa" diventa una riga del foglio; la riga "Ricamo personalizzato" non diventa una riga a sé,
si somma alla borsa con lo stesso `_qg_ricamo_group`.

## Permessi dell'app

`read_products`, `read_customers`, `write_customers`, `write_draft_orders`, `read_orders`, `write_orders`.
Dopo il rilascio, Shopify chiede a Giacomo di approvare i nuovi permessi nell'admin di qgbags-v2.

## Funzionamento

Ordine creato con `draftOrderCreate`; se "Già pagato" viene completato con `draftOrderComplete` (pagamento registrato),
altrimenti resta bozza e dall'admin si invia la fattura al cliente. Nessun server esterno: l'estensione usa le API
dell'admin direttamente (Direct API access).

## Codice

- `extensions/qg-ordine-su-misura/` — estensione admin action (Preact, `@shopify/ui-extensions` 2026.7), target `admin.order-index.action.render`.
  - `src/ordine.mjs`: funzioni pure (validazione, `buildDraftOrderInput`, `buildCustomerInput`), testate in `tests/ordine-su-misura.test.mjs`.
  - `src/ActionExtension.jsx`: il modulo e le chiamate GraphQL (`fetch('shopify:admin/api/graphql.json')`):
    `customerCreate` (nuovo cliente) → `draftOrderCreate` → `draftOrderComplete` se "Già pagato".
- `extensions/qg-ordine-su-misura-bozze/` — stesso modulo da **Ordini bozza > Altre azioni**
  (target `admin.draft-order-index.action.render`; un'estensione admin action ha un solo target, quindi è una seconda estensione che riusa il codice della prima).
- Articolo dal catalogo: selettore varianti di Shopify (`shopify.resourcePicker({type: 'variant'})`). Cliente esistente: ricerca `customers(query:)`.

## Configurazione dell'app V2 (file non committato)

Il file `shopify.app.qg-bags-ricamo-v2.toml` resta solo sul Mac di Giacomo (è in `.gitignore`).
Per l'ordine su misura contiene queste righe:

```toml
[access_scopes]
scopes = "read_products,read_customers,write_customers,write_draft_orders,read_orders,write_orders"

[access.admin]
direct_api_mode = "offline"
embedded_app_direct_api_access = true
```

Rilascio: `shopify app deploy --config qg-bags-ricamo-v2 --allow-updates` (mai la config `qg-bags-ricamo`, che è l'app di qgbags.com).
