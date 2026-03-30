import { ReactNode, useState } from "react";
import {
  Home,
  Search,
  BookOpen,
  Heart,
  User,
  Settings,
  Menu,
  X,
} from "lucide-react";

function NavLink({
  href,
  icon: Icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 min-h-[44px]"
    >
      <Icon className="w-5 h-5 shrink-0" />
      {children}
    </a>
  );
}

function BottomNavItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <a
      href={href}
      className="flex flex-col items-center justify-center gap-1 flex-1 py-2 text-gray-600 hover:text-gray-900 min-h-[44px]"
    >
      <Icon className="w-5 h-5" />
      <span className="text-xs">{label}</span>
    </a>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body>
        {/* Use min-h-svh (small viewport height) for iOS Safari toolbar-aware height.
            Falls back to 100dvh, then 100vh for older browsers. */}
        <div className="flex min-h-[100dvh] md:h-screen">
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
              <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 min-h-[44px] px-2">
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </aside>

          {/* Mobile: top header bar */}
          <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b px-4 flex items-center justify-between"
               style={{ paddingTop: "env(safe-area-inset-top)", minHeight: "calc(44px + env(safe-area-inset-top))" }}>
            <button
              className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-bold">MyApp</h1>
            {/* Spacer to balance the menu button */}
            <div className="w-10" />
          </div>

          {/* Mobile: slide-in drawer */}
          {drawerOpen && (
            <>
              {/* Backdrop */}
              <div
                className="md:hidden fixed inset-0 z-40 bg-black/40"
                onClick={() => setDrawerOpen(false)}
                aria-hidden="true"
              />
              {/* Drawer panel */}
              <div
                className="md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white flex flex-col shadow-xl"
                style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <h1 className="text-xl font-bold">MyApp</h1>
                  <button
                    className="p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Close menu"
                    onClick={() => setDrawerOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
                  <NavLink href="/" icon={Home} onClick={() => setDrawerOpen(false)}>Home</NavLink>
                  <NavLink href="/search" icon={Search} onClick={() => setDrawerOpen(false)}>Search</NavLink>
                  <NavLink href="/library" icon={BookOpen} onClick={() => setDrawerOpen(false)}>Library</NavLink>
                  <NavLink href="/favorites" icon={Heart} onClick={() => setDrawerOpen(false)}>Favorites</NavLink>
                  <NavLink href="/profile" icon={User} onClick={() => setDrawerOpen(false)}>Profile</NavLink>
                </nav>
                <div className="p-4 border-t">
                  <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 min-h-[44px] px-2">
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Main content area */}
          <main className="flex-1 overflow-auto">
            {/* Top padding accounts for fixed header on mobile; bottom padding accounts for bottom nav bar + safe area */}
            <div
              className="p-4 md:p-8"
              style={{
                paddingTop: "calc(env(safe-area-inset-top) + 44px + 1rem)",
                paddingBottom: "calc(env(safe-area-inset-bottom) + 56px + 1rem)",
              }}
            >
              <div className="md:[padding-top:2rem] md:[padding-bottom:2rem]">
                {children}
              </div>
            </div>
          </main>

          {/* Mobile: persistent bottom navigation bar (replaces hamburger-only pattern) */}
          <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t flex"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            aria-label="Main navigation"
          >
            <BottomNavItem href="/" icon={Home} label="Home" />
            <BottomNavItem href="/search" icon={Search} label="Search" />
            <BottomNavItem href="/library" icon={BookOpen} label="Library" />
            <BottomNavItem href="/favorites" icon={Heart} label="Favorites" />
            <BottomNavItem href="/profile" icon={User} label="Profile" />
          </nav>
        </div>
      </body>
    </html>
  );
}
