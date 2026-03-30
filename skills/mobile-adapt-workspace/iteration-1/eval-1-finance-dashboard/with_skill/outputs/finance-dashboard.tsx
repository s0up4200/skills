import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Target: iPhone Pro Max class (390–440px CSS px), iOS Safari, portrait + landscape.

// 7 nav items exceed the 3–5 bottom tab bar limit. Primary 4 go in the bar;
// Settings moves to a More/sheet pattern (simplified here as a 5th tab).
const primaryNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: "HomeIcon" },
  { href: "/transactions", label: "Transactions", icon: "ListIcon" },
  { href: "/accounts", label: "Accounts", icon: "WalletIcon" },
  { href: "/budgets", label: "Budgets", icon: "PieChartIcon" },
  { href: "/settings", label: "Settings", icon: "SettingsIcon" },
];

// Items that didn't fit the primary bar; accessible via Settings or a More sheet.
// Investments and Reports are still reachable — they're just not top-level on phone.
const _overflowNavItems = [
  { href: "/investments", label: "Investments", icon: "TrendingUpIcon" },
  { href: "/reports", label: "Reports", icon: "FileTextIcon" },
];

const revenueData = [
  { month: "Jan", revenue: 4200 },
  { month: "Feb", revenue: 3800 },
  { month: "Mar", revenue: 5100 },
  { month: "Apr", revenue: 4700 },
  { month: "May", revenue: 6200 },
  { month: "Jun", revenue: 5800 },
];

const transactions = [
  { id: 1, date: "2026-03-28", description: "Grocery Store", category: "Food", account: "Checking", amount: "-$82.40", negative: true },
  { id: 2, date: "2026-03-27", description: "Salary Deposit", category: "Income", account: "Checking", amount: "+$4,210.00", negative: false },
  { id: 3, date: "2026-03-26", description: "Electric Bill", category: "Utilities", account: "Checking", amount: "-$134.50", negative: true },
  { id: 4, date: "2026-03-25", description: "Coffee Shop", category: "Food", account: "Credit Card", amount: "-$6.75", negative: true },
  { id: 5, date: "2026-03-24", description: "Gym Membership", category: "Health", account: "Credit Card", amount: "-$49.99", negative: true },
];

// NavTab renders at min h-14 (56px) to ensure 44px tap target with comfortable padding.
// aria-current signals the active route to assistive tech.
function NavTab({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      className="flex flex-col items-center justify-center flex-1 h-14 gap-0.5 text-xs
                 text-gray-500 aria-[current=page]:text-blue-600"
    >
      {/* Icon placeholder — replace with actual icon component */}
      <span className="w-6 h-6 rounded bg-gray-200 aria-[current=page]:bg-blue-100" />
      <span className="truncate max-w-[56px]">{label}</span>
    </a>
  );
}

export default function Dashboard() {
  // Peak revenue for the text summary (supports the chart story on small screens).
  const peakMonth = revenueData.reduce((a, b) => (b.revenue > a.revenue ? b : a));

  return (
    // min-h-[100dvh]: dvh tracks the collapsing Safari toolbar; vh does not.
    // The outer wrapper is a flex column so the bottom nav stays at the visual bottom.
    <div className="flex flex-col min-h-[100dvh] bg-gray-50">

      {/*
        DESKTOP SIDEBAR — hidden on phones (md:flex), shown only on true tablet/desktop.
        A landscape phone at 768px still uses the phone shell; the md: breakpoint is
        intentionally set wide enough to avoid triggering on compact phones in landscape.
        On phones the sidebar is fully replaced by the bottom tab bar below.
      */}
      <div className="hidden md:flex h-screen">
        <aside className="w-64 border-r bg-gray-50 flex flex-col flex-shrink-0">
          <div className="p-6 font-bold text-xl">FinanceApp</div>
          <nav className="flex-1 px-3" aria-label="Main navigation">
            {[...primaryNavItems, ..._overflowNavItems].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                           hover:bg-gray-100 min-h-[44px]"
              >
                <span className="w-5 h-5 rounded bg-gray-200 flex-shrink-0" />
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Desktop main content */}
        <main className="flex-1 overflow-auto p-8">
          <DashboardContent peakMonth={peakMonth} />
        </main>
      </div>

      {/*
        MOBILE LAYOUT — flex column that fills the screen.
        Visible only on compact phones (md:hidden on the nav bar below).
      */}
      <div className="flex flex-col flex-1 md:hidden">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 bg-white border-b px-4 h-14 flex items-center
                           pt-[env(safe-area-inset-top)]">
          <span className="font-bold text-lg">FinanceApp</span>
        </header>

        {/* Mobile scrollable main content */}
        {/*
          pb-[calc(3.5rem+env(safe-area-inset-bottom))]: clears the bottom nav bar (h-14 = 56px)
          plus the home indicator safe area (~34px on Face ID iPhones).
        */}
        <main
          className="flex-1 overflow-y-auto px-4 py-4
                     pb-[calc(3.5rem+env(safe-area-inset-bottom))]"
        >
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <DashboardContent peakMonth={peakMonth} />
        </main>
      </div>

      {/*
        BOTTOM TAB BAR — mobile only.
        Fixed to the bottom with safe-area padding for the home indicator.
        env(safe-area-inset-bottom) is ~34px on Face ID iPhones with viewport-fit=cover;
        returns 0 without it — ensure the viewport meta tag includes viewport-fit=cover.
        Each tab renders at h-14 (56px) which satisfies the 44px minimum tap target.

        WebKit bug #297779 (iOS 26 beta): fixed elements can bounce during scroll.
        Workaround: prefer position:sticky. Here fixed is correct for a persistent nav bar
        outside the scroll flow; monitor this bug on iOS 26 production release.
      */}
      <nav
        aria-label="Primary navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t
                   pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-stretch">
          {primaryNavItems.map((item) => (
            <NavTab
              key={item.href}
              href={item.href}
              label={item.label}
              active={item.href === "/dashboard"}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}

// DashboardContent is shared between mobile and desktop layouts.
function DashboardContent({ peakMonth }: { peakMonth: { month: string; revenue: number } }) {
  return (
    <>
      {/* Stats grid
          Desktop: 4 columns. Mobile: 2 columns.
          2-column at ~190px each is comfortable on a 390px phone;
          4 columns at ~85px each is not — numbers get clipped. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Balance" value="$24,563.00" />
        <StatCard label="Monthly Income" value="$8,420.00" />
        <StatCard label="Monthly Expenses" value="$5,234.00" />
        <StatCard label="Savings Rate" value="37.8%" />
      </div>

      {/* Revenue chart
          Core rule: on phones, charts support the story — they are not the whole story.
          Lead with the headline number and a text summary; the chart reinforces visually.

          ResponsiveContainer replaces the hardcoded width={700} which would overflow at
          390px. Height is intentionally capped at 200px on mobile to leave room for the
          summary text without dominating the viewport. */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <h2 className="text-lg font-semibold mb-1">Monthly Revenue</h2>
        {/* Text summary — the primary story on a phone screen */}
        <p className="text-sm text-gray-500 mb-4">
          Peak in {peakMonth.month}: ${peakMonth.revenue.toLocaleString()}. Revenue trending
          upward over the last 6 months.
        </p>
        <div className="h-[180px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              {/* Shorter tick labels on mobile avoid overlap */}
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions
          Desktop: standard 5-column table.
          Mobile: card list — preserves all data using vertical space.

          The desktop table stays in the DOM (md:block) rather than being removed so that
          screen-reader users who benefit from row/column association still get it.
          The card list is hidden on desktop (md:hidden).

          "View All" is a visible button (not hover-only) — there is no hover on touch. */}
      <div className="bg-white rounded-xl border">
        <div className="px-4 py-3 border-b flex justify-between items-center min-h-[52px]">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          {/* min-h-[44px] and px-3 ensure the tap target meets the 44px minimum */}
          <a
            href="/transactions"
            className="text-sm text-blue-600 px-3 min-h-[44px] flex items-center
                       rounded-lg hover:bg-blue-50 active:bg-blue-100"
          >
            View All
          </a>
        </div>

        {/* Mobile card list — hidden on md and up */}
        <ul className="divide-y md:hidden" role="list">
          {transactions.map((t) => (
            <li
              key={t.id}
              className="flex items-start justify-between gap-3 px-4 py-3 min-h-[60px]"
            >
              <div className="min-w-0 flex-1">
                {/* Allow long descriptions to wrap rather than truncate/clip */}
                <p className="font-medium leading-snug">{t.description}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {/* Compact date without year saves horizontal space */}
                  {t.date.slice(5)} · {t.category} · {t.account}
                </p>
              </div>
              {/* tabular-nums + whitespace-nowrap: financial figures stay aligned,
                  never break mid-number regardless of font size or zoom level. */}
              <span
                className={`tabular-nums font-medium whitespace-nowrap text-sm mt-0.5
                            ${t.negative ? "text-red-600" : "text-green-600"}`}
              >
                {t.amount}
              </span>
            </li>
          ))}
        </ul>

        {/* Desktop table — hidden on mobile, kept in DOM for accessibility */}
        <table className="hidden md:table w-full">
          <thead className="bg-gray-50 text-left text-sm text-gray-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{t.date}</td>
                <td className="px-4 py-3 text-sm font-medium">{t.description}</td>
                <td className="px-4 py-3 text-sm">{t.category}</td>
                <td className="px-4 py-3 text-sm">{t.account}</td>
                <td
                  className={`px-4 py-3 text-sm text-right tabular-nums
                              ${t.negative ? "text-red-600" : "text-green-600"}`}
                >
                  {t.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// StatCard extracted to a component so both layouts share it.
// @container lets the card adapt its internal layout based on its own width,
// independent of the parent grid. Tailwind v4 — @container is first-class, no plugin.
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="@container bg-white rounded-xl border p-4">
      {/* Allow label to wrap on narrow cards rather than clip behind truncation.
          "Monthly Expenses" is 16 characters; at ~85px it would truncate on a 4-column
          mobile grid, making the user guess which stat they're reading. */}
      <p className="text-sm text-gray-500 leading-snug">{label}</p>
      {/* tabular-nums: financial values stay visually aligned across cards.
          whitespace-nowrap: dollar amounts never break mid-number. */}
      <p className="text-xl font-bold tabular-nums whitespace-nowrap mt-1">{value}</p>
    </div>
  );
}

/*
  REQUIRED: Add the following to your <head> / _document.tsx / layout.tsx:

    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, viewport-fit=cover"
    />

  Without viewport-fit=cover, all env(safe-area-inset-*) values return 0,
  meaning bottom nav sits over the home indicator and content gets clipped by
  Dynamic Island / rounded corners on Face ID iPhones.
  Source: https://webkit.org/blog/7929/designing-websites-for-iphone-x/

  Also: do NOT add maximum-scale=1 or user-scalable=no — these break WCAG 1.4.4
  (text resizing to 200%) and are overridden by iOS Safari anyway since iOS 10.
*/
