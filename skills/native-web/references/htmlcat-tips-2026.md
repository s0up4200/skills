# Native Web Features Reference

Source: [HTMLcat](https://htmlcat.net/) by Marco Mezzavilla. Captured 2026-08-22.
Support labels come from the site and reflect Baseline status on that date. The
support-tier policy lives in SKILL.md; re-check MDN or caniuse before you rely on
anything below "Widely available".

## Table of Contents

1. [Interactive UI without JavaScript](#1-interactive-ui-without-javascript)
2. [HTML semantics and attributes](#2-html-semantics-and-attributes)
3. [Layout and selectors](#3-layout-and-selectors)
4. [Color and theming](#4-color-and-theming)
5. [Scrolling and motion](#5-scrolling-and-motion)
6. [Typography and text](#6-typography-and-text)
7. [JavaScript platform APIs](#7-javascript-platform-apis)
8. [Shell](#8-shell)

---

## 1. Interactive UI without JavaScript

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

---

## 4. Color and theming

### prefers-color-scheme

Support: Widely available | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)

The user's light or dark preference is already available as a media feature. Start with a usable default, then override the tokens that actually change.

```css
:root {
  color-scheme: light dark;
  --canvas: #ffffff;
  --text: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --canvas: #171717;
    --text: #f7f3e8;
  }
}
```

`color-scheme` also lets native controls match the theme. A manual theme switch should override the preference when the user asks it to.

### light-dark()

Support: Baseline 2024 | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/light-dark)

`light-dark()` keeps small light/dark token pairs in one declaration. Opt the page into both schemes first.

```css
:root {
  color-scheme: light dark;
}

body {
  color: light-dark(#171717, #f7f3e8);
  background: light-dark(#f7f3e8, #171717);
}
```

It follows the active color scheme; it does not create a theme switcher. Keep a sensible fallback before the declaration if older browsers remain in scope.

### Transparent colors with color-mix()

Support: Baseline 2023 | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix)

`color-mix()` can derive a translucent version of any color token, even when the token is not stored as separate RGB channels.

```css
.focus-ring {
  outline: 3px solid color-mix(
    in oklch,
    var(--accent) 55%,
    transparent
  );
}
```

The interpolation color space changes the result. Use a deliberate space and test the derived color against the real background.

### contrast-color()

Support: Baseline 2026 | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/contrast-color)

`contrast-color()` asks the browser for a contrasting color against a solid background. It is handy when badge or CMS colors are data-driven.

```css
.tag {
  --tag-bg: oklch(72% 0.19 142);

  background: var(--tag-bg);
  color: contrast-color(var(--tag-bg));
}
```

This became Baseline in 2026, so older browsers still need a fallback. Automated contrast is useful, but it does not replace testing real font sizes, weights, and states.

### Native form colors with accent-color

Support: Baseline 2022 | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/accent-color)

`accent-color` themes checkboxes, radio buttons, range inputs, and progress controls without rebuilding them from generic elements.

```css
:root {
  accent-color: rebeccapurple;
}
```

The browser keeps control over the remaining colors and shape. That variation is a feature of native UI; verify contrast instead of forcing pixel-identical controls.

### Text selection highlight

Support: Widely available | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/::selection)

`::selection` styles text selected by the user. A small color adjustment can make selection feel part of the design without replacing native behavior.

```css
::selection {
  color: #ffffff;
  background: #4937c7;
}
```

Only a limited set of properties applies. Keep strong contrast and do not remove the visual distinction between selected and unselected text.

### Styling list markers with ::marker

Support: Widely available | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/::marker)

`::marker` targets a list item's bullet or number without replacing the semantic list or building a pseudo-element by hand.

```css
li::marker {
  color: rebeccapurple;
  content: '⁂  ';
}
```

The set of supported properties is intentionally small. If custom content changes the meaning or order of the list, keep that information in the HTML instead.

### corner-shape

Support: Limited support | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/corner-shape)

`corner-shape` changes how an existing border radius is drawn. Bevels, notches, scoops, and squircles no longer require masks.

```css
.card {
  border-radius: 2rem;
  corner-shape: squircle;
}

.ticket {
  border-radius: 1rem;
  corner-shape: scoop;
}
```

The property has no effect without `border-radius`. Unsupported browsers keep the ordinary rounded corner, which makes it a good visual enhancement.

---

## 5. Scrolling and motion

### Smooth scrolling

Support: Widely available | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-behavior)

Hash links and browser navigation can scroll smoothly without a JavaScript animation.

```css
html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```

```js
element.scrollIntoView({
  behavior: 'smooth',
  block: 'start',
});
```

Use JavaScript only when code initiates the movement. Respect reduced-motion preferences and avoid long scroll journeys that delay the user.

### Scroll margin

Support: Widely available | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-margin-top)

A fixed header can cover the heading reached by a hash link or `scrollIntoView()`. Put the offset on the target instead of adjusting every scroll call.

```css
[id] {
  scroll-margin-block-start: 6rem;
}
```

Logical properties such as `scroll-margin-block-start` also work when the writing mode changes.

### Hide scrollbars

Support: Widely available | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-width)

A scrollable area can keep scrolling while its scrollbar is visually hidden. The standards-based property covers Firefox and current browsers; the WebKit pseudo-element handles older Chromium and Safari versions.

```css
.scroller {
  overflow: auto;
  scrollbar-width: none;
}

.scroller::-webkit-scrollbar {
  display: none;
}
```

A missing scrollbar removes an important affordance. Use this only when the content is obviously scrollable, and verify keyboard scrolling and touch targets.

### Scroll-driven animations

Support: Limited support | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations)

A scroll timeline connects CSS animation progress to scrolling instead of time. Reading indicators no longer need a scroll listener.

```css
@keyframes grow {
  from { scale: 0 1; }
  to { scale: 1 1; }
}

.progress {
  animation: grow linear;
  animation-timeline: scroll(root block);
  transform-origin: left;
}
```

Keep decorative motion behind a `prefers-reduced-motion` check, and make sure the UI remains understandable when the animation is absent.

### CSS carousels

Support: Limited support | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Overflow/Carousels)

CSS can generate previous/next controls and markers for a scroll-snap container. The browser keeps navigation state in sync, removing a surprising amount of JavaScript.

```css
.carousel {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-marker-group: after;
}

.carousel::scroll-button(left) {
  content: '‹' / 'Previous';
}

.carousel::scroll-button(right) {
  content: '›' / 'Next';
}

.carousel > * {
  scroll-snap-align: center;
}

.carousel > *::scroll-marker {
  content: attr(data-label);
}
```

Support is still limited. Keep the scroll container useful without generated controls, provide meaningful marker names, and test keyboard order.

### Scroll snap events

Support: Experimental | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll_snap/Using_scroll_snap_events)

`scrollsnapchanging` reports the pending snap target; `scrollsnapchange` fires after a new target is selected. They remove much of the guesswork from synchronizing UI with a snap container.

```js
scroller.addEventListener('scrollsnapchange', (event) => {
  event.snapTargetInline?.classList.add('selected');
});
```

These events are not Baseline yet. Treat them as an enhancement and keep scrolling and content usable when they never fire.

### View Transitions API

Support: Newly available | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition)

The browser can animate snapshots between two DOM states. Your code still updates the view; `startViewTransition()` coordinates the visual handoff.

```js
const update = () => {
  document.documentElement.classList.toggle('details-open');
};

if (document.startViewTransition) {
  document.startViewTransition(update);
} else {
  update();
}
```

```css
::view-transition-group(root) {
  animation-duration: .25s;
}
```

The fallback is the DOM update itself. Keep transitions short, avoid hiding state changes, and respect reduced-motion preferences.

---

## 6. Typography and text

### Better wrapping with text-wrap

Support: Baseline 2024 | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap)

`balance` evens out short headings; `pretty` spends more work improving paragraph line breaks. Both are progressive typographic improvements.

```css
h1, h2, h3 {
  text-wrap: balance;
}

p {
  text-wrap: pretty;
}
```

Use `balance` for a limited number of lines, not long body copy. Browsers may choose different wrapping because fonts and available space differ.

---

## 7. JavaScript platform APIs

### classList.toggle()

Support: Widely available | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList/toggle)

`classList.toggle()` accepts a second boolean argument. That turns a common add-or-remove branch into one explicit line.

```js
document.body.classList.toggle(
  'menu-open',
  checkbox.checked,
);
```

Without the second argument, `toggle()` flips the current state. With it, the resulting state follows the boolean, which is usually safer for UI synchronization.

### Localized prices with Intl.NumberFormat

Support: Widely available | [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)

Currency separators, symbol placement, and decimal rules vary by locale. Let the internationalization API format the value instead of concatenating strings.

```js
const price = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
});

price.format(1234.5); // 1.234,50 €
```

The locale controls presentation; the currency controls monetary meaning. Store amounts as numbers or minor units, not as already-formatted text.

### Detect input capabilities

Support: Widely available | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer)

A coarse pointer does not mean "mobile", and a fine pointer does not guarantee "desktop". Ask the browser about input capabilities instead of guessing the device from its user agent.

```js
const input = {
  finePointer: matchMedia('(any-pointer: fine)').matches,
  coarsePointer: matchMedia('(any-pointer: coarse)').matches,
  canHover: matchMedia('(any-hover: hover)').matches,
};
```

Hybrid laptops can report both fine and coarse pointers. Adapt the interaction to capabilities, and keep the same task possible with keyboard and touch.

### Detect hover across input types

Support: Widely available | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/any-hover)

`hover` describes the primary input. `any-hover` asks whether at least one connected input can hover, which matters on hybrid devices.

```css
@media (any-hover: hover) and (any-pointer: fine) {
  .tooltip-trigger:hover .tooltip {
    display: block;
  }
}
```

Hover must not be the only way to reveal or operate something. Keyboard focus and touch still need equivalent behavior.

### CSS Custom Highlight API

Support: Baseline 2025 | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API)

Custom highlights style arbitrary text ranges without wrapping them in extra spans. That is useful for search results, annotations, and editor overlays.

```js
const range = new Range();
range.selectNodeContents(result);

CSS.highlights.set(
  'search-result',
  new Highlight(range),
);
```

```css
::highlight(search-result) {
  color: inherit;
  background: gold;
}
```

A custom highlight is not the user's selection and adds no semantics by itself. Do not rely on color alone to communicate meaning.

---

## 8. Shell

### Sort directories by size

Support: Shell utility | [GNU coreutils](https://www.gnu.org/software/coreutils/manual/html_node/du-invocation.html)

Use `du` to summarize disk usage one level below the current directory, then let `sort` put the largest totals first.

```bash
du -hd 1 . | sort -hr
```

`-h` prints human-readable units, `-d 1` limits the result to direct children. For sort, `-h` understands units such as K, M, and G, `-r` reverses the order. `du` reports allocated disk usage, which can differ from apparent file size. The `.` row is the total for the whole tree, and hidden directories are included. GNU du also accepts `--max-depth=1`.
