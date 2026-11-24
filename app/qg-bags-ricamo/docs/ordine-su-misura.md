# Nuovo ordine su misura

Pulsante nell'admin Shopify (app QG Bags Ricamo V2) per registrare gli ordini che non passano dal negozio online:
WhatsApp, telefono, showroom, email, spesso con pezzi fuori catalogo o su misura.
Ogni ordine nasce in Shopify con tutti i dati già compilati, così il gestionale lo scarica via API come gli ordini online.

## Dove si trova

Admin Shopify > **Ordini** > **Altre azioni** > **Nuovo ordine su misura**
(estensione admin `qg-ordine-su-misura`, target `admin.order-index.action.render`).

## Cosa si compila

| Campo | Obbligatorio | Note |
|---|---|---|
| Provenienza | sì | WhatsApp, Telefono, Showroom, Email, Altro |
| Cliente | sì | cliente esistente (ricerca) oppure nuovo: nome, cognome, email e/o telefono |
| Tipo di articolo | sì | **Dal catalogo** (si cerca la borsa) oppure **Su misura / fuori catalogo** (titolo + prezzo) |
| Modello | su misura | Travel Bag, City Bag, Grace Bag, Beauty Classic, Beauty Man, Pochette, Pochettona, Pillola, Pillola Plus, Micro Pillola, Altro |
| Tessuto | su misura | testo libero (poi elenco dall'Archivio del configuratore) |
| Manico | no | testo libero |
| Zip | no | testo libero |
| Quantità | sì | default 1 |
| Ricamo | no | testo (max 20 caratteri) + font Corsivo / Stampatello / Compatto; aggiunge la riga "Ricamo personalizzato" a 10 € |
| Consegna prevista | no | data |
| Note per il laboratorio | no | testo libero |
| Pagamento | sì | **Già pagato** (ordine completato) oppure **Da pagare** (bozza con fattura/link di pagamento da mandare al cliente) |

## Come viene salvato in Shopify (per il gestionale)

Ordine (o bozza d'ordine se "Da pagare"):

- **Tag ordine**: `qg-su-misura`, `provenienza-<valore>` (es. `provenienza-whatsapp`), `fuori-catalogo` se c'è un articolo personalizzato.
- **Attributi dell'ordine** (`customAttributes` / note attributes):
  - `qg_provenienza` = whatsapp | telefono | showroom | email | altro
  - `qg_tipo` = catalogo | su-misura
  - `qg_consegna_prevista` = AAAA-MM-GG (se indicata)
  - `qg_creato_da` = "Nuovo ordine su misura"
- **Nota ordine**: le note per il laboratorio.

Riga della borsa (prodotto del catalogo oppure articolo personalizzato con titolo e prezzo):

- Attributi riga: `Modello`, `Tessuto`, `Manico`, `Zip` (solo se compilati)
- Se c'è il ricamo: `Ricamo` = Si, `Testo ricamo`, `Font ricamo`, `_qg_ricamo_group`

Riga del ricamo (variante "Ricamo personalizzato", 10 €), uguale agli ordini online:

- `Testo ricamo`, `Font ricamo`, `_qg_ricamo_group`, `_qg_ricamo_service` = true

Gli stessi nomi (`Testo ricamo`, `Font ricamo`, `_qg_ricamo_group`) sono quelli usati dal blocco ricamo del sito,
quindi il gestionale legge allo stesso modo ordini online e ordini su misura.

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
