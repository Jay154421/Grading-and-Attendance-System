import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiLogOut, FiX } from "react-icons/fi";

const COLLAPSED_KEY = "sidebar-collapsed";

function itemClass(isActive, collapsed) {
  const base =
    "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";
  const layout = collapsed ? "justify-center px-2" : "";
  const color = isActive
    ? "bg-brand/10 text-brand"
    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900";
  return `${base} ${layout} ${color}`;
}

function NavItem({ item, collapsed, onNavigate }) {
  const { to, label, icon: Icon } = item;
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) => itemClass(isActive, collapsed)}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

function Brand({ portal, username, collapsed }) {
  return (
    <div className={collapsed ? "flex justify-center px-2 py-4" : "px-4 py-4"}>
      <img
        src={collapsed ? "/logo-mark.png" : "/logo-wordmark.png"}
        alt="EduCheck"
        width={collapsed ? 132 : 378}
        height={collapsed ? 94 : 96}
        className={collapsed ? "w-11 object-contain" : "h-8 object-contain"}
      />
      {!collapsed && (
        <div className="mt-3 min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {portal} Portal
          </p>
          <p className="truncate text-xs text-gray-500">
            Welcome, {username}
          </p>
        </div>
      )}
    </div>
  );
}

function LogoutButton({ onLogout, collapsed, className = "" }) {
  return (
    <button
      onClick={onLogout}
      title={collapsed ? "Logout" : undefined}
      className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
        collapsed ? "justify-center px-2" : ""
      } ${className}`}
      type="button"
    >
      <FiLogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
      {!collapsed && <span>Logout</span>}
    </button>
  );
}

export default function Sidebar({
  portal,
  username,
  items,
  mobileOpen,
  onCloseMobile,
  onLogout,
}) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, String(collapsed));
    } catch {
      /* storage unavailable */
    }
  }, [collapsed]);

  const drawerRef = useRef(null);
  const onCloseRef = useRef(onCloseMobile);

  useEffect(() => {
    onCloseRef.current = onCloseMobile;
  });

  useEffect(() => {
    if (!mobileOpen) return;

    const restoreTo = document.activeElement;
    const drawer = drawerRef.current;
    const focusables = () =>
      Array.from(
        drawer?.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((el) => el.offsetParent !== null);

    focusables()[0]?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !drawer) return;

      const nodes = focusables();
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (!drawer.contains(active) || active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (!drawer.contains(active) || active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (restoreTo instanceof HTMLElement && document.contains(restoreTo)) {
        restoreTo.focus();
      }
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden shrink-0 flex-col border-r border-gray-200 bg-white transition-[width] duration-200 md:flex ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="border-b border-gray-200">
          <Brand portal={portal} username={username} collapsed={collapsed} />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label={`${portal} navigation`}>
          {items.map((item) => (
            <NavItem key={item.to} item={item} collapsed={collapsed} />
          ))}
        </nav>

        <div className="space-y-1 border-t border-gray-200 p-3">
          <LogoutButton onLogout={onLogout} collapsed={collapsed} />
          <button
            onClick={() => setCollapsed((value) => !value)}
            className="hidden min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 md:flex md:justify-center"
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <FiChevronRight className="h-5 w-5" aria-hidden="true" />
            ) : (
              <>
                <FiChevronLeft className="h-5 w-5" aria-hidden="true" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="animate-fade-in absolute inset-0 bg-gray-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            className="animate-drawer-in absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label={`${portal} navigation`}
          >
            <div className="flex items-center border-b border-gray-200">
              <div className="min-w-0 flex-1">
                <Brand portal={portal} username={username} collapsed={false} />
              </div>
              <button
                onClick={onCloseMobile}
                aria-label="Close menu"
                type="button"
                className="mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <FiX className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label={`${portal} navigation`}>
              {items.map((item) => (
                <NavItem
                  key={item.to}
                  item={item}
                  collapsed={false}
                  onNavigate={onCloseMobile}
                />
              ))}
            </nav>

            <div className="border-t border-gray-200 p-3">
              <LogoutButton onLogout={onLogout} collapsed={false} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
