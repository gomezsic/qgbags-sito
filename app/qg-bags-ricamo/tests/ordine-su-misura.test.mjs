import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RICAMO_VARIANT_ID,
  buildCustomerInput,
  buildDraftOrderInput,
  collectErrors,
  emptyForm,
  numericId,
  parsePrezzo,
  validate,
  preselectedCustomerId,
} from '../extensions/qg-ordine-su-misura/src/ordine.mjs';

const attr = (list, key) => (list || []).find((a) => a.key === key)?.value;

function catalogo(extra = {}) {
  return {
    ...emptyForm(),
    provenienza: 'CHAT',
    metodoPagamento: 'PAYPAL',
    cliente: {id: 'gid://shopify/Customer/1', displayName: 'Anna'},
    variante: {id: 'gid://shopify/ProductVariant/99', title: 'City Bag'},
    pagamento: 'pagato',
    ...extra,
  };
}

test('ordine dal catalogo senza ricamo: tag, attributi ordine, una riga', () => {
  const input = buildDraftOrderInput(catalogo({consegna: '2026-12-15', note: 'Cucire etichetta'}), {
    customerId: 'gid://shopify/Customer/1',
  });
  assert.deepEqual(input.tags, ['qg-su-misura', 'provenienza-chat']);
  assert.equal(attr(input.customAttributes, 'qg_provenienza'), 'CHAT');
  assert.equal(attr(input.customAttributes, 'qg_tipo'), 'catalogo');
  assert.equal(attr(input.customAttributes, 'qg_consegna_prevista'), '2026-12-15');
  assert.equal(attr(input.customAttributes, 'qg_creato_da'), 'Nuovo ordine su misura');
  assert.equal(input.note, 'Cucire etichetta');
  assert.deepEqual(input.purchasingEntity, {customerId: 'gid://shopify/Customer/1'});
  assert.equal(input.lineItems.length, 1);
  assert.deepEqual(input.lineItems[0], {variantId: 'gid://shopify/ProductVariant/99', quantity: 1});
});

test('su misura con ricamo: articolo personalizzato + riga Ricamo personalizzato collegata', () => {
  const form = {
    ...catalogo(),
    provenienza: 'SHOWROOM',
    metodoPagamento: 'CONTANTI',
    spedizione: true,
    tipo: 'su-misura',
    variante: null,
    titolo: 'Travel Bag su misura',
    prezzo: '165,5',
    modello: 'TRAVEL BAG',
    materiale: 'NEOPRENE',
    colore: 'ARMY',
    manico: 'HDL-11',
    zip: '',
    quantita: '2',
    ricamo: true,
    testoRicamo: '  Giulia   R. ',
    fontRicamo: 'Compatto',
  };
  assert.deepEqual(validate(form), {});
  const input = buildDraftOrderInput(form, {customerId: 'gid://shopify/Customer/1', groupId: 'qg-test', currencyCode: 'EUR'});
  assert.deepEqual(input.tags, ['qg-su-misura', 'provenienza-showroom', 'fuori-catalogo']);
  assert.equal(attr(input.customAttributes, 'qg_tipo'), 'su-misura');
  assert.equal(attr(input.customAttributes, 'qg_consegna_prevista'), undefined);

  const [borsa, ricamo] = input.lineItems;
  assert.equal(borsa.title, 'Travel Bag su misura');
  assert.deepEqual(borsa.originalUnitPriceWithCurrency, {amount: '165.50', currencyCode: 'EUR'});
  assert.equal(borsa.quantity, 2);
  assert.equal(attr(borsa.customAttributes, 'Modello'), 'TRAVEL BAG');
  assert.equal(attr(borsa.customAttributes, 'Materiale'), 'NEOPRENE');
  assert.equal(attr(borsa.customAttributes, 'Colore'), 'ARMY');
  assert.equal(attr(input.customAttributes, 'qg_metodo_pagamento'), 'CONTANTI');
  assert.equal(attr(input.customAttributes, 'qg_spedizione'), 'Sì');
  assert.equal(attr(borsa.customAttributes, 'Manico'), 'HDL-11');
  assert.equal(attr(borsa.customAttributes, 'Zip'), undefined);
  assert.equal(attr(borsa.customAttributes, 'Ricamo'), 'Si');
  assert.equal(attr(borsa.customAttributes, 'Testo ricamo'), 'Giulia R.');
  assert.equal(attr(borsa.customAttributes, 'Font ricamo'), 'Compatto');
  assert.equal(attr(borsa.customAttributes, '_qg_ricamo_group'), 'qg-test');

  assert.equal(ricamo.variantId, RICAMO_VARIANT_ID);
  assert.equal(ricamo.quantity, 2);
  assert.equal(attr(ricamo.customAttributes, 'Testo ricamo'), 'Giulia R.');
  assert.equal(attr(ricamo.customAttributes, '_qg_ricamo_group'), 'qg-test');
  assert.equal(attr(ricamo.customAttributes, '_qg_ricamo_service'), 'true');
});

test('validazione: campi obbligatori e limiti', () => {
  const e = validate({...emptyForm(), tipo: 'su-misura', quantita: '0', ricamo: true, testoRicamo: 'x'.repeat(21)});
  for (const k of ['provenienza', 'cliente', 'titolo', 'prezzo', 'modello', 'materiale', 'quantita', 'testoRicamo', 'pagamento']) {
    assert.ok(e[k], `manca errore ${k}`);
  }
  const nuovo = validate({...catalogo(), clienteTipo: 'nuovo', nuovoCliente: {nome: '', cognome: '', email: 'x', telefono: ''}});
  assert.ok(nuovo.nomeCliente);
  assert.ok(nuovo.contattoCliente);
});

test('nuovo cliente: input customerCreate e contatti sulla bozza', () => {
  const nuovoCliente = {nome: 'Marta', cognome: 'Rossi', email: 'marta@example.com', telefono: '+39 333 1234567'};
  assert.deepEqual(buildCustomerInput(nuovoCliente), {
    firstName: 'Marta', lastName: 'Rossi', email: 'marta@example.com', phone: '+39 333 1234567', tags: ['qg-su-misura'],
  });
  const input = buildDraftOrderInput(catalogo({clienteTipo: 'nuovo', nuovoCliente}), {customerId: 'gid://shopify/Customer/7'});
  assert.equal(input.email, 'marta@example.com');
  assert.equal(input.phone, '+39 333 1234567');
});

test('utilità: prezzo, id numerico, errori GraphQL', () => {
  assert.equal(parsePrezzo('150'), '150.00');
  assert.equal(parsePrezzo('€ 59,90'), '59.90');
  assert.equal(parsePrezzo('0'), null);
  assert.equal(parsePrezzo('abc'), null);
  assert.equal(numericId('gid://shopify/DraftOrder/123'), '123');
  assert.deepEqual(
    collectErrors({errors: [{message: 'Access denied'}], data: {draftOrderCreate: {userErrors: [{field: ['input', 'email'], message: 'non valida'}]}}}, 'draftOrderCreate'),
    ['Access denied', 'non valida (input.email)'],
  );
});

test('pagina cliente: precompila il cliente solo dal target cliente', () => {
  const data = {selected: [{id: 'gid://shopify/Customer/42'}]};
  assert.equal(preselectedCustomerId('admin.customer-details.action.render', data), 'gid://shopify/Customer/42');
  assert.equal(preselectedCustomerId('admin.product-index.action.render', data), null);
  assert.equal(preselectedCustomerId('admin.order-index.action.render', {selected: []}), null);
  assert.equal(preselectedCustomerId('admin.customer-details.action.render', {selected: []}), null);
  assert.equal(preselectedCustomerId('admin.customer-details.action.render', undefined), null);
  assert.equal(preselectedCustomerId('admin.customer-details.action.render', {selected: [{id: 'gid://shopify/Product/1'}]}), null);
});

test('i dati della borsa e del ricamo sono anche negli attributi ordine (export CSV)', () => {
  const form = {
    ...catalogo(),
    tipo: 'su-misura',
    variante: null,
    titolo: 'Travel su misura',
    prezzo: '140',
    modello: 'TRAVEL BAG',
    materiale: 'NEOPRENE',
    colore: 'ARMY',
    manico: 'HDL-11',
    zip: 'NERO',
    ricamo: true,
    testoRicamo: 'R.B.',
    fontRicamo: 'Corsivo',
    consegna: '2026-12-20',
    note: 'Fodera panna',
  };
  const input = buildDraftOrderInput(form, {groupId: 'g1'});
  const a = (k) => attr(input.customAttributes, k);
  assert.equal(a('qg_modello'), 'TRAVEL BAG');
  assert.equal(a('qg_materiale'), 'NEOPRENE');
  assert.equal(a('qg_colore'), 'ARMY');
  assert.equal(a('qg_manico'), 'HDL-11');
  assert.equal(a('qg_zip'), 'NERO');
  assert.equal(a('qg_ricamo'), 'SI');
  assert.equal(a('qg_ricamo_scritta'), 'R.B.');
  assert.equal(a('qg_ricamo_font'), 'Corsivo');
  assert.equal(a('qg_consegna_prevista'), '2026-12-20');
  assert.equal(a('qg_note'), 'Fodera panna');
  assert.equal(input.lineItems[0].sku, 'QG-SM-TRAVEL-BAG');
  const senza = buildDraftOrderInput(catalogo());
  assert.equal(attr(senza.customAttributes, 'qg_ricamo'), 'NO');
  assert.equal(attr(senza.customAttributes, 'qg_ricamo_scritta'), undefined);
});
