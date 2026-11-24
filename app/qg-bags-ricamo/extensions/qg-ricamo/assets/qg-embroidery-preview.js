/* Anteprima del ricamo sulla borsa modello.
   Stessa resa del configuratore (prova-cliente): filo color unico, righe del punto raso,
   rilievo dai bordi delle lettere, ombra sul tessuto e luce presa dalla foto. Canvas 2D, niente WebGL. */
(function () {
  'use strict';

  var FONT_FAMILIES = {
    corsivo: 'Pinyon Script',
    stampatello: 'Questrial',
    compatto: 'Oswald',
    elegante: 'Cinzel'
  };
  var FONT_CSS =
    'https://fonts.googleapis.com/css2?family=Pinyon+Script&family=Questrial&family=Oswald:wght@500&family=Cinzel:wght@500&display=swap';
  var fontCssReady = null;

  function fontFamily(label) {
    return FONT_FAMILIES[String(label || '').trim().toLowerCase()] || 'Questrial';
  }

  function ensureFontCss() {
    if (!fontCssReady) {
      fontCssReady = new Promise(function (resolve) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = FONT_CSS;
        link.onload = link.onerror = function () { resolve(); };
        document.head.appendChild(link);
      });
    }
    return fontCssReady;
  }

  function hexToRgb(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
    var n = m ? parseInt(m[1], 16) : 0xa84a3a;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function parseList(value, fallback) {
    var parts = String(value || '').split(',').map(function (v) { return parseFloat(v); });
    return parts.length === 4 && !parts.some(isNaN) ? parts : fallback;
  }

  function Preview(root) {
    this.root = root;
    this.canvas = root.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.color = hexToRgb(root.dataset.color);
    // area: centro X, centro Y, larghezza, altezza del ricamo, in frazioni della foto
    this.area = parseList(root.dataset.area, [0.493, 0.7, 0.24, 0.09]);
    // taglio: sinistra, alto, larghezza, altezza della parte di foto mostrata
    this.crop = parseList(root.dataset.crop, [0.04, 0.4, 0.92, 0.48]);
    this.text = '';
    this.font = '';
    this.photo = null;
    this.ready = false;
    var self = this;
    // La foto sta sul CDN di Shopify: serve crossOrigin per poterne leggere la luce.
    // Se il CDN non lo permette, si ricarica senza e si disegna il ricamo senza la luce della foto.
    function load(cors) {
      var img = new Image();
      if (cors) img.crossOrigin = 'anonymous';
      img.onload = function () {
        self.photo = img;
        self.cors = cors;
        var cr = self.crop;
        var sw = cr[2] * img.naturalWidth, shh = cr[3] * img.naturalHeight;
        var width = Math.min(900, Math.round(sw));
        self.canvas.width = width;
        self.canvas.height = Math.round(width * shh / sw);
        self.ready = true;
        self.render();
      };
      img.onerror = function () { if (cors) load(false); };
      img.src = root.dataset.image;
    }
    load(true);
  }

  Preview.prototype.update = function (text, fontLabel) {
    this.text = String(text || '').trim();
    this.font = fontFamily(fontLabel);
    var self = this;
    var spec = '80px "' + this.font + '"';
    var text = this.text || 'A';
    this.render();
    ensureFontCss().then(function () {
      return document.fonts && document.fonts.load ? document.fonts.load(spec, text) : null;
    }).then(function () { self.render(); }, function () { self.render(); });
  };

  Preview.prototype.render = function () {
    if (!this.ready) return;
    var c = this.canvas, x = this.ctx, W = c.width, H = c.height;
    var cr = this.crop, P = this.photo, iw = P.naturalWidth, ih = P.naturalHeight;
    x.drawImage(P, cr[0] * iw, cr[1] * ih, cr[2] * iw, cr[3] * ih, 0, 0, W, H);
    if (!this.text) return;

    var A0 = this.area;
    var a = [(A0[0] - cr[0]) / cr[2], (A0[1] - cr[1]) / cr[3], A0[2] / cr[2], A0[3] / cr[3]];
    var bw = Math.round(a[2] * W), bh = Math.round(a[3] * H);
    var pad = Math.round(bh * 0.25);
    var bx = Math.round(a[0] * W - bw / 2) - pad, by = Math.round(a[1] * H - bh / 2) - pad;
    var w = bw + pad * 2, h = bh + pad * 2;

    // 1. maschera del testo, adattata all'area
    var m = document.createElement('canvas');
    m.width = w; m.height = h;
    var mx = m.getContext('2d', { willReadFrequently: true });
    var fs = 100;
    mx.font = fs + 'px "' + this.font + '"';
    var M = mx.measureText(this.text);
    var th = (M.actualBoundingBoxAscent + M.actualBoundingBoxDescent) || fs * 0.7;
    fs *= Math.min(bw * 0.96 / M.width, bh * 0.9 / th);
    mx.font = fs + 'px "' + this.font + '"';
    M = mx.measureText(this.text);
    mx.fillStyle = mx.strokeStyle = '#fff';
    mx.lineJoin = 'round';
    mx.lineWidth = fs * 0.035;
    mx.textAlign = 'center';
    mx.textBaseline = 'alphabetic';
    var ty = h / 2 + (M.actualBoundingBoxAscent - M.actualBoundingBoxDescent) / 2;
    mx.fillText(this.text, w / 2, ty);
    mx.strokeText(this.text, w / 2, ty);
    var mask = mx.getImageData(0, 0, w, h).data;

    // 2. luce media del tessuto nell'area
    var img, px, usePhoto = this.cors;
    if (usePhoto) {
      try { img = x.getImageData(bx, by, w, h); } catch (e) { usePhoto = false; }
    }
    if (!usePhoto) img = x.createImageData(w, h);
    px = img.data;
    var sum = 0, n = 0, i = 0;
    for (i = 0; i < px.length; i += 4) { sum += 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]; n++; }
    var mean = usePhoto ? Math.max(1, sum / n) : 1;

    function al(xx, yy) {
      xx = Math.round(xx); yy = Math.round(yy);
      if (xx < 0 || yy < 0 || xx >= w || yy >= h) return 0;
      return mask[(yy * w + xx) * 4 + 3] / 255;
    }

    var k = Math.max(1, fs / 90); // scala di ombra e rilievo con la grandezza del testo
    var stripe = Math.PI * 1.6 / Math.max(1, fs / 60);
    var col = this.color;
    for (var yy = 0; yy < h; yy++) {
      for (var xx = 0; xx < w; xx++) {
        i = (yy * w + xx) * 4;
        var A = al(xx, yy);
        var sh = al(xx - 1.2 * k, yy + 1.8 * k);
        if (!usePhoto) {
          // senza la foto: livello trasparente con ombra e filo, disegnato sopra la foto
          var sa = 0.38 * sh * (1 - A);
          if (A > 0) {
            var s2 = 0.86 + 0.14 * Math.sin((xx * 0.8 + yy * 1.1) * stripe);
            var hi2 = al(xx + 0.9 * k, yy - 0.9 * k), lo2 = al(xx - 0.9 * k, yy + 0.9 * k);
            var f2 = s2 * Math.min(1.35, Math.max(0.55, 1 + 0.55 * (A - lo2) - 0.45 * (A - hi2)));
            var tot = A + sa * (1 - A);
            px[i] = Math.min(255, col[0] * f2) * A / tot;
            px[i + 1] = Math.min(255, col[1] * f2) * A / tot;
            px[i + 2] = Math.min(255, col[2] * f2) * A / tot;
            px[i + 3] = 255 * tot;
          } else {
            px[i + 3] = 255 * sa;
          }
          continue;
        }
        var r = px[i], g = px[i + 1], b = px[i + 2];
        // ombra del filo sul tessuto
        var shade = 1 - 0.38 * sh * (1 - A);
        r *= shade; g *= shade; b *= shade;
        if (A > 0) {
          var L = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / mean;
          var light = Math.pow(Math.min(1.3, Math.max(0, L)), 1.2);
          var sat = 0.86 + 0.14 * Math.sin((xx * 0.8 + yy * 1.1) * stripe);
          var hi = al(xx + 0.9 * k, yy - 0.9 * k), lo = al(xx - 0.9 * k, yy + 0.9 * k);
          var bev = Math.min(1.35, Math.max(0.55, 1 + 0.55 * (A - lo) - 0.45 * (A - hi)));
          var f = light * sat * bev;
          r = r * (1 - A) + Math.min(255, col[0] * f) * A;
          g = g * (1 - A) + Math.min(255, col[1] * f) * A;
          b = b * (1 - A) + Math.min(255, col[2] * f) * A;
        }
        px[i] = r; px[i + 1] = g; px[i + 2] = b;
      }
    }
    if (usePhoto) {
      x.putImageData(img, bx, by);
    } else {
      var layer = document.createElement('canvas');
      layer.width = w; layer.height = h;
      layer.getContext('2d').putImageData(img, 0, 0);
      x.drawImage(layer, bx, by);
    }
  };

  window.QGEmbroideryPreview = {
    attach: function (root) {
      if (!root || root.__qgPreview) return root && root.__qgPreview;
      root.__qgPreview = new Preview(root);
      return root.__qgPreview;
    },
    fontFamily: fontFamily
  };
})();
