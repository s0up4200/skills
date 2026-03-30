import { ReactNode } from "react";
import {
  Home,
  Search,
  BookOpen,
  Heart,
  User,
  Settings,
} from "lucide-react";

// NavLink is used only in the desktop sidebar (md+).
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

// NavTab is used only in the mobile bottom tab bar (below md).
// Minimum tap target is 44x44 CSS px (Apple HIG / WCAG 2.5.5 AAA).
// h-14 = 56px satisfies that with comfortable padding.
function NavTab({
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
      className="flex flex-col items-center justify-center flex-1 gap-1 min-h-[44px] text-gray-600 hover:text-gray-900 active:text-gray-900"
    >
      <Icon className="w-6 h-6" />
      <span className="text-[10px] leading-none">{label}</span>
    </a>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/*
          viewport-fit=cover is required for env(safe-area-inset-*) to return
          non-zero values on Face ID iPhones. Without it, safe-area padding is
          silently 0 and content can clip behind the Dynamic Island or home indicator.
          Source: https://webkit.org/blog/7929/designing-websites-for-iphone-x/
        */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body>
        {/*
          min-h-[100dvh] instead of h-[100vh]:
          - 100vh is fixed to the largest possible viewport height on iOS Safari
            and does not shrink when the collapsible toolbar is visible. This
            causes the bottom of the layout to be hidden behind the toolbar.
          - 100dvh tracks the actual visible viewport height dynamically,
            accounting for the collapsible Safari toolbar.
          Source: https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/

          Using min-h instead of h so content can grow taller than the viewport
          on short or zoomed screens.
        */}
        <div className="flex min-h-[100dvh]">
          {/* Desktop sidebar — visible at md breakpoint and above only */}
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
              {/*
                Settings button: increased from ~28px to 44px+ tap target.
                Original had `p-1` on the parent with a w-4/h-4 icon — total
                ~28px, below Apple HIG and WCAG 2.5.5 minimums.
              */}
              <a
                href="/settings"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 min-h-[44px]"
              >
                <Settings className="w-4 h-4" />
                Settings
              </a>
            </div>
          </aside>

          {/*
            Main content area.

            On mobile (below md):
            - pb-[calc(3.5rem+env(safe-area-inset-bottom))] clears the bottom
              tab bar (h-14 = 3.5rem) plus the home indicator safe area so the
              last item of a list is never hidden behind the bar.
            - No top padding needed here because we removed the hamburger header —
              there is no longer a fixed top bar on mobile.

            On desktop (md+):
            - ml-64 shifts content to the right of the sidebar.
            - pb-0 removes the mobile bottom clearance.
          */}
          <main className="flex-1 overflow-auto pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0 md:ml-0">
            <div className="p-4 md:p-8">
              {children}
            </div>
          </main>
        </div>

        {/*
          Mobile bottom tab bar — visible below md breakpoint only.

          Design rationale:
          - Bottom placement puts primary nav in the thumb's natural resting zone.
            Top hamburger menus require an extra tap and context switch; bottom tabs
            are immediately reachable and always visible.
          - 5 items fits the 3–5 rule from Apple HIG (WWDC 2022/10001). Settings
            is moved to the Profile tab area or a sheet rather than a primary tab
            because 5 is the limit; adding a 6th would shrink tap targets below
            usable size.
          - pb-[env(safe-area-inset-bottom)] adds the ~34px home indicator inset on
            Face ID iPhones. Returns 0 on older devices or when viewport-fit=cover
            is absent — both are safe.
          - h-14 (56px) for the icon row comfortably exceeds the 44px minimum.

          WebKit bug 297779 note: in iOS 26 beta, fixed elements can bounce when
          scroll direction changes. If this regresses in production, migrate to
          position: sticky on a flex column shell.
          Source: https://bugs.webkit.org/show_bug.cgi?id=297779
        */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-white
                     pb-[env(safe-area-inset-bottom)]"
          aria-label="Primary navigation"
        >
          <div className="flex items-center h-14">
            <NavTab href="/" icon={Home} label="Home" />
            <NavTab href="/search" icon={Search} label="Search" />
            <NavTab href="/library" icon={BookOpen} label="Library" />
            <NavTab href="/favorites" icon={Heart} label="Favorites" />
            <NavTab href="/profile" icon={User} label="Profile" />
          </div>
        </nav>
      </body>
    </html>
  );
}
