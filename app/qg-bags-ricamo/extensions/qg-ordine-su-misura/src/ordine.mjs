// Funzioni pure per "Nuovo ordine su misura": validazione del modulo e
// costruzione dell'input di draftOrderCreate. Nessuna dipendenza da Shopify,
// così si testano con `node --test` (tests/ordine-su-misura.test.mjs).
// Specifica: docs/ordine-su-misura.md

export const RICAMO_VARIANT_ID = 'gid://shopify/ProductVariant/54055138754896';
export const RICAMO_MAX = 20;
export const CREATO_DA = 'Nuovo ordine su misura';

// Valori allineati al gestionale QGbags (colonne del foglio Ordini / tabelle qg_provenienze,
// qg_metodi_pagamento, qg_configuratore_modelli). Quando il gestionale esporrà i codici del
// configuratore, queste liste verranno lette da lì.
export const PROVENIENZE = [
  {value: 'CHAT', label: 'Chat / WhatsApp'},
  {value: 'SHOWROOM', label: 'Showroom'},
  {value: 'MAIL', label: 'Email'},
  {value: 'IG', label: 'Instagram'},
  {value: 'BAZAR', label: 'Bazar'},
  {value: 'EVENTO', label: 'Evento'},
  {value: 'VERSILIANI', label: 'Versiliani'},
  {value: 'ANDREA', label: 'Andrea'},
  {value: 'BABI', label: 'Babi'},
];

export const METODI_PAGAMENTO = [
  'BONIFICO', 'PAYPAL', 'POS', 'CONTANTI', 'CONSEGNA', 'SHOPIFY', 'STRIPE', 'SCALAPAY', 'CAMPIONI', 'OMAGGIO',
];

export const MODELLI = [
  'CITY BAG', 'TRAVEL BAG', 'GRACE BAG', 'BEAUTY CLASSIC', 'BEAUTY MAN', 'BRIOCHE BAG', 'MINI BRIOCHE',
  'GRESSINA', 'CARLOTTA', 'CUORICINO', 'VALENTINA', 'BORSINO', 'POCHETTE', 'POCHETTONA', 'PILLOLA',
  'PILLOLA PLUS', 'PILLOLA PARLANTE', 'MICRO PILLOLA', 'CECI', 'ACCIUGA', 'SOGLIOLA', 'SUPER BAG',
  'SAC BAG', 'LADY BAG', 'SQUARE BAG', 'ZAINO', 'TRACOLLA', 'TRACOLLINA', 'PORTACHIAVI',
  'PORTA OCCHIALI', 'PORTA PC', 'GUINZAGLIO', 'CINTURA', 'ALTRO',
];

export const MATERIALI = [
  'NEOPRENE', 'VELLUTO', 'FROZEN', 'PELOSINO', 'JAPAN', "TRAME'", 'CANVAS', 'COTONE', 'JEANS', 'PELLE',
  'SPUGNA', 'TARTAN', 'LEOPARDO', 'STAMPATO', 'ALTRO',
];

export const FONT_RICAMO = ['Corsivo', 'Stampatello', 'Compatto'];

export function emptyForm() {
  return {
    provenienza: '',
    clienteTipo: 'esistente', // esistente | nuovo
    cliente: null, // {id, displayName}
    nuovoCliente: {nome: '', cognome: '', email: '', telefono: ''},
    tipo: 'catalogo', // catalogo | su-misura
    variante: null, // {id, title}
    titolo: '',
    prezzo: '',
    modello: '',
    materiale: '',
    colore: '',
    manico: '',
    zip: '',
    quantita: '1',
    ricamo: false,
    testoRicamo: '',
    fontRicamo: FONT_RICAMO[0],
    consegna: '',
    note: '',
    pagamento: '', // pagato | da-pagare
    metodoPagamento: '',
    spedizione: false,
  };
}

const clean = (v) => String(v == null ? '' : v).trim();

export function normalizeRicamo(text) {
  return clean(text).replace(/\s+/g, ' ');
}

export function parsePrezzo(v) {
  const s = clean(v).replace(/\s|€/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return n > 0 ? n.toFixed(2) : null;
}

export function parseQuantita(v) {
  const n = Number(clean(v));
  return Number.isInteger(n) && n >= 1 ? n : null;
}

// Restituisce {campo: messaggio}; vuoto se il modulo è valido.
export function validate(form) {
  const e = {};
  if (!PROVENIENZE.some((p) => p.value === form.provenienza)) e.provenienza = 'Scegli la provenienza.';
  if (form.clienteTipo === 'nuovo') {
    const c = form.nuovoCliente || {};
    if (!clean(c.nome) && !clean(c.cognome)) e.nomeCliente = 'Scrivi nome o cognome.';
    if (!clean(c.email) && !clean(c.telefono)) e.contattoCliente = 'Serve almeno email o telefono.';
    if (clean(c.email) && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean(c.email))) e.contattoCliente = 'Email non valida.';
  } else if (!form.cliente || !form.cliente.id) {
    e.cliente = 'Scegli un cliente o creane uno nuovo.';
  }
  if (form.tipo === 'catalogo') {
    if (!form.variante || !form.variante.id) e.variante = 'Scegli la borsa dal catalogo.';
  } else {
    if (!clean(form.titolo)) e.titolo = "Scrivi il nome dell'articolo.";
    if (!parsePrezzo(form.prezzo)) e.prezzo = 'Prezzo non valido (es. 150 o 150,00).';
    if (!clean(form.modello)) e.modello = 'Scegli il modello.';
    if (!clean(form.materiale)) e.materiale = 'Scegli il materiale.';
  }
  if (!parseQuantita(form.quantita)) e.quantita = 'Quantità non valida.';
  if (form.ricamo) {
    const t = normalizeRicamo(form.testoRicamo);
    if (!t) e.testoRicamo = 'Scrivi il testo del ricamo.';
    else if (t.length > RICAMO_MAX) e.testoRicamo = `Massimo ${RICAMO_MAX} caratteri.`;
    if (!FONT_RICAMO.includes(form.fontRicamo)) e.fontRicamo = 'Scegli il font.';
  }
  if (clean(form.consegna) && !/^\d{4}-\d{2}-\d{2}$/.test(clean(form.consegna))) e.consegna = 'Data non valida.';
  if (form.pagamento !== 'pagato' && form.pagamento !== 'da-pagare') e.pagamento = 'Scegli se è già pagato.';
  if (form.metodoPagamento && !METODI_PAGAMENTO.includes(form.metodoPagamento)) e.metodoPagamento = 'Metodo non valido.';
  if (form.pagamento === 'pagato' && !form.metodoPagamento) e.metodoPagamento = 'Scegli come ha pagato.';
  return e;
}

export function createGroupId(now = Date.now(), rnd = Math.random()) {
  return `qg-${now.toString(36)}-${Math.floor(rnd * 1e8).toString(36)}`;
}

// Input di draftOrderCreate (Admin GraphQL 2026-07).
// opts: {customerId, currencyCode, groupId}
export function buildDraftOrderInput(form, opts = {}) {
  const currencyCode = opts.currencyCode || 'EUR';
  const quantity = parseQuantita(form.quantita) || 1;
  const suMisura = form.tipo === 'su-misura';
  const ricamo = !!form.ricamo;
  const testo = normalizeRicamo(form.testoRicamo);
  const font = clean(form.fontRicamo);
  const groupId = ricamo ? opts.groupId || createGroupId() : null;

  const tags = ['qg-su-misura', `provenienza-${form.provenienza.toLowerCase()}`];
  if (suMisura) tags.push('fuori-catalogo');

  const customAttributes = [
    {key: 'qg_provenienza', value: form.provenienza},
    {key: 'qg_tipo', value: suMisura ? 'su-misura' : 'catalogo'},
  ];
  if (form.metodoPagamento) customAttributes.push({key: 'qg_metodo_pagamento', value: form.metodoPagamento});
  customAttributes.push({key: 'qg_spedizione', value: form.spedizione ? 'Sì' : 'No'});
  if (clean(form.consegna)) customAttributes.push({key: 'qg_consegna_prevista', value: clean(form.consegna)});
  customAttributes.push({key: 'qg_creato_da', value: CREATO_DA});

  const rigaAttr = [];
  for (const [key, val] of [['Modello', form.modello], ['Materiale', form.materiale], ['Colore', form.colore], ['Manico', form.manico], ['Zip', form.zip]]) {
    if (clean(val)) rigaAttr.push({key, value: clean(val)});
  }
  if (ricamo) {
    rigaAttr.push(
      {key: 'Ricamo', value: 'Si'},
      {key: 'Testo ricamo', value: testo},
      {key: 'Font ricamo', value: font},
      {key: '_qg_ricamo_group', value: groupId},
    );
  }

  const borsa = suMisura
    ? {
        title: clean(form.titolo),
        originalUnitPriceWithCurrency: {amount: parsePrezzo(form.prezzo), currencyCode},
        quantity,
        requiresShipping: !!form.spedizione,
        taxable: true,
      }
    : {variantId: form.variante.id, quantity};
  if (rigaAttr.length) borsa.customAttributes = rigaAttr;

  const lineItems = [borsa];
  if (ricamo) {
    lineItems.push({
      variantId: RICAMO_VARIANT_ID,
      quantity,
      customAttributes: [
        {key: 'Testo ricamo', value: testo},
        {key: 'Font ricamo', value: font},
        {key: '_qg_ricamo_group', value: groupId},
        {key: '_qg_ricamo_service', value: 'true'},
      ],
    });
  }

  const input = {tags, customAttributes, lineItems};
  if (clean(form.note)) input.note = clean(form.note);
  if (opts.customerId) input.purchasingEntity = {customerId: opts.customerId};
  if (form.clienteTipo === 'nuovo') {
    const c = form.nuovoCliente || {};
    if (clean(c.email)) input.email = clean(c.email);
    if (clean(c.telefono)) input.phone = clean(c.telefono);
  }
  return input;
}

export function buildCustomerInput(nuovo) {
  const input = {};
  if (clean(nuovo.nome)) input.firstName = clean(nuovo.nome);
  if (clean(nuovo.cognome)) input.lastName = clean(nuovo.cognome);
  if (clean(nuovo.email)) input.email = clean(nuovo.email);
  if (clean(nuovo.telefono)) input.phone = clean(nuovo.telefono);
  input.tags = ['qg-su-misura'];
  return input;
}

// Da "gid://shopify/DraftOrder/123" a "123".
export function numericId(gid) {
  const m = String(gid || '').match(/(\d+)$/);
  return m ? m[1] : '';
}

// Messaggi leggibili da una risposta GraphQL (errori di rete/schema + userErrors).
export function collectErrors(json, field) {
  const out = [];
  if (json && Array.isArray(json.errors)) for (const e of json.errors) out.push(e.message);
  const payload = json && json.data && json.data[field];
  if (payload && Array.isArray(payload.userErrors)) {
    for (const e of payload.userErrors) {
      const where = Array.isArray(e.field) && e.field.length ? ` (${e.field.join('.')})` : '';
      out.push(`${e.message}${where}`);
    }
  }
  return out;
}

// Aperto dalla pagina di un cliente (Clienti > cliente > Altre azioni):
// restituisce il gid del cliente selezionato, altrimenti null.
export const TARGET_CLIENTE = 'admin.customer-details.action.render';
export function preselectedCustomerId(target, data) {
  if (target !== TARGET_CLIENTE) return null;
  const id = data && Array.isArray(data.selected) && data.selected[0] && data.selected[0].id;
  return typeof id === 'string' && id.startsWith('gid://shopify/Customer/') ? id : null;
}
