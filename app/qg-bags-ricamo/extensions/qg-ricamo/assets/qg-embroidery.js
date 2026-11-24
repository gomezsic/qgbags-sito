(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.QGEmbroidery = factory();
    if (typeof document !== 'undefined') {
      document.addEventListener('DOMContentLoaded', function () {
        root.QGEmbroidery.init(document);
      });
      document.addEventListener('shopify:section:load', function (event) {
        root.QGEmbroidery.init(event.target);
      });
    }
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function parseFonts(value) {
    return String(value || '')
      .split(',')
      .map(function (font) {
        return font.trim();
      })
      .filter(Boolean);
  }

  function normalizeText(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
  }

  function validateSelection(selection) {
    if (!selection.enabled) {
      return { valid: true, error: '' };
    }

    var text = normalizeText(selection.text);
    var fonts = selection.fonts || [];
    var font = String(selection.font || '').trim();
    var maxLength = Number(selection.maxLength || 0);

    if (!text) {
      return { valid: false, error: 'Inserisci il testo del ricamo.' };
    }

    if (maxLength > 0 && text.length > maxLength) {
      return { valid: false, error: 'Il testo del ricamo e troppo lungo.' };
    }

    if (!font || fonts.indexOf(font) === -1) {
      return { valid: false, error: 'Scegli un font valido.' };
    }

    return { valid: true, error: '', text: text, font: font };
  }

  function createGroupId() {
    var random = Math.random().toString(36).slice(2, 8);
    return 'qg-ricamo-' + Date.now() + '-' + random;
  }

  function toPositiveInteger(value, fallback) {
    var number = parseInt(value, 10);
    if (!Number.isFinite(number) || number < 1) {
      return fallback;
    }
    return number;
  }

  function buildCartItems(options) {
    var quantity = toPositiveInteger(options.quantity, 1);
    var bagVariantId = String(options.bagVariantId || '').trim();
    var embroideryVariantId = String(options.embroideryVariantId || '').trim();
    var groupId = String(options.groupId || createGroupId());
    var text = normalizeText(options.text);
    var font = String(options.font || '').trim();

    return [
      {
        id: Number(bagVariantId),
        quantity: quantity,
        properties: {
          Ricamo: 'Si',
          'Testo ricamo': text,
          'Font ricamo': font,
          _qg_ricamo_group: groupId
        }
      },
      {
        id: Number(embroideryVariantId),
        quantity: quantity,
        properties: {
          'Testo ricamo': text,
          'Font ricamo': font,
          _qg_ricamo_group: groupId,
          _qg_ricamo_parent_variant: bagVariantId,
          _qg_ricamo_service: 'true'
        }
      }
    ];
  }

  function findOrphanEmbroideryLines(items) {
    var bagGroups = new Set();
    var serviceLines = [];

    (items || []).forEach(function (item, index) {
      var properties = item.properties || {};
      var group = properties._qg_ricamo_group;
      var line = item.line || index + 1;

      if (!group) {
        return;
      }

      if (properties._qg_ricamo_service === 'true') {
        serviceLines.push({ line: line, group: group });
      } else {
        bagGroups.add(group);
      }
    });

    return serviceLines
      .filter(function (serviceLine) {
        return !bagGroups.has(serviceLine.group);
      })
      .map(function (serviceLine) {
        return serviceLine.line;
      });
  }

  function getSelectedVariantId(form) {
    var idField = form.querySelector('[name="id"]');
    return idField ? idField.value : '';
  }

  function getQuantity(form) {
    var quantityField = form.querySelector('[name="quantity"]');
    return quantityField ? toPositiveInteger(quantityField.value, 1) : 1;
  }

  function setMessage(block, message, type) {
    var error = block.querySelector('[data-qg-embroidery-error]');
    block.classList.toggle('is-invalid', Boolean(message) && type !== 'success');
    block.classList.toggle('is-success', Boolean(message) && type === 'success');
    if (!error) {
      return;
    }
    error.hidden = !message;
    error.textContent = message || '';
  }

  function setError(block, message) {
    setMessage(block, message, 'error');
  }

  function setSuccess(block, message) {
    setMessage(block, message, 'success');
  }

  function addItems(items, options) {
    if (options && options.previewMode) {
      return Promise.resolve({
        preview: true,
        items: items
      });
    }

    return fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ items: items })
    }).then(function (response) {
      if (!response.ok) {
        return response.json().then(function (body) {
          throw new Error(body.description || body.message || 'Errore durante aggiunta al carrello.');
        });
      }
      return response.json();
    });
  }

  function cleanupOrphanEmbroideryLines() {
    if (typeof fetch !== 'function') {
      return Promise.resolve();
    }

    return fetch('/cart.js', { headers: { Accept: 'application/json' } })
      .then(function (response) {
        return response.ok ? response.json() : null;
      })
      .then(function (cart) {
        if (!cart || !Array.isArray(cart.items)) {
          return null;
        }

        var lines = findOrphanEmbroideryLines(cart.items);
        return lines.reduceRight(function (promise, line) {
          return promise.then(function () {
            return fetch('/cart/change.js', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
              },
              body: JSON.stringify({ line: line, quantity: 0 })
            });
          });
        }, Promise.resolve());
      })
      .catch(function () {
        return null;
      });
  }

  function refreshCartAfterAdd() {
    if (typeof window !== 'undefined' && window.ajaxCart && typeof window.ajaxCart.load === 'function') {
      window.ajaxCart.load();
      return;
    }

    if (typeof window !== 'undefined') {
      window.location.href = '/cart';
    }
  }

  function initBlock(block) {
    if (block.dataset.qgEmbroideryReady === 'true') {
      return;
    }
    block.dataset.qgEmbroideryReady = 'true';

    var toggle = block.querySelector('[data-qg-embroidery-toggle]');
    var panel = block.querySelector('[data-qg-embroidery-panel]');
    var textInput = block.querySelector('[data-qg-embroidery-text]');
    var fonts = parseFonts(block.dataset.fonts);
    var maxLength = Number(block.dataset.maxLength || 0);
    var serviceVariantId = String(block.dataset.serviceVariantId || '').trim();
    var previewMode = block.dataset.qgEmbroideryPreview === 'true';
    var form = block.closest('form[action*="/cart/add"]') || document.querySelector('form.shopify-product-form');

    if (!toggle || !panel || !form) {
      return;
    }

    toggle.addEventListener('change', function () {
      panel.hidden = !toggle.checked;
      setError(block, '');
      if (toggle.checked && textInput) {
        textInput.focus();
      }
    });

    form.addEventListener(
      'submit',
      function (event) {
        if (!toggle.checked) {
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        var selectedFont = block.querySelector('[data-qg-embroidery-font]:checked');
        var validation = validateSelection({
          enabled: true,
          text: textInput ? textInput.value : '',
          font: selectedFont ? selectedFont.value : '',
          fonts: fonts,
          maxLength: maxLength
        });

        if (!validation.valid) {
          setError(block, validation.error);
          return;
        }

        if (!serviceVariantId) {
          setError(block, 'Servizio ricamo non configurato.');
          return;
        }

        var submit = form.querySelector('[type="submit"]');
        if (submit) {
          submit.classList.add('is-adding');
          submit.disabled = true;
        }

        setError(block, '');

        addItems(
          buildCartItems({
            bagVariantId: getSelectedVariantId(form),
            embroideryVariantId: serviceVariantId,
            quantity: getQuantity(form),
            text: validation.text,
            font: validation.font,
            groupId: createGroupId()
          }),
          { previewMode: previewMode }
        )
          .then(function (result) {
            if (result && result.preview) {
              setSuccess(block, 'Preview locale: borsa e ricamo simulati correttamente. Su Shopify verranno aggiunti al carrello reale.');
              return;
            }
            refreshCartAfterAdd();
          })
          .catch(function (error) {
            setError(block, error.message);
          })
          .finally(function () {
            if (submit) {
              submit.classList.remove('is-adding');
              submit.disabled = false;
            }
          });
      },
      true
    );
  }

  function init(scope) {
    var root = scope || document;
    var blocks = root.querySelectorAll ? root.querySelectorAll('[data-qg-embroidery]') : [];
    Array.prototype.forEach.call(blocks, initBlock);
    cleanupOrphanEmbroideryLines();
  }

  return {
    parseFonts: parseFonts,
    validateSelection: validateSelection,
    createGroupId: createGroupId,
    buildCartItems: buildCartItems,
    findOrphanEmbroideryLines: findOrphanEmbroideryLines,
    addItems: addItems,
    refreshCartAfterAdd: refreshCartAfterAdd,
    init: init
  };
});
