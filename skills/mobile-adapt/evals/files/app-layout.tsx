import { ReactNode } from "react";
import {
  Home,
  Search,
  BookOpen,
  Heart,
  User,
  Settings,
  Menu,
} from "lucide-react";

function NavLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
    >
      <Icon className="w-5 h-5" />
      {children}
    </a>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Missing viewport-fit=cover */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {/* Uses 100vh — does not account for iOS Safari collapsible toolbar */}
        <div className="flex h-[100vh]">
          {/* Desktop sidebar — hidden below md breakpoint */}
          <aside className="hidden md:flex w-64 flex-col border-r bg-white shrink-0">
            <div className="p-6">
              <h1 className="text-xl font-bold">MyApp</h1>
            </div>
            <nav className="flex-1 px-3 space-y-1">
              <NavLink href="/" icon={Home}>Home</NavLink>
              <NavLink href="/search" icon={Search}>Search</NavLink>
              <NavLink href="/library" icon={BookOpen}>Library</NavLink>
              <NavLink href="/favorites" icon={Heart}>Favorites</NavLink>
              <NavLink href="/profile" icon={User}>Profile</NavLink>
            </nav>
            <div className="p-4 border-t">
              <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </aside>

          {/* Mobile: hamburger menu header — no persistent navigation */}
          <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b px-4 py-3 flex items-center justify-between">
            <button className="p-1">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-bold">MyApp</h1>
            <div className="w-6" />
          </div>

          {/* Main content area */}
          <main className="flex-1 overflow-auto">
            <div className="md:p-8 p-4 pt-16 md:pt-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
