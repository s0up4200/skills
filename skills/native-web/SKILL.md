---
name: native-web
description: Replace custom JavaScript and CSS hacks with native web platform features. Use when writing or reviewing frontend code that involves modals, dialogs, popovers, dropdowns, accordions, carousels, tooltips, dark mode, theming, fluid typography, centering, scroll behavior, sticky headers, masonry layouts, currency formatting, or class toggling. Also use when the user asks "is there a native way to do this", wants to drop a UI dependency, mentions Baseline or progressive enhancement, or builds any component that libraries traditionally solved (modal, accordion, carousel, tooltip, theme switcher).
---

# Native Web

## Goal

Before writing custom JavaScript, adding a UI library, or hand-rolling a CSS hack, check whether the browser already ships the feature. Native features come with focus management, keyboard support, accessibility semantics, and history integration that custom code has to rebuild — and usually rebuilds incompletely. Less code, fewer dependencies, better accessibility.

Based on the tips collected at [htmlcat.net](https://htmlcat.net/) (captured 2026-08-22).

## Workflow

1. Match the problem against the lookup table below.
2. Read the full entry in `references/htmlcat-tips-2026.md` — it has the code, the caveats, and the MDN link.
3. Check the support tier. "Widely available" and Baseline ≤2023: use directly. Baseline 2024+: fine as progressive enhancement. "Limited support" or "Experimental": needs a tested fallback or `@supports` guard — never a bare production default. Labels are from 2026-08-22 — re-check MDN or caniuse for anything below "Widely available".

## Lookup table

| Problem | Native feature | Support (2026-08) |
|---|---|---|
| Modal, confirm box, overlay | `<dialog>` + `showModal()` | Baseline 2022 |
| Dropdown menu, non-modal panel, tooltip-panel | `popover` attribute | Baseline 2024 |
| Open/close dialog without JS | `command`/`commandfor` on button | Limited |
| Accordion (one open at a time) | `<details name="…">` | Baseline 2024 |
| Collapsed content findable via Ctrl+F | `hidden="until-found"` | Limited |
| Highlight deep-linked section | `:target` | Widely available |
| Click-to-call / click-to-email | `tel:` / `mailto:` links | Widely available |
| Disable a whole UI region | `inert` attribute | Baseline 2023 |
| Keep names/code out of machine translation | `translate="no"` | Widely available |
| Aligned name–value pairs | `<dl>` + Grid | Widely available |
| Hide empty CMS paragraphs | `:empty` | Widely available |
| Center anything | `display: grid; place-items: center` | Widely available |
| Fluid type/spacing, no breakpoints | `clamp()` | Widely available |
| Component adapts to its container | `@container` size queries | Baseline 2023 |
| Style by custom-property state | `@container style()` | Limited |
| Style parent by child state | `:has()` | Baseline 2023 |
| Scope styles without namespacing | `@scope` | Baseline 2025 |
| Zero-specificity defaults | `:where()` | Baseline 2021 |
| Masonry layout | `display: grid-lanes` | Experimental |
| Reusable CSS calculations | `@function` | Experimental |
| Dark mode | `prefers-color-scheme` + `color-scheme` | Widely available |
| Light/dark token pairs in one line | `light-dark()` | Baseline 2024 |
| Translucent version of a token | `color-mix(… , transparent)` | Baseline 2023 |
| Auto contrast for data-driven colors | `contrast-color()` | Baseline 2026 |
| Theme checkboxes/radios/range | `accent-color` | Baseline 2022 |
| Brand-colored text selection | `::selection` | Widely available |
| Style bullets/numbers | `::marker` | Widely available |
| Squircles, notches, scooped corners | `corner-shape` | Limited |
| Smooth anchor scrolling | `scroll-behavior: smooth` | Widely available |
| Sticky header covers anchor target | `scroll-margin-block-start` | Widely available |
| Scrollable area without visible bar | `scrollbar-width: none` | Widely available |
| Reading-progress bar, scroll effects | `animation-timeline: scroll()` | Limited |
| Carousel with buttons and dots | `::scroll-button` / `::scroll-marker` | Limited |
| React to scroll-snap changes | `scrollsnapchange` events | Experimental |
| Animate between DOM states | `startViewTransition()` | Newly available |
| Even heading line breaks | `text-wrap: balance` / `pretty` | Baseline 2024 |
| Conditional class add/remove | `classList.toggle(name, bool)` | Widely available |
| Currency/number formatting | `Intl.NumberFormat` | Widely available |
| Touch/mouse/hover capability detection | `any-pointer` / `any-hover` media queries | Widely available |
| Highlight text without extra spans | CSS Custom Highlight API | Baseline 2025 |

## Principles

- **Progressive enhancement over hard dependency.** For non-Baseline features, ship a version that works without the feature, then layer the enhancement on top. `corner-shape` degrades to a rounded corner; a CSS carousel degrades to a scrollable row. That degradation path is what makes limited-support features usable today.
- **Native does not mean automatically accessible.** A `<dialog>` still needs a label and a visible close action. Hidden scrollbars remove an affordance. Hover-revealed UI still needs keyboard and touch paths. The reference entries carry these caveats — read them, don't just copy the code.
- **Respect user preferences.** Motion features (`scroll-behavior`, scroll-driven animations, view transitions) belong behind `prefers-reduced-motion` checks. Theming starts from `prefers-color-scheme`, and a manual switch overrides it.

## When reviewing code

Flag custom implementations of anything in the lookup table and name the native replacement with its support tier so the author can judge the tradeoff.
