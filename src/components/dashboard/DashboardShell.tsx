"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { Logo } from "@/components/ui/Logo";

type NavItem = { href: string; label: string; icon: string };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: "🛰️" },
  { href: "/dashboard/upload", label: "Upload Center", icon: "📤" },
  { href: "/dashboard/documents", label: "Documents", icon: "🗂️" },
  { href: "/dashboard/imaging", label: "AI Imaging Lab", icon: "🧠" },
  { href: "/dashboard/copilot", label: "AI Copilot", icon: "💬" },
  { href: "/dashboard/timeline", label: "Health Timeline", icon: "📈" },
  { href: "/dashboard/reports", label: "Medical Report Card", icon: "📋" },
  { href: "/dashboard/profile", label: "Profile", icon: "👤" },
];

export function DashboardShell({
  children,
  user,
}: {
  children: ReactNode;
  user: { name: string; email: string; avatarColor: string };
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-mesh">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={clsx(
          "fixed z-40 flex h-screen flex-col border-r border-white/10 bg-navy-900/80 backdrop-blur-xl transition-all duration-300 lg:sticky lg:top-0",
          collapsed ? "w-[76px]" : "w-[250px]",
          mobileOpen ? "left-0" : "-left-full lg:left-0",
        )}
      >
        <div className="flex items-center justify-between px-4 py-5">
          {!collapsed && <Logo />}
          {collapsed && <Logo iconOnly />}
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "glass-strong text-white glow-cyan"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                )}
                title={collapsed ? item.label : undefined}
              >
                <span className="text-lg">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="mb-2 hidden w-full items-center justify-center rounded-xl border border-white/10 py-2 text-xs text-slate-400 hover:bg-white/5 lg:flex"
          >
            {collapsed ? "»" : "« Collapse"}
          </button>
          <div className={clsx("flex items-center gap-3 rounded-xl px-2 py-2", !collapsed && "glass")}>
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-navy-950"
              style={{ backgroundColor: user.avatarColor }}
            >
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">{user.name}</p>
                <p className="truncate text-[10px] text-slate-400">{user.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={clsx(
              "mt-2 w-full rounded-xl border border-rose-400/20 bg-rose-400/10 py-2 text-xs font-medium text-rose-300 hover:bg-rose-400/20",
            )}
          >
            {collapsed ? "⎋" : "Sign out"}
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/5 bg-navy-950/70 px-5 py-4 backdrop-blur-xl">
          <button
            className="rounded-lg border border-white/10 p-2 text-slate-300 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            ☰
          </button>
          <div className="hidden text-sm text-slate-400 lg:block">
            {NAV.find((n) => n.href === pathname)?.label ?? "Dashboard"}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-300 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-glow" /> Live
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
