import { useState } from "react";
import { Pencil, Trash2, Eye, Download, Filter, Search } from "lucide-react";

type Customer = {
  id: string;
  name: string;
  email: string;
  plan: "Free" | "Pro" | "Enterprise";
  mrr: number;
  status: "active" | "inactive";
  lastActive: string;
  signupDate: string;
};

const customers: Customer[] = [
  { id: "C-001", name: "Alice Chen", email: "alice@example.com", plan: "Enterprise", mrr: 299, status: "active", lastActive: "2h ago", signupDate: "2024-01-15" },
  { id: "C-002", name: "Bob Rivera", email: "bob.r@company.co", plan: "Pro", mrr: 49, status: "active", lastActive: "1d ago", signupDate: "2024-03-22" },
  { id: "C-003", name: "Carol Wu", email: "carol@startup.io", plan: "Free", mrr: 0, status: "inactive", lastActive: "30d ago", signupDate: "2025-06-10" },
  { id: "C-004", name: "Dan Okafor", email: "dan.o@bigcorp.com", plan: "Enterprise", mrr: 299, status: "active", lastActive: "5m ago", signupDate: "2023-11-01" },
  { id: "C-005", name: "Eva Lindgren", email: "eva@agency.se", plan: "Pro", mrr: 49, status: "active", lastActive: "3h ago", signupDate: "2025-01-18" },
];

const planColors: Record<Customer["plan"], string> = {
  Free: "bg-gray-100 text-gray-600",
  Pro: "bg-blue-50 text-blue-700",
  Enterprise: "bg-purple-50 text-purple-700",
};

export default function CustomersPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = customers.filter((c) => {
    const matchesPlan = filter === "all" || c.plan.toLowerCase() === filter;
    const matchesSearch =
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    return matchesPlan && matchesSearch;
  });

  return (
    <div className="p-4 md:p-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      {/* Desktop: single row. Mobile: stacked for usable touch targets. */}
      <div className="mb-4 space-y-3 md:space-y-0 md:flex md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>

        {/* Search — full-width on mobile to avoid cramped layout */}
        <div className="relative md:w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full pl-9 pr-3 border rounded-lg bg-white
                       /* font-size 16px prevents iOS Safari auto-zoom on focus */
                       text-base md:text-sm
                       /* min-height 44px meets Apple HIG / WCAG 2.2 touch target */
                       h-11 md:h-9"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>

        {/* Secondary toolbar — wraps naturally on mobile */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 min-w-[8rem] text-sm border rounded-lg px-3
                       h-11 md:h-9 bg-white"
            aria-label="Filter by plan"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>

          {/* Filter and Export — 44×44px on mobile */}
          <button
            className="flex items-center justify-center border rounded-lg
                       w-11 h-11 md:w-9 md:h-9 bg-white hover:bg-gray-50"
            title="Filter"
            aria-label="Filter"
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            className="flex items-center justify-center border rounded-lg
                       w-11 h-11 md:w-9 md:h-9 bg-white hover:bg-gray-50"
            title="Export"
            aria-label="Export"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Mobile card list ────────────────────────────────────────────────── */}
      {/*
        All data from the desktop table is preserved, stacked vertically.
        Actions are always visible — no hover required.
        Hidden on md+ where the full table renders instead.
      */}
      <ul className="divide-y border rounded-xl overflow-hidden md:hidden" role="list">
        {filtered.map((c) => (
          <li key={c.id} className="bg-white px-4 py-3" role="listitem">
            {/* Row 1: name + status indicator */}
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm leading-snug truncate">{c.name}</p>
                <p className="text-xs text-gray-500 truncate">{c.email}</p>
              </div>
              <span
                className={`inline-flex items-center gap-1 text-xs mt-0.5 shrink-0 ${
                  c.status === "active" ? "text-green-700" : "text-gray-400"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    c.status === "active" ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                {c.status}
              </span>
            </div>

            {/* Row 2: plan badge + MRR */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${planColors[c.plan]}`}
              >
                {c.plan}
              </span>
              {/* tabular-nums + whitespace-nowrap keeps financial figures stable */}
              <span className="text-sm tabular-nums font-medium whitespace-nowrap">
                ${c.mrr}/mo
              </span>
            </div>

            {/* Row 3: metadata */}
            <p className="text-xs text-gray-400 mb-3">
              <span className="font-mono text-gray-300">{c.id}</span>
              {" · "}Active {c.lastActive}
              {" · "}Joined {c.signupDate}
            </p>

            {/* Row 4: always-visible actions — no hover on touch */}
            <div className="flex gap-2">
              <button
                className="flex items-center gap-1.5 px-3 h-9 text-xs border rounded-lg
                           bg-white hover:bg-gray-50 min-w-[44px]"
                aria-label={`View ${c.name}`}
              >
                <Eye className="w-3.5 h-3.5" />
                View
              </button>
              <button
                className="flex items-center gap-1.5 px-3 h-9 text-xs border rounded-lg
                           bg-white hover:bg-gray-50 min-w-[44px]"
                aria-label={`Edit ${c.name}`}
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                className="flex items-center gap-1.5 px-3 h-9 text-xs border rounded-lg
                           bg-white hover:bg-gray-50 text-red-500 min-w-[44px]"
                aria-label={`Delete ${c.name}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </li>
        ))}

        {filtered.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-gray-400">
            No customers match your search.
          </li>
        )}
      </ul>

      {/* ── Desktop table ───────────────────────────────────────────────────── */}
      {/*
        Original table kept for md+ screens. Hidden on mobile to avoid
        horizontal document scroll — the card list above handles phones.
        Screen-reader users get the table; mobile users get the card list.
      */}
      <div className="hidden md:block border rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-left text-sm text-gray-500">
              <th className="px-3 py-2 font-medium">ID</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Plan</th>
              <th className="px-3 py-2 font-medium">MRR</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Last Active</th>
              <th className="px-3 py-2 font-medium">Signup</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50 group">
                <td className="px-3 py-2 text-sm text-gray-400 font-mono">{c.id}</td>
                <td className="px-3 py-2 text-sm font-medium">{c.name}</td>
                <td className="px-3 py-2 text-sm text-gray-600">{c.email}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${planColors[c.plan]}`}>
                    {c.plan}
                  </span>
                </td>
                <td className="px-3 py-2 text-sm tabular-nums">${c.mrr}/mo</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs ${
                      c.status === "active" ? "text-green-700" : "text-gray-400"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        c.status === "active" ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                    {c.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-sm text-gray-500">{c.lastActive}</td>
                <td className="px-3 py-2 text-sm text-gray-500">{c.signupDate}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 hover:bg-gray-100 rounded" title="View">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded" title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="p-1 hover:bg-gray-100 rounded text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-sm text-gray-400">
                  No customers match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
