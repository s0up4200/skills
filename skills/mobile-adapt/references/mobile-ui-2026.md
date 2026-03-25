# Mobile UI 2026 Reference

High-signal rules and sources for mobile adaptation work. Use this file when the task needs current platform guidance, citations, or iPhone-specific decisions.

## Core guidance

- Apple Design Tips: aim for `44x44pt` touch targets, keep text comfortably legible, and fit content to the screen without forcing zoom or horizontal scrolling.
  Source: https://developer.apple.com/design/tips/

- Apple navigation guidance: use tab bars for true top-level sections, keep them persistent, and use bottom-originating modal presentations for temporary flows.
  Source: https://developer.apple.com/videos/play/wwdc2022/10001/

- Safari/iPhone web guidance: use `viewport-fit=cover`, respect safe areas with `env(safe-area-inset-*)`, test browser mode and installed web-app mode separately, and keep important controls out of unsafe edges.
  Sources:
  - https://developer.apple.com/videos/play/wwdc2021/10029/
  - https://webkit.org/blog/7929/designing-websites-for-iphone-x/

- Dynamic viewport units: prefer `dvh`/`svh`/`lvh` over old `vh` assumptions for mobile full-height layouts.
  Sources:
  - https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length

- Large text/reflow: design must stay usable with major text enlargement; vertical scroll is preferred over clipped or ambiguous truncation.
  Source: https://developer.apple.com/help/app-store-connect/manage-app-accessibility/larger-text-evaluation-criteria

- WCAG 2.2 target size minimum is `24x24 CSS px`, but for phone UI default to Apple-style `44x44` targets unless there is a strong reason not to.
  Sources:
  - https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
  - https://developer.apple.com/design/tips/

- Reflow and focus visibility matter on phones: avoid horizontal scrolling for ordinary content, and ensure sticky UI does not hide focused elements.
  Sources:
  - https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
  - https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum

- Use container queries for component internals and macro responsive logic for shells/navigation.
  Sources:
  - https://developer.mozilla.org/en-US/docs/Web/CSS/%40container
  - https://web.dev/articles/new-responsive

- Android adaptive guidance still aligns with the same principle: compact windows should adapt navigation and stay single-pane; wider environments can expand.
  Source: https://developer.android.com/develop/ui/compose/layouts/adaptive
  Note: page last updated `2026-01-16 UTC`.

## iPhone 16 Pro Max facts

- Official Apple specs: year introduced `2024`, `6.9-inch` display, `2868x1320` pixels at `460 ppi`, `Dynamic Island`, rounded corners, and ProMotion up to `120Hz`.
  Source: https://support.apple.com/en-in/121032

- App Store Connect screenshot spec for this device class: `1320x2868` portrait and `2868x1320` landscape.
  Source: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/

- Apple Design updates relevant to this class:
  - layout specs for iPhone 16 Pro Max added on `2024-09-09`
  - iOS 26 UI kit rebuilt on `2025-06-09`
  - tab bar and scroll-view guidance updated on `2025-07-28`
  Source: https://developer.apple.com/design/whats-new/

- Do **not** hardcode a single CSS viewport size for iPhone 16 Pro Max unless you have direct device verification. Apple publishes hardware pixels, not one canonical Safari CSS viewport value.

## Known WebKit watchouts

- Bug `297779` (2025, open): **iOS 26 beta** — fixed elements bounce up and down when scroll direction changes. Workaround: prefer `position: sticky` over `position: fixed` on scrollable pages.
  Source: https://bugs.webkit.org/show_bug.cgi?id=297779

- Bug `202120` (long-standing, open): `position: sticky; bottom: 0` does not pin to bottom when the virtual keyboard is open. Workaround: use `visualViewport` resize listener to manually reposition, or let submit buttons scroll naturally in the form flow.
  Source: https://bugs.webkit.org/show_bug.cgi?id=202120

- Bug `153224` (long-standing, open): tapping an `<input>` inside a `position: fixed` element scrolls the page to top. Workaround: place inputs in scrollable content, not fixed containers.
  Source: https://bugs.webkit.org/show_bug.cgi?id=153224

- Bug `197659` (open): `<body>` with `overflow: hidden` is still keyboard-scrollable on iOS. Workaround: use a wrapper `<div>` with `overflow: hidden` instead of `<body>`.
  Source: https://bugs.webkit.org/show_bug.cgi?id=197659

- Bug `240861` (open): scrolling over horizontal scroll containers triggers Safari UI shift. Workaround: add `overscroll-behavior: contain` on horizontal scroll containers.
  Source: https://bugs.webkit.org/show_bug.cgi?id=240861

- Bug `292603` (`2025-05-06`): extra bottom scrollable gap with keyboard on iPhone Safari/WKWebView.
  Source: https://bugs.webkit.org/show_bug.cgi?id=292603

- Bug `254868` (`2023-04-01`, still active in 2025 comments): incorrect height values in installed web apps with `viewport-fit=cover`.
  Source: https://bugs.webkit.org/show_bug.cgi?id=254868

- Bug `261185` (open): `svh`/`dvh` units are unexpectedly equal in standalone/PWA mode when Safari tab bar is not visible. This is arguably correct (no collapsible UI), but code depending on `svh !== dvh` to detect toolbar state will not work.
  Source: https://bugs.webkit.org/show_bug.cgi?id=261185

- Bug `265578` (open): visual viewport height updated late when Safari UI is expanded — brief layout mismatch during toolbar animation.
  Source: https://bugs.webkit.org/show_bug.cgi?id=265578

- Bug `287721` fixed on `2025-03-18`: keyboard scrolling issue in sub-scrollable regions.
  Source: https://bugs.webkit.org/show_bug.cgi?id=287721

- iOS 26 `visualViewport` issue (2025, reported on Apple Forums): `visualViewport.offsetTop` does not reset to 0 after keyboard dismissal; `visualViewport.height` stays smaller than `window.innerHeight`. Workaround: force layout recalc on `focusout`, or rely on `dvh` units.
  Source: https://developer.apple.com/forums/thread/800125

Net: avoid designing critical flows around nested scroll regions and fixed bottom chrome without explicit device verification. Prefer `position: sticky` or inline flow over `position: fixed` for keyboard-adjacent UI.

## Keyboard handling on mobile web

Two APIs exist for detecting the on-screen keyboard, with different browser support:

**VisualViewport API** (broadly supported: Safari, Chrome, Firefox):
- `window.visualViewport.height` shrinks when the keyboard opens; compare to `window.innerHeight` to detect keyboard presence.
- The `resize` event fires on keyboard show/hide.
- On iOS Safari, the Layout Viewport does not resize — only the Visual Viewport shrinks.

**VirtualKeyboard API** (Chromium-only, NOT in Safari as of 2026):
- `navigator.virtualKeyboard.boundingRect` gives exact keyboard geometry.
- CSS `keyboard-inset-*` env vars for layout.
- WebKit bug `230225` tracks the unimplemented request for Safari.
  Source: https://bugs.webkit.org/show_bug.cgi?id=230225

**`interactive-widget` meta viewport** (Chrome 108+, Firefox 132+, NOT Safari):
- `resizes-visual` (default): only visual viewport shrinks.
- `resizes-content`: layout viewport also shrinks (old behavior).
- `overlays-content`: keyboard overlays everything.
- WebKit bug `259770` tracks Safari support.

Net: for cross-browser keyboard handling today, use the VisualViewport API. Do not rely on VirtualKeyboard API or `interactive-widget` for Safari users.

## Container queries in Tailwind v4

Container queries are first-class in Tailwind v4 — no plugin needed.
- Mark parent: `@container` class.
- Style children: `@sm:`, `@md:`, `@lg:` (same breakpoints, `@` prefix).
- Named containers: `@container/sidebar` on parent, `@md/sidebar:flex` on children.
- Arbitrary values: `@[500px]:grid-cols-2`.
- Browser support: ~93-95% globally (Chrome 105+, Safari 16+, Firefox 110+).
- Style queries (`@container style(...)`) are Chromium-only; part of Interop 2026.

Recommended split: viewport queries (`sm:`, `md:`) for shell/nav mode changes, container queries (`@sm:`, `@md:`) for component internals.
  Source: https://tailwindcss.com/docs/responsive-design

## Safe-area testing tooling

- **Real device**: gold standard. Only physical iPhones produce authentic `env()` values.
- **Xcode Simulator**: accurate per-device insets, requires macOS.
- **Polypane 26+**: desktop browser with real safe-area inset presets per device. Currently the most complete desktop emulation.
  Source: https://polypane.app/blog/polypane-26-accurate-device-emulation-with-safe-area-and-small-viewport-units/
- **Chrome DevTools 135+**: `Emulation.setSafeAreaInsetsOverride` available via CDP, device emulation has safe-area toggle. Requires manual configuration — no automatic per-device mapping.
  Source: https://chromestatus.com/feature/5174306712322048
- **Safari Web Inspector**: preference overrides for `prefers-reduced-motion` and `prefers-contrast` (since late 2022 WebKit commit `e7a763b`).

## Practical defaults

- Treat phones as mobile in both portrait and landscape until there is a real tablet/desktop reason to switch shells.
- Use bottom-first navigation.
- Keep all primary actions thumb-reachable and safe-area aware.
- Convert dense tables into card/list review flows on phones.
- Give charts a text summary, legend, and compact fallback.
- Test Safari first.
