---
name: mobile-adapt
description: Use when a user wants a site, app, screen, flow, dashboard, or full project adapted for phones or mobile web, or mentions responsive/mobile-first/iPhone/iOS Safari/touch/safe-area/landscape/keyboard issues. Also use for mobile audits, mobile regressions, small-screen layout fixes, bottom navigation redesigns, form/table/chart adaptation, or iPhone-specific usability work.
---

# Mobile Adapt

## Goal

Adapt existing interfaces to work well on phones without removing core functionality. Prioritize iPhone-class mobile web unless the user names another target.

## Default target

If the user does not specify a device or browser, optimize first for:

- iPhone Pro Max class in portrait and landscape
- iOS Safari
- compact touch screens around `375-440 CSS px` wide
- keyboard-open use, large text, safe areas, and reduced motion

## When to research

This skill depends on current platform behavior.

- Browse official sources when the user asks for the latest/current guidance, iPhone-specific behavior, Safari/WebKit quirks, safe-area behavior, PWA/home-screen behavior, or direct citations.
- Prefer Apple Developer, WebKit, W3C/WCAG, MDN, Android Developers, and web.dev.
- Use absolute dates when citing recent platform changes.

For the current high-signal rules and sources, read [references/mobile-ui-2026.md](references/mobile-ui-2026.md).

## Core rules

- **Keep compact phones single-pane.** Do not switch to desktop IA just because a landscape phone crosses a generic breakpoint. A phone rotated sideways is still held in two hands at arm's length — the user's mental model is "phone," not "tablet." Breaking into a multi-pane layout creates a disorienting experience where nothing is big enough to use comfortably.

- **Use bottom-first mobile navigation for true top-level sections only.** Keep it to `3-5` primary destinations; move overflow to `More`, a sheet, or secondary flows. The bottom of the screen is the thumb's natural resting zone — putting primary nav there means the most common actions require the least effort. More than 5 items shrink tap targets below usable size and overwhelm scanning.

- **Every interactive target should be at least `44x44 CSS px` in both dimensions.** This includes secondary elements that are easy to overlook: inline action buttons (edit, delete, view), expand/collapse toggles, filter chips, icon buttons in toolbars, close buttons on sheets, and checkbox/radio rows (use the `<label>` as the full tap target, not the input alone). Capacitive touchscreens register the center of a finger's contact patch at roughly 44pt — smaller targets cause mispress frustration, especially in motion. Common Tailwind classes that fall short: `h-8` (32px), `h-9` (36px), `p-1` on an icon (~24px), `p-1.5` (~28px), `p-2` (~32px). Use `h-11` (44px), `min-h-[44px]`, or equivalent as the baseline for every tappable element. This aligns with Apple HIG and exceeds WCAG 2.2's 24px minimum.

- **Do not rely on hover, tiny icon taps, or hidden row actions.** There is no hover state on touch — anything that requires hover to discover is invisible. Use visible controls, swipe actions with a visual hint, or a contextual sheet/menu.

- **Avoid horizontal page scroll.** One-handed phone use is vertical thumb scrolling. Horizontal scroll breaks the user's spatial model and hides content off-screen with no visible affordance. Reflow, stack, paginate, or locally scroll tables and charts instead of the whole page.

- **Use `viewport-fit=cover`, `env(safe-area-inset-*)`, and `min-height: 100dvh`.** Modern iPhones have rounded corners, the Dynamic Island, and the home indicator — all of which eat into the rectangular viewport. Without explicit safe-area handling, content gets clipped behind hardware chrome. `dvh` accounts for the collapsing Safari toolbar that old `vh` does not.

- **Keep primary actions clear of browser bars, the home indicator, rounded corners, and the on-screen keyboard.** A "Submit" button hidden behind the keyboard or overlapping the home indicator is functionally broken — the user either can't see it or can't tap it without triggering a system gesture.

- **Prefer one main scroll container for form-heavy or keyboard-heavy flows.** Nested scroll regions on iOS Safari create scroll-trapping: the user's thumb scrolls the inner container when they intended to scroll the page, or vice versa. WebKit has had persistent bugs here (see reference file). Use nested scroll only when there's no alternative.

- **Use semantic mobile inputs.** Labels above fields (not beside — there's no horizontal space), correct `type`, `inputmode`, `autocomplete`, and `enterkeyhint`. These attributes control which keyboard appears — `inputmode="decimal"` shows the number pad for currency, `enterkeyhint="next"` lets users tab through a form without dismissing the keyboard.

- **Treat large text as real layout input.** iOS users can set system-wide larger text, and many do. Wrap and reflow — do not hide key meaning behind truncation. If a truncated label makes the user guess whether they're looking at "Savings Account" or "Salary Account," the layout has failed.

- **On phones, charts support the story; they are not the whole story.** A phone screen can render maybe 5-6 legible bars or one donut. That's not enough data density for the chart to be self-explanatory. Lead with the headline number and a text summary; use the chart as visual reinforcement.

- **Preserve the product's existing brand and design system** unless the user asks for a broader redesign. Mobile adaptation is about layout and interaction, not reskinning.

## Examples

Before you change a navigation shell, a data table, or a form with a submit button, read [references/mobile-examples.md](references/mobile-examples.md). It has before/after code for a sidebar that becomes a bottom tab bar, a table that becomes a card list on phones, and a form whose submit button stays above the keyboard.

## Workflow

1. Lock target context.
   - device, browser, orientation, usage context
   - default to iPhone Pro Max + iOS Safari if unspecified
2. Audit the shell first.
   - navigation mode
   - safe areas
   - sticky/fixed bars
   - landscape behavior
   - keyboard behavior
3. Audit each screen or component.
   - lists and rows
   - forms
   - tables
   - charts
   - empty/error/loading states
4. Choose the hard cutover.
   - what becomes single-column
   - what becomes cards
   - what moves into a sheet/drawer
   - what becomes secondary under `More`
5. Implement mobile-first adaptations.
   - prefer container queries for component internals
   - prefer viewport queries for shell/layout mode changes
   - do not keep old half-desktop/half-mobile behavior unless explicitly required
6. Verify on compact portrait and compact landscape.
   - Safari/WebKit first
   - then Chromium
7. Report the highest-risk issues first, then the concrete changes and any remaining gaps.

## Screen Checklist

### Shell and navigation

- Keep landscape phones in the phone shell.
- Avoid hard `md => desktop sidebar` switches for devices that are still phones.
- Pad bottom UI with `env(safe-area-inset-bottom)`.
- Make sticky actions sit above bottom nav.
- Keep mobile labels short.

### Lists and rows

- Let titles, metadata, and amounts wrap into two rows when needed.
- Reserve stable space for prices, balances, and totals.
- Prefer stacked metadata over squeezed inline metadata.
- Expose actions with visible controls or a sheet/menu, not hover.
- Size row action buttons (edit, delete, view, expand) to at least `44x44 CSS px` — not just primary nav and toolbar buttons.

### Forms

- Use one column on compact phones.
- Keep submit visible above the keyboard.
- Use a clear full-width primary CTA.
- Break long flows into steps or progressive disclosure.
- Avoid `type="number"` for currency if formatting or precision matters.

### Tables and import/review flows

- Convert dense editable tables to cards/lists on phones.
- If a true table must remain, isolate horizontal scroll to the table only.
- Keep sticky headers and toolbars from obscuring focused inputs.

### Charts and stats

- Lead with the key number and short narrative.
- Add compact legends and text fallback.
- Prefer horizontal scroll or paged comparisons over unreadable dense bars.
- Avoid tiny pies/donuts on compact screens.

## Verification

For each check below, confirm the specific pass condition and use the suggested tooling. Real device testing is the gold standard — simulators are useful for iteration but cannot fully reproduce keyboard timing, scroll inertia, or touch precision.

- **Portrait and landscape** — Phone stays in the mobile shell in both orientations. No layout breakage, no content overflow, no sudden switch to a desktop sidebar or multi-pane view. Test at 375px (iPhone SE/mini class), 390px (iPhone Pro), and 430px (iPhone Pro Max) portrait, and their landscape equivalents. Use Chrome DevTools device toolbar or Xcode Simulator.

- **iOS Safari safe areas** — Content is not clipped by the Dynamic Island, rounded corners, or home indicator. Bottom-fixed elements have visible `env(safe-area-inset-bottom)` padding (~34px on Face ID iPhones). Verify that `viewport-fit=cover` is set in the viewport meta tag — without it, all `env(safe-area-inset-*)` values return `0`. Best tested in Xcode Simulator (accurate per-device insets) or Polypane 26+ (desktop browser with real safe-area inset presets). Chrome DevTools 135+ supports `Emulation.setSafeAreaInsetsOverride` but requires manual configuration.

- **Keyboard-open form flow** — Focus each input in sequence and verify: (1) the focused field scrolls into view, (2) the submit action is visible and tappable, (3) sticky headers don't obscure the focused field. Be aware that `position: fixed; bottom: 0` elements hide behind the iOS keyboard (the Layout Viewport doesn't shrink), and `position: sticky; bottom: 0` also fails to pin during keyboard display (WebKit bug #202120). Playwright and Cypress cannot trigger real on-screen keyboards — this requires real device testing or Xcode Simulator with Safari Web Inspector.

- **Large text / display zoom** — WCAG 1.4.4 (AA) requires text resizable to 200% without loss of content. WCAG 1.4.10 (AA) requires reflow at 400% zoom (equivalent to 320px-wide viewport) without horizontal scroll. Test by: (1) setting browser zoom to 200% and verifying no truncation or overlap, (2) setting viewport to 1280px and zooming to 400% to simulate the 320px reflow requirement, (3) enabling iOS Settings > Accessibility > Display & Text Size > Larger Text at maximum. Verify the viewport meta tag does not set `user-scalable=no` or `maximum-scale` below 2.0.

- **Reduced motion** — Animations respect `prefers-reduced-motion: reduce`. Transitions still communicate state changes but use crossfades or opacity rather than motion. iOS Safari does not automatically suppress web animations when Reduce Motion is on — the developer must handle it. Test via: Chrome DevTools Rendering tab > "Emulate prefers-reduced-motion", Safari Web Inspector preference overrides (available since late 2022), or Playwright's `page.emulateMedia({ reducedMotion: 'reduce' })`.

- **Empty/error/loading states** — These states render properly on the compact screen. Loading skeletons match the mobile layout, not the desktop one. Error messages are readable without scrolling.

- **Standalone/PWA mode** (when relevant) — If the app supports `display: standalone`, verify that the status bar area, home indicator, and gesture regions are handled. `svh` and `dvh` resolve to the same value in standalone mode since there's no collapsible toolbar (WebKit bug #261185). WebKit bug #254868 can cause incorrect height values. WebKit bug #265578 causes visual viewport height to update late when Safari UI animates back into view.

- **No horizontal document scroll** — Swipe left/right on the page body produces no movement. Any horizontal scroll is isolated to a specific container (table, carousel) with visible overflow affordance and `overscroll-behavior: contain` to prevent triggering Safari UI shifts (WebKit bug #240861). For automated verification in Playwright:
  ```js
  const hasOverflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(hasOverflow).toBe(false);
  ```

## Deliverable

When using this skill, produce:

- a short mobile adaptation plan
- the highest-risk issues first
- concrete per-screen changes
- verification performed
- any remaining device/browser uncertainty
