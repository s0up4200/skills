# Mobile adaptation examples

## Desktop sidebar nav → mobile bottom tab bar

Apple HIG (confirmed current as of WWDC 2024/2025) recommends 3–5 tabs on iPhone, bottom-positioned, with glyph icons and required labels. The bottom bar remains the standard on iPhone — the floating top-bar redesign in iPadOS 18 is iPad-only and not applicable to mobile web.

**Before** — a sidebar that works on desktop but steals half the phone screen:
```tsx
<aside className="w-64 fixed left-0 top-0 h-full border-r">
  <nav className="flex flex-col gap-2 p-4">
    <Link href="/dashboard">Dashboard</Link>
    <Link href="/transactions">Transaksjoner</Link>
    <Link href="/accounts">Kontoer</Link>
    <Link href="/categories">Kategorier</Link>
    <Link href="/settings">Innstillinger</Link>
  </nav>
</aside>
```

**After** — bottom tab bar with safe-area padding and 44x44 tap targets (WCAG 2.5.5 AAA, Apple HIG minimum). The `env(safe-area-inset-bottom)` value is ~34px on Face ID iPhones for the home indicator, but returns `0` without `viewport-fit=cover` in the viewport meta tag. Each `NavTab` renders at least `h-14` (56px) to clear the 44px minimum with comfortable padding:
```tsx
<nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background
                pb-[env(safe-area-inset-bottom)] md:hidden">
  <div className="flex items-center justify-around h-14">
    <NavTab href="/dashboard" icon={HomeIcon} label="Hjem" />
    <NavTab href="/transactions" icon={ListIcon} label="Transaksjoner" />
    <NavTab href="/accounts" icon={WalletIcon} label="Kontoer" />
    <NavTab href="/categories" icon={TagIcon} label="Kategorier" />
  </div>
</nav>
{/* Main content gets bottom padding to clear tab bar + safe area */}
<main className="pb-20 md:pb-0 md:ml-64">...</main>
```

## Dense data table → card list on phones

When a 5-column table renders on a 390px screen, columns get squeezed below readable width or force horizontal document scroll. The card pattern preserves all data while using vertical space, which phones have in abundance.

**Before** — a multi-column table that forces horizontal scroll:
```tsx
<table className="w-full">
  <thead><tr>
    <th>Dato</th><th>Beskrivelse</th><th>Kategori</th><th>Belop</th><th>Konto</th>
  </tr></thead>
  <tbody>{rows.map(r => (
    <tr><td>{r.date}</td><td>{r.desc}</td><td>{r.cat}</td><td>{r.amount}</td><td>{r.account}</td></tr>
  ))}</tbody>
</table>
```

**After** — stacked cards that use vertical space and remain scannable. The amount gets `tabular-nums` and `whitespace-nowrap` so financial figures stay aligned and never break mid-number. If the original table must remain for accessibility (e.g., screen reader users who benefit from row/column association), keep it in the DOM and toggle visibility at the breakpoint rather than removing it:
```tsx
<ul className="divide-y md:hidden" role="list">
  {rows.map(r => (
    <li key={r.id} className="flex items-start justify-between gap-3 px-4 py-3
                               min-h-[44px]" role="listitem">
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{r.desc}</p>
        <p className="text-sm text-muted">{r.date} · {r.cat}</p>
      </div>
      <span className="tabular-nums font-medium whitespace-nowrap">
        {formatNOK(r.amount)}
      </span>
    </li>
  ))}
</ul>
```

## Form with keyboard-aware submit

On iOS Safari, when the keyboard opens the Layout Viewport stays the same size but the Visual Viewport shrinks. Elements with `position: fixed; bottom: 0` stay anchored to the Layout Viewport and disappear behind the keyboard (WebKit bug #202120 confirms `position: sticky; bottom: 0` also fails to pin when the keyboard is open). The safest pattern is to let the submit button scroll naturally within the form flow, or use `position: sticky` with a `visualViewport` resize listener as a fallback.

Use `inputmode="decimal"` instead of `type="number"` for currency — it shows the decimal keyboard without the spinner arrows, which are a mobile UX antipattern for money fields. Chain `enterkeyhint="next"` on intermediate fields so users can advance without dismissing the keyboard, and `enterkeyhint="done"` on the last field.

**Before** — submit button at the bottom of a long form, hidden when the keyboard opens:
```tsx
<form className="space-y-4 p-4">
  <Input label="Belop" type="number" />
  <Input label="Beskrivelse" />
  <Select label="Kategori" options={categories} />
  <Button type="submit">Lagre</Button>
</form>
```

**After** — inline submit that scrolls with form content, staying naturally reachable. The outer container uses `min-h-[100dvh]`. Note: `dvh` tracks the collapsing Safari toolbar, not the keyboard — no CSS unit follows the Visual Viewport. The `sticky bottom-0` footer will not pin while the keyboard is open (WebKit bug #202120), but it sits in normal flow at the end of the form, so it scrolls into reach:
```tsx
<form className="flex flex-col min-h-[100dvh]">
  <div className="flex-1 space-y-4 p-4">
    <Input label="Belop" type="text" inputMode="decimal"
           enterKeyHint="next" autoComplete="off" />
    <Input label="Beskrivelse" enterKeyHint="next" autoComplete="off" />
    <Select label="Kategori" options={categories} />
  </div>
  <div className="sticky bottom-0 p-4 border-t bg-background
                  pb-[max(1rem,env(safe-area-inset-bottom))]">
    <Button type="submit" className="w-full h-12">Lagre</Button>
  </div>
</form>
```
