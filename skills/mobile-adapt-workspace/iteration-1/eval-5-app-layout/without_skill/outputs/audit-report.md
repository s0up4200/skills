# Mobile Audit Report — AppLayout

## Summary

The original component had no mobile-specific optimizations despite rendering content on phones. Five significant issues were found and fixed. The most impactful change is replacing the hamburger-only navigation pattern with a persistent bottom navigation bar, which is the dominant mobile navigation convention and dramatically reduces navigation friction.

---

## Issues Found

### 1. Viewport meta tag missing `viewport-fit=cover`

**Original:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

**Problem:** On iPhone X and later (notched/Dynamic Island devices), omitting `viewport-fit=cover` means the browser keeps content inside the safe area by default. This wastes screen real estate and prevents proper full-bleed backgrounds. More importantly, it means `env(safe-area-inset-*)` values will all be `0`, so any safe-area-aware layout code won't work.

**Fix:** Added `viewport-fit=cover` to the meta tag.

---

### 2. `100vh` breaks on iOS Safari

**Original:**
```jsx
<div className="flex h-[100vh]">
```

**Problem:** iOS Safari's collapsible address bar means `100vh` is calculated against the *full* viewport height (toolbar hidden), but the visible area when the toolbar is shown is shorter. This causes content to be clipped behind the bottom toolbar on page load. This is a well-known iOS Safari bug that has caused layout overflow issues since Safari 12.

**Fix:** Changed to `min-h-[100dvh]` (`100dvh` = dynamic viewport height, which tracks the visible area as toolbars appear/disappear). Added a fallback chain via inline style for older browsers that don't support `dvh`.

---

### 3. Hamburger-only mobile navigation is poor UX

**Original:** On mobile, users got a hamburger menu that opened... nothing (the drawer body was not implemented). There was no persistent navigation.

**Problem:** Hiding all navigation behind a hamburger menu forces an extra tap for every navigation action. Bottom navigation bars (thumb-reachable, always visible) are the standard pattern on mobile apps and significantly improve navigation speed and discoverability. Apple HIG and Material Design both recommend persistent bottom navigation for apps with 3–5 primary destinations.

**Fix:**
- Added a persistent bottom navigation bar (`<nav>` fixed to `bottom: 0`) with icons and labels for all 5 primary destinations.
- Kept the hamburger/drawer for secondary items (Settings) that don't need to be in the bottom bar.
- Implemented a working slide-in drawer with a backdrop that closes on tap-outside, for completeness.

---

### 4. Tap targets too small

**Original:**
```jsx
<button className="p-1">  {/* hamburger button — ~32px tap target */}
```

**Problem:** The original hamburger button had `p-1` (4px padding each side), giving a tap target of roughly 32×32px. Apple HIG recommends 44×44pt minimum; WCAG 2.5.5 (AAA) recommends 44×44px. Small tap targets cause mispresses, especially on older devices or for users with larger fingers.

**Fix:** All interactive elements now have `min-h-[44px] min-w-[44px]` and sufficient padding. NavLink items have `py-3` to reach 44px height. BottomNavItem has `min-h-[44px]`. Header buttons have explicit min dimensions.

---

### 5. No safe area insets for notched devices

**Original:** Content was not inset from device safe areas. On iPhones with a notch or Dynamic Island, the fixed header could overlap the status bar, and the bottom nav (had it existed) would be obscured by the home indicator.

**Fix:**
- Fixed header has `padding-top: env(safe-area-inset-top)` and its `min-height` accounts for that inset.
- Bottom nav has `padding-bottom: env(safe-area-inset-bottom)` so content sits above the home indicator bar.
- Slide-in drawer respects both top and bottom insets.
- Main content's bottom padding accounts for the bottom nav height (56px) plus `env(safe-area-inset-bottom)` so the last content item isn't hidden behind the nav.

---

## Changes Made

| Area | Before | After |
|---|---|---|
| Viewport meta | `initial-scale=1` only | Added `viewport-fit=cover` |
| Layout height | `h-[100vh]` | `min-h-[100dvh]` |
| Mobile navigation | Hamburger only, no drawer | Bottom nav bar + working drawer |
| Tap targets | ~32px hamburger button | 44px minimum on all interactive elements |
| Safe area insets | Not applied | Header top, bottom nav bottom, drawer top+bottom, content padding |
| Drawer | Not implemented | Slide-in panel with backdrop dismiss |

---

## What Was Not Changed

- Desktop sidebar layout — no issues found, it only renders at `md:` and above.
- The NavLink component structure — only added `onClick` prop and increased `py` for tap target size.
- Lucide icon set and Tailwind class approach.
