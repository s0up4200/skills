# Native Web Features Reference: theming, motion, text, and JavaScript

Source: [HTMLcat](https://htmlcat.net/) by Marco Mezzavilla. Captured 2026-08-22.
Support labels come from the site and reflect Baseline status on that date. The
support-tier policy lives in SKILL.md; re-check MDN or caniuse before you rely on
anything below "Widely available".

## Table of Contents

4. [Color and theming](#4-color-and-theming)
5. [Scrolling and motion](#5-scrolling-and-motion)
6. [Typography and text](#6-typography-and-text)
7. [JavaScript platform APIs](#7-javascript-platform-apis)
8. [Shell](#8-shell)

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
