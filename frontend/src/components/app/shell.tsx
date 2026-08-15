import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Gauge,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  ListFilter,
  LogOut,
  Menu,
  SlidersHorizontal,
  Crown,
  Terminal,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { getSession, clearTokens, type Session } from "@/lib/api/authApi";
import { Logo } from "@/components/app/basic";
import { cn, initials } from "@/lib/utils";

export function NavItem({
  href,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: any;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn("nav-item", active && "nav-item-active")}
      data-testid={`link-${label.toLowerCase().replaceAll(" ", "-")}`}
    >
      <Icon size={17} strokeWidth={active ? 2.3 : 1.8} />
      <span>{label}</span>
      {active && <span className="nav-active-dot" />}
    </Link>
  );
}

export function Shell({
  children,
  role,
}: {
  children: ReactNode;
  role: "user" | "admin";
}) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const session = getSession<Session>();
  const userItems = [
    { href: "/app/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/app/api-keys", label: "API keys", icon: KeyRound },
    { href: "/app/usage", label: "Usage & requests", icon: BarChart3 },
    { href: "/app/docs", label: "Documentation", icon: BookOpen },
    { href: "/app/playground", label: "Playground", icon: Terminal },
    { href: "/app/premium", label: "Premium", icon: Crown },
  ];
  const adminItems = [
    { href: "/admin/dashboard", label: "Platform overview", icon: Gauge },
    { href: "/admin/users", label: "Organizations", icon: Users },
    { href: "/admin/api-keys", label: "All API keys", icon: KeyRound },
    { href: "/admin/logs", label: "Activity logs", icon: ListFilter },
    { href: "/admin/plans", label: "Plans & limits", icon: SlidersHorizontal },
    { href: "/admin/premium-requests", label: "Premium requests", icon: Crown },
  ];
  const items = role === "admin" ? adminItems : userItems;
  const title = role === "admin" ? "Operations console" : "Organization workspace";
  return (
    <div className="app-shell">
      <aside className={cn("sidebar", mobileOpen && "sidebar-open")}>
        <div className="sidebar-top">
          <Logo />
          <button
            className="mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            data-testid="button-close-navigation"
          >
            <X size={18} />
          </button>
        </div>
        <div className="sidebar-context">
          <span className="context-pip" />
          {title}
        </div>
        <nav className="sidebar-nav" aria-label={`${role} navigation`}>
          <div className="nav-label">
            {role === "admin" ? "CONTROL ROOM" : "WORKSPACE"}
          </div>
          {items.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={location === item.href}
              onClick={() => setMobileOpen(false)}
            />
          ))}
          {role === "user" && (
            <>
              <div className="nav-label nav-label-spaced">ACCOUNT</div>
              <NavItem
                href="/app/profile"
                icon={UserCog}
                label="Organization profile"
                active={location === "/app/profile"}
                onClick={() => setMobileOpen(false)}
              />
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <Link
            href={role === "user" ? "/app/docs" : "/admin/logs"}
            className="sidebar-help"
            data-testid="link-help"
          >
            <LifeBuoy size={16} />
            <span>Need a hand?</span>
            <ArrowUpRight size={14} />
          </Link>
          <div className="sidebar-profile">
            <div className="avatar avatar-gold">
              {initials(session?.organizationName || session?.adminEmail || "EthioBridge")}
            </div>
            <div className="min-w-0">
              <div className="profile-name truncate">
                {session?.organizationName || session?.adminEmail || "EthioBridge"}
              </div>
              <div className="profile-role">
                {role === "admin"
                  ? "Platform administrator"
                  : "Workspace owner"}
              </div>
            </div>
            <button
              aria-label="Sign out"
              onClick={() => {
                clearTokens();
                setLocation("/login");
              }}
              className="profile-logout"
              data-testid="button-sign-out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
      {mobileOpen && (
        <button
          className="mobile-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          data-testid="button-menu-backdrop"
        />
      )}
      <main className="main-shell">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            data-testid="button-open-navigation"
          >
            <Menu size={20} />
          </button>
          <div className="topbar-crumb">
            <span className="crumb-muted">EthioBridge</span>
            <span>/</span>
            <span>{role === "admin" ? "Operations" : "Workspace"}</span>
          </div>
          <div className="topbar-actions">
            <div className="status-indicator">
              <span />
              All systems operational
            </div>
            <button
              className="icon-button"
              aria-label="Open help"
              data-testid="button-topbar-help"
            >
              <CircleHelpIcon />
            </button>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

export function CircleHelpIcon() {
  return <span className="help-icon">?</span>;
}


