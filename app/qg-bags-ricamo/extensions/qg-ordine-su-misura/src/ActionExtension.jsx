import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {useEffect, useRef, useState} from 'preact/hooks';
import {
  FONT_RICAMO,
  MATERIALI,
  METODI_PAGAMENTO,
  MODELLI,
  PROVENIENZE,
  RICAMO_MAX,
  buildCustomerInput,
  buildDraftOrderInput,
  collectErrors,
  emptyForm,
  numericId,
  validate,
} from './ordine.mjs';

export default async () => {
  render(<Extension />, document.body);
};

async function gql(query, variables) {
  const res = await fetch('shopify:admin/api/graphql.json', {
    method: 'POST',
    body: JSON.stringify({query, variables}),
  });
  if (!res.ok) throw new Error(`Errore di rete (${res.status})`);
  return res.json();
}

const Q_SHOP = `query { shop { currencyCode } }`;
const Q_CUSTOMERS = `query($q: String!) {
  customers(first: 6, query: $q) { nodes { id displayName email phone } }
}`;
const M_CUSTOMER = `mutation($input: CustomerInput!) {
  customerCreate(input: $input) { customer { id displayName } userErrors { field message } }
}`;
const M_DRAFT = `mutation($input: DraftOrderInput!) {
  draftOrderCreate(input: $input) { draftOrder { id name invoiceUrl } userErrors { field message } }
}`;
const M_COMPLETE = `mutation($id: ID!) {
  draftOrderComplete(id: $id) { draftOrder { id order { id name } } userErrors { field message } }
}`;

function Extension() {
  const {close} = shopify;
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [apiErrors, setApiErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [currency, setCurrency] = useState('EUR');
  const [search, setSearch] = useState('');
  const [found, setFound] = useState([]);
  const timer = useRef(null);

  const set = (patch) => setForm((f) => ({...f, ...patch}));
  const setNuovo = (patch) => setForm((f) => ({...f, nuovoCliente: {...f.nuovoCliente, ...patch}}));
  const val = (e) => e.currentTarget.value;

  useEffect(() => {
    gql(Q_SHOP).then((j) => j?.data?.shop?.currencyCode && setCurrency(j.data.shop.currencyCode)).catch(() => {});
  }, []);

  function onSearch(e) {
    const q = val(e);
    setSearch(q);
    clearTimeout(timer.current);
    if (q.trim().length < 2) return setFound([]);
    timer.current = setTimeout(async () => {
      try {
        const j = await gql(Q_CUSTOMERS, {q: q.trim()});
        setFound(j?.data?.customers?.nodes || []);
        const errs = collectErrors(j, 'customers');
        if (errs.length) setApiErrors(errs);
      } catch (err) {
        setApiErrors([String(err.message || err)]);
      }
    }, 300);
  }

  async function scegliBorsa() {
    const sel = await shopify.resourcePicker({type: 'variant', action: 'select', multiple: false});
    if (sel && sel[0]) {
      const v = sel[0];
      set({variante: {id: v.id, title: v.displayName || v.title, price: v.price}});
    }
  }

  async function crea() {
    setApiErrors([]);
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      let customerId = form.clienteTipo === 'esistente' ? form.cliente.id : null;
      if (form.clienteTipo === 'nuovo') {
        const j = await gql(M_CUSTOMER, {input: buildCustomerInput(form.nuovoCliente)});
        const errs = collectErrors(j, 'customerCreate');
        if (errs.length) return setApiErrors(['Cliente non creato:', ...errs]);
        customerId = j.data.customerCreate.customer.id;
        set({clienteTipo: 'esistente', cliente: j.data.customerCreate.customer});
      }
      const input = buildDraftOrderInput(form, {customerId, currencyCode: currency});
      const j = await gql(M_DRAFT, {input});
      const errs = collectErrors(j, 'draftOrderCreate');
      if (errs.length) return setApiErrors(['Ordine non creato:', ...errs]);
      const draft = j.data.draftOrderCreate.draftOrder;
      if (form.pagamento === 'pagato') {
        const c = await gql(M_COMPLETE, {id: draft.id});
        const cerrs = collectErrors(c, 'draftOrderComplete');
        if (cerrs.length) {
          setResult({tipo: 'bozza', name: draft.name, id: draft.id, invoiceUrl: draft.invoiceUrl});
          return setApiErrors([`Bozza ${draft.name} creata ma non completata:`, ...cerrs]);
        }
        const order = c.data.draftOrderComplete.draftOrder.order;
        setResult({tipo: 'ordine', name: order.name, id: order.id});
      } else {
        setResult({tipo: 'bozza', name: draft.name, id: draft.id, invoiceUrl: draft.invoiceUrl});
      }
    } catch (err) {
      setApiErrors([String(err.message || err)]);
    } finally {
      setSaving(false);
    }
  }

  if (result) {
    const href = result.tipo === 'ordine'
      ? `shopify://admin/orders/${numericId(result.id)}`
      : `shopify://admin/draft_orders/${numericId(result.id)}`;
    return (
      <s-admin-action heading="Nuovo ordine su misura">
        <s-stack direction="block" gap="base">
          <s-banner tone="success" heading={result.tipo === 'ordine' ? `Ordine ${result.name} creato` : `Bozza ${result.name} creata`}>
            {result.tipo === 'ordine'
              ? 'Ordine registrato come già pagato.'
              : 'Da pagare: apri la bozza e invia la fattura al cliente.'}
          </s-banner>
          {apiErrors.length > 0 && <Errori list={apiErrors} />}
          <s-link href={href}>{result.tipo === 'ordine' ? `Apri ordine ${result.name}` : `Apri bozza ${result.name}`}</s-link>
          {result.invoiceUrl && <s-text>Link di pagamento: {result.invoiceUrl}</s-text>}
        </s-stack>
        <s-button slot="primary-action" onClick={() => close()}>Chiudi</s-button>
        <s-button slot="secondary-actions" onClick={() => { setResult(null); setForm(emptyForm()); setApiErrors([]); }}>
          Nuovo ordine
        </s-button>
      </s-admin-action>
    );
  }

  const testoLen = (form.testoRicamo || '').length;

  return (
    <s-admin-action heading="Nuovo ordine su misura" loading={saving}>
      <s-stack direction="block" gap="base">
        {apiErrors.length > 0 && <Errori list={apiErrors} />}

        <s-select label="Provenienza" value={form.provenienza} error={errors.provenienza}
          onChange={(e) => set({provenienza: val(e)})}>
          <s-option value="">Scegli…</s-option>
          {PROVENIENZE.map((p) => <s-option value={p.value}>{p.label}</s-option>)}
        </s-select>

        <s-section heading="Cliente">
          <s-stack direction="block" gap="base">
            <s-choice-list name="clienteTipo" values={[form.clienteTipo]}
              onChange={(e) => set({clienteTipo: e.currentTarget.values[0]})}>
              <s-choice value="esistente" selected={form.clienteTipo === 'esistente'}>Cliente esistente</s-choice>
              <s-choice value="nuovo" selected={form.clienteTipo === 'nuovo'}>Nuovo cliente</s-choice>
            </s-choice-list>
            {form.clienteTipo === 'esistente' ? (
              <s-stack direction="block" gap="small">
                {form.cliente ? (
                  <s-stack direction="inline" gap="base" alignItems="center">
                    <s-text type="strong">{form.cliente.displayName}</s-text>
                    <s-button variant="tertiary" onClick={() => set({cliente: null})}>Cambia</s-button>
                  </s-stack>
                ) : (
                  <>
                    <s-search-field label="Cerca cliente" placeholder="Nome, email o telefono"
                      value={search} error={errors.cliente} onInput={onSearch} />
                    {found.map((c) => (
                      <s-button variant="secondary" onClick={() => { set({cliente: c}); setFound([]); setSearch(''); }}>
                        {c.displayName}{c.email ? ` · ${c.email}` : c.phone ? ` · ${c.phone}` : ''}
                      </s-button>
                    ))}
                  </>
                )}
              </s-stack>
            ) : (
              <s-stack direction="block" gap="small">
                <s-text-field label="Nome" value={form.nuovoCliente.nome} error={errors.nomeCliente}
                  onInput={(e) => setNuovo({nome: val(e)})} />
                <s-text-field label="Cognome" value={form.nuovoCliente.cognome}
                  onInput={(e) => setNuovo({cognome: val(e)})} />
                <s-email-field label="Email" value={form.nuovoCliente.email} error={errors.contattoCliente}
                  onInput={(e) => setNuovo({email: val(e)})} />
                <s-text-field label="Telefono" value={form.nuovoCliente.telefono}
                  onInput={(e) => setNuovo({telefono: val(e)})} />
              </s-stack>
            )}
          </s-stack>
        </s-section>

        <s-section heading="Articolo">
          <s-stack direction="block" gap="base">
            <s-choice-list name="tipo" values={[form.tipo]} onChange={(e) => set({tipo: e.currentTarget.values[0]})}>
              <s-choice value="catalogo" selected={form.tipo === 'catalogo'}>Dal catalogo</s-choice>
              <s-choice value="su-misura" selected={form.tipo === 'su-misura'}>Su misura / fuori catalogo</s-choice>
            </s-choice-list>
            {form.tipo === 'catalogo' ? (
              <s-stack direction="block" gap="small">
                {form.variante && <s-text type="strong">{form.variante.title}{form.variante.price ? ` · ${form.variante.price} ${currency}` : ''}</s-text>}
                <s-button onClick={scegliBorsa}>{form.variante ? 'Cambia borsa' : 'Scegli borsa dal catalogo'}</s-button>
                {errors.variante && <s-text tone="critical">{errors.variante}</s-text>}
              </s-stack>
            ) : (
              <s-stack direction="block" gap="small">
                <s-text-field label="Nome articolo" value={form.titolo} error={errors.titolo}
                  onInput={(e) => set({titolo: val(e)})} />
                <s-text-field label={`Prezzo (${currency})`} value={form.prezzo} error={errors.prezzo}
                  placeholder="150,00" onInput={(e) => set({prezzo: val(e)})} />
              </s-stack>
            )}
            <s-select label="Modello" value={form.modello} error={errors.modello} onChange={(e) => set({modello: val(e)})}>
              <s-option value="">{form.tipo === 'su-misura' ? 'Scegli…' : '—'}</s-option>
              {MODELLI.map((m) => <s-option value={m}>{m}</s-option>)}
            </s-select>
            <s-select label="Materiale" value={form.materiale} error={errors.materiale} onChange={(e) => set({materiale: val(e)})}>
              <s-option value="">{form.tipo === 'su-misura' ? 'Scegli…' : '—'}</s-option>
              {MATERIALI.map((m) => <s-option value={m}>{m}</s-option>)}
            </s-select>
            <s-text-field label="Colore" value={form.colore} placeholder="es. BLU SCURO" onInput={(e) => set({colore: val(e).toUpperCase()})} />
            <s-text-field label="Manico" value={form.manico} placeholder="codice, es. HDL-10" onInput={(e) => set({manico: val(e).toUpperCase()})} />
            <s-text-field label="Zip" value={form.zip} onInput={(e) => set({zip: val(e)})} />
            <s-number-field label="Quantità" value={form.quantita} min={1} step={1} error={errors.quantita}
              onInput={(e) => set({quantita: val(e)})} />
          </s-stack>
        </s-section>

        <s-section heading="Ricamo">
          <s-stack direction="block" gap="small">
            <s-checkbox label="Aggiungi ricamo (+ Ricamo personalizzato 10 €)" checked={form.ricamo}
              onChange={(e) => set({ricamo: e.currentTarget.checked})} />
            {form.ricamo && (
              <>
                <s-text-field label="Testo ricamo" value={form.testoRicamo} maxLength={RICAMO_MAX}
                  details={`${testoLen}/${RICAMO_MAX} caratteri`} error={errors.testoRicamo}
                  onInput={(e) => set({testoRicamo: val(e)})} />
                <s-select label="Font ricamo" value={form.fontRicamo} error={errors.fontRicamo}
                  onChange={(e) => set({fontRicamo: val(e)})}>
                  {FONT_RICAMO.map((f) => <s-option value={f}>{f}</s-option>)}
                </s-select>
              </>
            )}
          </s-stack>
        </s-section>

        <s-section heading="Consegna e laboratorio">
          <s-stack direction="block" gap="small">
            <s-checkbox label="Da spedire" checked={form.spedizione}
              onChange={(e) => set({spedizione: e.currentTarget.checked})} />
            <s-date-field label="Consegna prevista" value={form.consegna} error={errors.consegna}
              onChange={(e) => set({consegna: val(e)})} />
            <s-text-area label="Note per il laboratorio" value={form.note} rows={3}
              onInput={(e) => set({note: val(e)})} />
          </s-stack>
        </s-section>

        <s-choice-list label="Pagamento" name="pagamento" values={form.pagamento ? [form.pagamento] : []}
          error={errors.pagamento} onChange={(e) => set({pagamento: e.currentTarget.values[0]})}>
          <s-choice value="pagato" selected={form.pagamento === 'pagato'}>Già pagato (ordine completato)</s-choice>
          <s-choice value="da-pagare" selected={form.pagamento === 'da-pagare'}>Da pagare (bozza con fattura da inviare)</s-choice>
        </s-choice-list>
        <s-select label="Metodo di pagamento" value={form.metodoPagamento} error={errors.metodoPagamento}
          details="Solo informativo: il pagamento lo conferma il gestionale quando trova l'incasso."
          onChange={(e) => set({metodoPagamento: val(e)})}>
          <s-option value="">—</s-option>
          {METODI_PAGAMENTO.map((m) => <s-option value={m}>{m}</s-option>)}
        </s-select>
      </s-stack>
      <s-button slot="primary-action" variant="primary" loading={saving} disabled={saving} onClick={crea}>
        Crea ordine
      </s-button>
      <s-button slot="secondary-actions" onClick={() => close()}>Annulla</s-button>
    </s-admin-action>
  );
}

function Errori({list}) {
  return (
    <s-banner tone="critical" heading="Qualcosa non è andato">
      <s-stack direction="block" gap="small-200">
        {list.map((m) => <s-text>{m}</s-text>)}
      </s-stack>
    </s-banner>
  );
}
