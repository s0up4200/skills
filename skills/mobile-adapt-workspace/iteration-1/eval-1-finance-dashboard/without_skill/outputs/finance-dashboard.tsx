import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "HomeIcon" },
  { href: "/transactions", label: "Transactions", icon: "ListIcon" },
  { href: "/accounts", label: "Accounts", icon: "WalletIcon" },
  { href: "/budgets", label: "Budgets", icon: "PieChartIcon" },
  { href: "/investments", label: "Investments", icon: "TrendingUpIcon" },
  { href: "/reports", label: "Reports", icon: "FileTextIcon" },
  { href: "/settings", label: "Settings", icon: "SettingsIcon" },
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

export default function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50">
      {/* Mobile header */}
      <header className="sticky top-0 z-40 bg-white border-b flex items-center justify-between px-4 py-3 md:hidden">
        <span className="font-bold text-lg">FinanceApp</span>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200"
          aria-label="Toggle menu"
        >
          <span className="text-xl">{menuOpen ? "✕" : "☰"}</span>
        </button>
      </header>

      {/* Mobile slide-down nav */}
      {menuOpen && (
        <nav className="md:hidden bg-white border-b px-3 pb-3 z-30">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm hover:bg-gray-100 active:bg-gray-200"
            >
              <span className="w-5 h-5" />
              {item.label}
            </a>
          ))}
        </nav>
      )}

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-64 border-r bg-gray-50 flex-col shrink-0">
          <div className="p-6 font-bold text-xl">FinanceApp</div>
          <nav className="flex-1 px-3">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-gray-100"
              >
                <span className="w-5 h-5" />
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Dashboard</h1>

          {/* Stats grid — 2-up on mobile, 4-up on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="bg-white rounded-xl border p-3 md:p-4">
              <p className="text-xs md:text-sm text-gray-500">Total Balance</p>
              <p className="text-lg md:text-2xl font-bold mt-1">$24,563.00</p>
            </div>
            <div className="bg-white rounded-xl border p-3 md:p-4">
              <p className="text-xs md:text-sm text-gray-500">Monthly Income</p>
              <p className="text-lg md:text-2xl font-bold mt-1">$8,420.00</p>
            </div>
            <div className="bg-white rounded-xl border p-3 md:p-4">
              <p className="text-xs md:text-sm text-gray-500">Monthly Expenses</p>
              <p className="text-lg md:text-2xl font-bold mt-1">$5,234.00</p>
            </div>
            <div className="bg-white rounded-xl border p-3 md:p-4">
              <p className="text-xs md:text-sm text-gray-500">Savings Rate</p>
              <p className="text-lg md:text-2xl font-bold mt-1">37.8%</p>
            </div>
          </div>

          {/* Revenue chart — ResponsiveContainer replaces fixed width */}
          <div className="bg-white rounded-xl border p-4 md:p-6 mb-6 md:mb-8">
            <h2 className="text-base md:text-lg font-semibold mb-4">Monthly Revenue</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData} margin={{ top: 0, right: 4, left: -16, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Transactions — card list on mobile, table on desktop */}
          <div className="bg-white rounded-xl border">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-base md:text-lg font-semibold">Recent Transactions</h2>
              <button className="text-sm text-blue-600 hover:underline active:opacity-70">View All</button>
            </div>

            {/* Mobile card list */}
            <ul className="divide-y md:hidden">
              {transactions.map((t) => (
                <li key={t.id} className="px-4 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.category} · {t.account}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.date}</p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums shrink-0 ${t.negative ? "text-red-600" : "text-green-600"}`}>
                    {t.amount}
                  </span>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <table className="w-full hidden md:table">
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
                    <td className={`px-4 py-3 text-sm text-right tabular-nums ${t.negative ? "text-red-600" : "text-green-600"}`}>
                      {t.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
