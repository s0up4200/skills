import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

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
  { id: 1, date: "2026-03-28", description: "Grocery Store", category: "Food", account: "Checking", amount: "-$82.40" },
  { id: 2, date: "2026-03-27", description: "Salary Deposit", category: "Income", account: "Checking", amount: "+$4,210.00" },
  { id: 3, date: "2026-03-26", description: "Electric Bill", category: "Utilities", account: "Checking", amount: "-$134.50" },
  { id: 4, date: "2026-03-25", description: "Coffee Shop", category: "Food", account: "Credit Card", amount: "-$6.75" },
  { id: 5, date: "2026-03-24", description: "Gym Membership", category: "Health", account: "Credit Card", amount: "-$49.99" },
];

export default function Dashboard() {
  return (
    <div className="flex h-[100vh]">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-gray-50 flex flex-col">
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
      <main className="flex-1 overflow-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">Total Balance</p>
            <p className="text-2xl font-bold">$24,563.00</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">Monthly Income</p>
            <p className="text-2xl font-bold">$8,420.00</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">Monthly Expenses</p>
            <p className="text-2xl font-bold">$5,234.00</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">Savings Rate</p>
            <p className="text-2xl font-bold">37.8%</p>
          </div>
        </div>

        {/* Revenue chart */}
        <div className="bg-white rounded-xl border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Monthly Revenue</h2>
          <BarChart width={700} height={300} data={revenueData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="revenue" fill="#3b82f6" />
          </BarChart>
        </div>

        {/* Transactions table */}
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            <button className="text-sm text-blue-600 hover:underline">View All</button>
          </div>
          <table className="w-full">
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
                  <td className="px-4 py-3 text-sm text-right tabular-nums">{t.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
