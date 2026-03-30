# Mobile Audit Report — AppLayout

**Target:** iPhone Pro Max class (390–430 CSS px), iOS Safari, portrait and landscape
**Scope:** Shell layout component only — no forms, tables, or charts present
**Date:** 2026-03-30

---

## Mobile Adaptation Plan

The layout has a desktop sidebar that correctly hides below `md`, but leaves mobile users with no persistent navigation — only a hamburger menu that goes nowhere. The safe-area and viewport infrastructure is also absent. The three-priority plan:

1. Replace the non-functional hamburger header with a bottom tab bar carrying the same 5 destinations.
2. Fix the viewport meta tag to enable safe-area insets and use `dvh` instead of `vh`.
3. Bring all tap targets up to the 44px minimum.

---

## Highest-Risk Issues (priority order)

### 1. No usable navigation on mobile — CRITICAL

The original component hides the sidebar at `md` and replaces it with a hamburger button that has no `onClick` handler and opens no menu. On mobile, users have zero way to navigate between sections. This is a functional blocker for launch.

**Fix applied:** Replaced the hamburger header with a persistent bottom tab bar (`md:hidden`) containing all 5 primary destinations. Bottom placement matches Apple HIG tab bar guidance (WWDC 2022/10001) and puts nav in the thumb's natural resting zone.

### 2. Missing `viewport-fit=cover` — HIGH

```html
<!-- Before -->
<meta name="viewport" content="width=device-width, initial-scale=1" />

<!-- After -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

Without `viewport-fit=cover`, all `env(safe-area-inset-*)` values silently return `0`. The bottom tab bar's `pb-[env(safe-area-inset-bottom)]` padding would do nothing, and the bar would sit on top of the home indicator on Face ID iPhones — visually overlapping system chrome and reducing the effective tap target height.
Source: https://webkit.org/blog/7929/designing-websites-for-iphone-x/

### 3. `h-[100vh]` does not account for the iOS Safari collapsible toolbar — HIGH

```tsx
// Before
<div className="flex h-[100vh]">

// After
<div className="flex min-h-[100dvh]">
```

On iOS Safari, `100vh` is fixed to the largest possible viewport (toolbar hidden). When the toolbar is visible (~50px), the bottom of the layout is hidden behind it. `100dvh` tracks the actual dynamic visible viewport.
Source: https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/

`min-h` rather than `h` is also safer: it allows content to grow taller than the viewport on text-enlarged or zoomed screens without clipping.

### 4. Undersized tap targets — MEDIUM

Two interactive elements were below the 44px Apple HIG minimum:

- **Hamburger button**: `p-1` + `w-6 h-6` icon ≈ 28×28px total. Removed in favour of the bottom tab bar.
- **Desktop Settings button**: `p-0` implicit + `w-4 h-4` icon ≈ ~28px tap area. Fixed with `min-h-[44px]` on the anchor element.

WCAG 2.5.5 AAA target is 44×44 CSS px. WCAG 2.2 minimum is 24×24, but for phone UI the Apple-style 44px default is the right target.
Source: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum, https://developer.apple.com/design/tips/

### 5. Main content not clearing the bottom tab bar — MEDIUM

Without explicit bottom padding on `<main>`, the last item of any list or the bottom of any scrollable page would be hidden behind the tab bar (56px) and the home indicator (~34px on Face ID iPhones).

**Fix applied:**
```tsx
<main className="... pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0 ...">
```
`3.5rem` = `h-14` (56px tab bar height). The `calc()` adds safe-area on top so content clears both.

---

## Concrete Per-Screen Changes

### Shell / Navigation

| Before | After | Reason |
|--------|-------|--------|
| Hamburger button, no nav on mobile | Bottom tab bar with 5 labeled tabs | No persistent nav is a blocker |
| `viewport-fit=cover` absent | Added to viewport meta | Required for `env()` values |
| `h-[100vh]` | `min-h-[100dvh]` | Accounts for collapsible Safari toolbar |
| No safe-area padding on bottom | `pb-[env(safe-area-inset-bottom)]` on tab bar | Clears home indicator |
| Main content has no bottom clearance | `pb-[calc(3.5rem+env(safe-area-inset-bottom))]` | Content clears tab bar + safe area |
| Desktop Settings button ~28px | `min-h-[44px]` on `<a>` | Meets Apple HIG minimum |

### Preserved

- Desktop sidebar layout unchanged — still visible at `md+` with identical links.
- All existing `NavLink` styles preserved.
- Brand and design system (Tailwind, Lucide icons) unchanged.

---

## Verification Notes

Test in this order (Safari first per the skill):

**1. Portrait + landscape — iOS Safari**
Both orientations should stay in the mobile shell (bottom tab bar visible, sidebar hidden). A landscape phone is still a phone — confirm the layout does not revert to desktop sidebar at landscape width.
Test at 390px and 430px portrait; 844px and 932px landscape.

**2. Safe-area insets — Xcode Simulator or Polypane 26+**
Confirm the tab bar bottom padding is ~34px on an iPhone 16 Pro (Face ID). Chrome DevTools 135+ can emulate this via `Emulation.setSafeAreaInsetsOverride` but requires manual setup. Polypane 26+ has per-device inset presets and is the most practical desktop option.
Source: https://polypane.app/blog/polypane-26-accurate-device-emulation-with-safe-area-and-small-viewport-units/

**3. WebKit bug 297779 — fixed element bouncing (iOS 26 beta)**
If the tab bar bounces up and down when scroll direction changes, migrate `position: fixed` to a flex-column wrapper with `position: sticky`. This is an open iOS 26 beta bug.
Source: https://bugs.webkit.org/show_bug.cgi?id=297779

**4. Content clearing the tab bar**
Scroll any long content page to the very bottom and confirm the last element is fully visible above the tab bar with comfortable spacing.

**5. No horizontal document scroll**
Verify: `document.documentElement.scrollWidth === document.documentElement.clientWidth`. In Playwright:
```js
const hasOverflow = await page.evaluate(() =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth
);
expect(hasOverflow).toBe(false);
```

**6. Large text**
Enable iOS Settings > Accessibility > Larger Text at maximum. Confirm tab labels wrap or remain readable — they are short single words so wrapping risk is low. Confirm no `maximum-scale` or `user-scalable=no` is present in the viewport meta tag (none was added).

---

## Remaining Gaps / Uncertainty

**Open items not in this component but needed before launch:**

- **Settings access on mobile**: Settings was a sidebar item. It is not one of the 5 bottom tabs. It should be reachable from the Profile tab (e.g., a gear icon in the profile screen header, or a settings row in a profile list). This needs a decision before launch.

- **Active tab state**: `NavTab` has no active/current state indicator. Without it, users cannot tell which tab they are on. Add `aria-current="page"` and a visual highlight (color or indicator dot) to the active tab.

- **Page-level top padding on mobile**: The hamburger header was `fixed top-0` and required `pt-16` on content. That header is now gone. Some child pages may have hardcoded `pt-16` or `mt-16` to clear the old header — those should be audited and removed.

- **Landscape safe area on iPhone**: `env(safe-area-inset-left)` and `env(safe-area-inset-right)` apply in landscape mode to avoid the rounded corner / camera housing areas. The main content `p-4` padding is likely fine, but if any full-bleed images or edge-to-edge elements are added, landscape horizontal insets will need explicit handling.

- **iOS 26 `visualViewport` bug**: On iOS 26, `visualViewport.offsetTop` may not reset to 0 after keyboard dismissal. If any child screens use a `visualViewport` resize listener for keyboard handling, add a `focusout` handler to force layout recalc as a workaround.
  Source: https://developer.apple.com/forums/thread/800125

- **Real device verification**: Simulator and DevTools are useful for iteration but cannot reproduce keyboard timing, scroll inertia, or touch precision. Before launch, test on at least one physical iPhone (16 class preferred, or 15 Pro as a fallback).
