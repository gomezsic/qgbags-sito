# QG Bags Ricamo App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private Shopify Theme App Extension for QG Bags that displays a polished embroidery option on eligible product pages and adds the fixed-price embroidery service to cart.

**Architecture:** The app source is a Shopify app scaffold with one theme extension. The extension renders a product-page app block with Liquid, styles the customer UI with scoped CSS, and uses a browser asset to validate embroidery input and build Shopify Ajax Cart API payloads.

**Tech Stack:** Shopify Theme App Extension, Liquid, vanilla JavaScript, CSS, Node built-in test runner.

---

## File Map

- `package.json`: local verification scripts.
- `shopify.app.toml`: Shopify app config placeholder for the private app.
- `extensions/qg-ricamo/shopify.extension.toml`: theme extension config.
- `extensions/qg-ricamo/blocks/qg-embroidery.liquid`: product-page app block.
- `extensions/qg-ricamo/assets/qg-embroidery.css`: scoped storefront UI.
- `extensions/qg-ricamo/assets/qg-embroidery.js`: validation, Ajax payload creation, and cart cleanup.
- `tests/qg-embroidery.test.js`: Node tests for the JS behavior.
- `outputs/qg-bags-ricamo-preview.html`: local visual preview of the storefront block.

## Tasks

### Task 1: Test Core Behavior

- [ ] Create `tests/qg-embroidery.test.js` with failing tests for font parsing, validation, cart payload creation, and orphan embroidery cleanup.
- [ ] Run `/Users/giacomofelicesiccardi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/qg-embroidery.test.js`.
- [ ] Confirm failure because `qg-embroidery.js` does not exist yet.

### Task 2: Implement JavaScript Core

- [ ] Create `extensions/qg-ricamo/assets/qg-embroidery.js`.
- [ ] Export a `QGEmbroidery` object in Node and attach it to `window` in browsers.
- [ ] Implement `parseFonts`, `validateSelection`, `createGroupId`, `buildCartItems`, `findOrphanEmbroideryLines`, and storefront initialization.
- [ ] Re-run Node tests and confirm pass.

### Task 3: Implement Shopify Theme App Extension

- [ ] Create `shopify.app.toml`.
- [ ] Create `extensions/qg-ricamo/shopify.extension.toml`.
- [ ] Create `extensions/qg-ricamo/blocks/qg-embroidery.liquid`.
- [ ] Render nothing unless product has the configured tag, default `ricamo si`.
- [ ] Add block settings for service variant ID, price label, fonts, max characters, heading, and help text.

### Task 4: Implement Graphical UI

- [ ] Create `extensions/qg-ricamo/assets/qg-embroidery.css`.
- [ ] Style a compact product-page block matching the existing QG theme: restrained border, clear checkbox, input, font segmented buttons, small price line, error area.
- [ ] Ensure mobile layout has stable widths and no text overlap.
- [ ] Create `outputs/qg-bags-ricamo-preview.html` using the same CSS/JS for visual inspection.

### Task 5: Verify

- [ ] Run Node tests.
- [ ] Open the preview HTML and inspect desktop/mobile layouts.
- [ ] Confirm the generated files are present and ready for Shopify CLI deployment once credentials are available.
