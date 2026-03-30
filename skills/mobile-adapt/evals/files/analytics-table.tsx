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

export default function CustomersPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  return (
    <div className="p-6">
      {/* Header and toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-7 pr-3 py-1 text-sm border rounded w-48"
            />
          </div>
          <button className="p-1.5 border rounded hover:bg-gray-50" title="Filter">
            <Filter className="w-4 h-4" />
          </button>
          <button className="p-1.5 border rounded hover:bg-gray-50" title="Export">
            <Download className="w-4 h-4" />
          </button>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Data table */}
      <div className="border rounded-xl overflow-hidden">
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
            {customers.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50 group">
                <td className="px-3 py-2 text-sm text-gray-400 font-mono">{c.id}</td>
                <td className="px-3 py-2 text-sm font-medium">{c.name}</td>
                <td className="px-3 py-2 text-sm text-gray-600">{c.email}</td>
                <td className="px-3 py-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
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
                  {/* Actions only visible on hover */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 hover:bg-gray-100 rounded" title="View">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded" title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded text-red-500" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
