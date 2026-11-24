const test = require('node:test');
const assert = require('node:assert/strict');

const QGEmbroidery = require('../extensions/qg-ricamo/assets/qg-embroidery.js');

test('parseFonts trims labels and removes empty values', () => {
  assert.deepEqual(
    QGEmbroidery.parseFonts('Corsivo, Stampatello,  Elegante , ,'),
    ['Corsivo', 'Stampatello', 'Elegante']
  );
});

test('validateSelection rejects active embroidery without text', () => {
  const result = QGEmbroidery.validateSelection({
    enabled: true,
    text: '   ',
    font: 'Corsivo',
    fonts: ['Corsivo'],
    maxLength: 20
  });

  assert.equal(result.valid, false);
  assert.equal(result.error, 'Inserisci il testo del ricamo.');
});

test('validateSelection rejects fonts outside the configured list', () => {
  const result = QGEmbroidery.validateSelection({
    enabled: true,
    text: 'Giulia',
    font: 'Script',
    fonts: ['Corsivo', 'Stampatello'],
    maxLength: 20
  });

  assert.equal(result.valid, false);
  assert.equal(result.error, 'Scegli un font valido.');
});

test('buildCartItems creates linked bag and embroidery service items', () => {
  const items = QGEmbroidery.buildCartItems({
    bagVariantId: '111',
    embroideryVariantId: '999',
    quantity: 1,
    text: 'Giulia',
    font: 'Corsivo',
    groupId: 'qg-ricamo-test'
  });

  assert.deepEqual(items, [
    {
      id: 111,
      quantity: 1,
      properties: {
        Ricamo: 'Si',
        'Testo ricamo': 'Giulia',
        'Font ricamo': 'Corsivo',
        _qg_ricamo_group: 'qg-ricamo-test'
      }
    },
    {
      id: 999,
      quantity: 1,
      properties: {
        'Testo ricamo': 'Giulia',
        'Font ricamo': 'Corsivo',
        _qg_ricamo_group: 'qg-ricamo-test',
        _qg_ricamo_parent_variant: '111',
        _qg_ricamo_service: 'true'
      }
    }
  ]);
});

test('findOrphanEmbroideryLines returns service lines whose bag group is missing', () => {
  const orphanLines = QGEmbroidery.findOrphanEmbroideryLines([
    {
      line: 1,
      properties: {
        _qg_ricamo_service: 'true',
        _qg_ricamo_group: 'missing'
      }
    },
    {
      line: 2,
      properties: {
        Ricamo: 'Si',
        _qg_ricamo_group: 'kept'
      }
    },
    {
      line: 3,
      properties: {
        _qg_ricamo_service: 'true',
        _qg_ricamo_group: 'kept'
      }
    }
  ]);

  assert.deepEqual(orphanLines, [1]);
});

test('refreshCartAfterAdd uses ajaxCart drawer when available (old themes)', async () => {
  let loaded = false;
  const previousWindow = global.window;

  global.window = {
    ajaxCart: {
      load() {
        loaded = true;
      }
    },
    location: {
      href: ''
    }
  };

  try {
    await QGEmbroidery.refreshCartAfterAdd([]);
    assert.equal(loaded, true);
    assert.equal(global.window.location.href, '');
  } finally {
    global.window = previousWindow;
  }
});

test('addItems returns a local preview result without calling fetch in preview mode', async () => {
  let fetchCalled = false;
  const previousFetch = global.fetch;
  global.fetch = async () => {
    fetchCalled = true;
    throw new Error('fetch should not be called');
  };

  try {
    const result = await QGEmbroidery.addItems(
      [{ id: 111, quantity: 1 }],
      { previewMode: true }
    );

    assert.equal(fetchCalled, false);
    assert.deepEqual(result, {
      preview: true,
      items: [{ id: 111, quantity: 1 }]
    });
  } finally {
    global.fetch = previousFetch;
  }
});

test('toEventLines maps cart items to standard event lines', () => {
  assert.deepEqual(
    QGEmbroidery.toEventLines([
      { id: 111, quantity: 2, properties: {} },
      { id: '222', quantity: 0 }
    ]),
    [
      { merchandiseId: '111', quantity: 2 },
      { merchandiseId: '222', quantity: 1 }
    ]
  );
});
