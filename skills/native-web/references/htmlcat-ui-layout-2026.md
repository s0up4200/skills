# Native Web Features Reference: UI, HTML, and layout

Source: [HTMLcat](https://htmlcat.net/) by Marco Mezzavilla. Captured 2026-08-22.
Support labels come from the site and reflect Baseline status on that date. The
support-tier policy lives in SKILL.md; re-check MDN or caniuse before you rely on
anything below "Widely available".

## Table of Contents

1. [Interactive UI without JavaScript](#1-interactive-ui-without-javascript)
2. [HTML semantics and attributes](#2-html-semantics-and-attributes)
3. [Layout and selectors](#3-layout-and-selectors)

---


### The dialog element

Support: Baseline 2022 | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)

`<dialog>` gives modal UI a top layer, focus handling, Escape-to-close behavior, and a real semantic element. JavaScript only needs to open and close it.

```html
<button id="open">Delete item</button>

<dialog id="confirm" aria-labelledby="confirm-title">
  <h2 id="confirm-title">Delete item?</h2>
  <button id="cancel">Cancel</button>
</dialog>
```

```js
open.addEventListener('click', () => confirm.showModal());
cancel.addEventListener('click', () => confirm.close());
```

Use a dialog only for an actual dialog. Provide a visible close action, label it clearly, and test keyboard focus instead of assuming the native element solves every accessibility detail.

### Popover API

Support: Baseline 2024 | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover)

The `popover` attribute creates non-modal top-layer UI with light dismiss and Escape handling. Small menus and panels often need no overlay script at all.

```html
<button popovertarget="menu">Menu</button>

<nav id="menu" popover>
  <a href="/about">About</a>
  <a href="/suggest">Contribute</a>
</nav>
```

A popover is non-modal. Use `<dialog>` when the rest of the page must become inactive, and give every trigger and control a clear accessible name.

### Control dialogs with button commands

Support: Limited support | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button)

`command` and `commandfor` let a button open or close a dialog declaratively. The relationship lives in HTML instead of a click handler.

```html
<button commandfor="info" command="show-modal">
  Open details
</button>

<dialog id="info">
  <p>Native dialog, declarative controls.</p>
  <button commandfor="info" command="close">
    Close
  </button>
</dialog>
```

Support is still limited. If opening the dialog is essential, provide a tested fallback rather than assuming the command will run everywhere.

### Exclusive accordions with details name

Support: Baseline 2024 | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details)

Give several `<details>` elements the same `name` and the browser keeps only one open at a time. No accordion state script is required.

```html
<details name="faq">
  <summary>Shipping</summary>
  <p>Ships in two business days.</p>
</details>

<details name="faq">
  <summary>Returns</summary>
  <p>Returns are accepted for 30 days.</p>
</details>
```

Exclusive behavior is not always better. Do not group sections when people may need to compare them or keep several answers open.

### Searchable collapsed content with hidden=until-found

Support: Limited support | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden)

`hidden="until-found"` collapses content while keeping it discoverable through Find in Page and fragment navigation. The browser reveals the matched section before scrolling to it.

```html
<a href="#archive">Jump to the archive</a>

<section id="archive" hidden="until-found">
  <h2>Archive</h2>
  <p>Still searchable while collapsed.</p>
</section>
```

Support and assistive-technology behavior still vary. The element also keeps a layout box, and `display: none`, `contents`, or `inline` prevents automatic reveal.

### The :target pseudo-class

Support: Widely available | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/:target)

`:target` matches the element addressed by the URL fragment. That makes deep-linked highlights, notes, and simple panels possible without storing state in JavaScript.

```html
<a href="#shipping">Shipping details</a>
<section id="shipping">…</section>
```

```css
#shipping {
  border: 1px solid transparent;
}

#shipping:target {
  border-color: currentColor;
}
```

Fragments enter browser history and should identify useful destinations. Avoid hiding essential content unless there is an equally clear way to reveal it.

---

## 2. HTML semantics and attributes

### Telephone and email links

Support: Widely available | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a)

An anchor can hand a phone number or email address to the user's preferred app. The link stays semantic, keyboard accessible, and useful without JavaScript.

```html
<a href="tel:+391234567890">+39 123 456 7890</a>

<a href="mailto:hello@example.com?subject=Hello">
  hello@example.com
</a>
```

Keep the visible value understandable and copyable. Query parameters in `mailto:` links must be URL-encoded.

### Disable a subtree with inert

Support: Baseline 2023 | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert)

The `inert` attribute removes a subtree from focus, pointer interaction, text selection, and the accessibility tree. It is the platform primitive for temporarily inactive UI.

```html
<main inert>
  <!-- temporarily inactive content -->
</main>
```

Do not use `inert` merely to make something look disabled, and never place an active dialog inside an inert ancestor.

### The translate global attribute

Support: Widely available | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/translate)

`translate="no"` tells translation tools that a name, code sample, or other fragment should remain unchanged.

```html
<p>Built by <span translate="no">HTMLcat</span>.</p>
```

Use it sparingly. Preventing translation for ordinary prose makes content less useful; reserve it for strings whose identity would be damaged.

### Description list alignment

Support: Widely available | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dl)

`<dl>` is the right structure for name–value groups. Grid can align terms and descriptions without replacing that relationship with a presentational table.

```html
<dl class="specs">
  <dt>Display</dt><dd>6.1-inch OLED</dd>
  <dt>Weight</dt><dd>174 g</dd>
</dl>
```

```css
.specs {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: .5rem 1rem;
}

.specs dd {
  margin: 0;
}
```

This layout assumes one description after each term. More complex groups may need wrappers or a different grid strategy, while keeping the dt/dd semantics.

### Empty tags

Support: Widely available | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/:empty)

CMS output sometimes contains empty elements that still carry margins or borders. `:empty` is a small safety net for those boxes.

```css
p:empty {
  display: none;
}
```

`:empty` only matches elements with no child nodes. A space or line break stored as text is enough to prevent a match, so fixing the source is still preferable.

---

## 3. Layout and selectors

### Centering in CSS

Support: Widely available | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/place-items)

When both axes should share the same alignment, Grid reduces the job to two declarations.

```css
.container {
  display: grid;
  place-items: center;
}
```

The container still needs a meaningful size. Use Flexbox when the surrounding layout is one-dimensional or the children need distribution as well as centering.

### clamp()

Support: Widely available | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp)

`clamp()` gives a fluid value a floor and a ceiling. It is useful for type and spacing that should scale without breakpoint jumps.

```css
.title {
  font-size: clamp(1.75rem, 1.25rem + 2vw, 3.5rem);
}

.page {
  padding-inline: clamp(1rem, 5vw, 6rem);
}
```

The middle value should express real fluid behavior, not merely make the declaration look clever. Test the minimum and maximum at zoomed text sizes.

### Container size queries

Support: Baseline 2023 | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)

A component often cares about the space it receives, not the viewport. Container queries let the same card adapt inside a sidebar, grid, or full-width region.

```css
.card-wrapper {
  container-type: inline-size;
}

@container (width > 30rem) {
  .card {
    grid-template-columns: 12rem 1fr;
  }
}
```

Put containment on a wrapper when querying the component itself would create a circular dependency.

### Container style queries

Support: Limited support | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_size_and_style_queries)

A container can expose local state through custom properties. Descendants can react to a theme or mode without checking viewport width.

```css
.card {
  --tone: danger;
}

@container style(--tone: danger) {
  .card-icon {
    color: red;
  }
}
```

Current style queries mainly cover custom properties, and support remains uneven. Keep the default style complete outside the query.

### The :has() relational selector

Support: Baseline 2023 | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/:has)

`:has()` selects an element by looking at a relative condition. "Parent selector" is the famous use case, but it can express much more than ancestry.

```css
form:has(:invalid) {
  border-color: crimson;
}

html:has(dialog[open]) {
  overflow: hidden;
}
```

Use the narrowest useful condition. The browser implementations are optimized, but a readable selector is still easier to maintain than a deeply nested one.

### Scoped CSS with @scope

Support: Baseline 2025 | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@scope)

`@scope` limits selectors to a part of the DOM without adding a namespace class to every selector.

```css
@scope (.article) {
  :scope {
    container-type: inline-size;
  }

  a {
    color: var(--article-link);
  }
}
```

Scoping limits where selectors match; it is not style encapsulation. Inherited properties and custom properties can still cross the boundary.

### :where()

Support: Baseline 2021 | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:where)

`:where()` groups selectors like `:is()`, but always contributes zero specificity. It is ideal for defaults that consumers should be able to override.

```css
:where(ul, ol)[class] {
  margin: 0;
  padding: 0;
  list-style: none;
}

.article :where(h2, h3, p) {
  max-inline-size: 65ch;
}
```

The selectors inside `:where()` still decide what matches; only their specificity is discarded.

### CSS Grid Lanes

Support: Experimental | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Masonry_layout)

Grid Lanes are the current native masonry direction for CSS Grid. The strict axis defines tracks; the other axis packs mixed-size items into the available lanes.

```css
.gallery {
  display: grid-lanes;
  gap: 1rem;
  grid-template-columns: repeat(
    auto-fill,
    minmax(14rem, 1fr)
  );
}
```

This is experimental and not Baseline. Put it behind `@supports`; unsupported browsers can use ordinary Grid auto-placement.

### CSS custom functions

Support: Experimental | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@function)

`@function` defines reusable CSS calculations with arguments, defaults, typed values, and cascade-aware results.

```css
@function --alpha(--color <color>, --amount <number>: .7)
  returns <color> {
  result: oklch(from var(--color) l c h / var(--amount));
}

.button {
  background: --alpha(var(--brand), .85);
}
```

This is experimental and not a production default. Keep the underlying value straightforward enough to express without the function when a fallback is required.
