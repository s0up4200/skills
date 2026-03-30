import { useState } from "react";
import { Pencil, Trash2, Eye, Download, Filter, Search, ChevronDown, ChevronUp } from "lucide-react";

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

function CustomerCard({ c }: { c: Customer }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-xl bg-white overflow-hidden">
      {/* Primary row — always visible */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Name + email */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{c.name}</p>
          <p className="text-xs text-gray-500 truncate">{c.email}</p>
        </div>

        {/* Status dot */}
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            c.status === "active" ? "bg-green-500" : "bg-gray-300"
          }`}
        />

        {/* Plan badge */}
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 flex-shrink-0">
          {c.plan}
        </span>

        {/* MRR */}
        <span className="text-sm tabular-nums text-gray-700 flex-shrink-0 w-16 text-right">
          ${c.mrr}/mo
        </span>

        {/* Expand toggle */}
        <button
          className="p-1 flex-shrink-0 text-gray-400"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t px-4 py-3 bg-gray-50 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">ID</span>
            <span className="font-mono text-gray-400">{c.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className={c.status === "active" ? "text-green-700" : "text-gray-400"}>
              {c.status}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Last Active</span>
            <span className="text-gray-600">{c.lastActive}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Signup</span>
            <span className="text-gray-600">{c.signupDate}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm hover:bg-gray-100 active:bg-gray-200">
              <Eye className="w-4 h-4" />
              View
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm hover:bg-gray-100 active:bg-gray-200">
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm text-red-500 hover:bg-red-50 active:bg-red-100">
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomersPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = customers.filter((c) => {
    const matchesPlan =
      filter === "all" || c.plan.toLowerCase() === filter;
    const matchesSearch =
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    return matchesPlan && matchesSearch;
  });

  return (
    <div className="px-4 pt-5 pb-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="flex items-center gap-2">
          <button
            className="p-2 border rounded-lg hover:bg-gray-50 active:bg-gray-100"
            title="Export"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            className={`p-2 border rounded-lg hover:bg-gray-50 active:bg-gray-100 ${
              showFilters ? "bg-gray-100" : ""
            }`}
            title="Filter"
            onClick={() => setShowFilters((v) => !v)}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="mb-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full text-sm border rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      )}

      {/* Customer cards */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">No customers found.</p>
        ) : (
          filtered.map((c) => <CustomerCard key={c.id} c={c} />)
        )}
      </div>
    </div>
  );
}
