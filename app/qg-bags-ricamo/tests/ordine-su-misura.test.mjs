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
} from '../extensions/qg-ordine-su-misura/src/ordine.mjs';

const attr = (list, key) => (list || []).find((a) => a.key === key)?.value;

function catalogo(extra = {}) {
  return {
    ...emptyForm(),
    provenienza: 'whatsapp',
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
  assert.deepEqual(input.tags, ['qg-su-misura', 'provenienza-whatsapp']);
  assert.equal(attr(input.customAttributes, 'qg_provenienza'), 'whatsapp');
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
    provenienza: 'showroom',
    tipo: 'su-misura',
    variante: null,
    titolo: 'Travel Bag su misura',
    prezzo: '165,5',
    modello: 'Travel Bag',
    tessuto: 'Neoprene verdone',
    manico: '11',
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
  assert.equal(attr(borsa.customAttributes, 'Modello'), 'Travel Bag');
  assert.equal(attr(borsa.customAttributes, 'Tessuto'), 'Neoprene verdone');
  assert.equal(attr(borsa.customAttributes, 'Manico'), '11');
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
  for (const k of ['provenienza', 'cliente', 'titolo', 'prezzo', 'modello', 'tessuto', 'quantita', 'testoRicamo', 'pagamento']) {
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
