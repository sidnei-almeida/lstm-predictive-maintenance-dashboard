"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const NAV_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/analytics": "Dataset & Models",
  "/alerts": "Alerts / History",
  "/simulation": "Simulation",
};

/** Raw monospace nav glyphs — Countach digital cluster */
const NAV_GLYPHS: Record<string, string> = {
  "/": "|/|",
  "/analytics": "[+]",
  "/alerts": "!",
  "/simulation": ">_",
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="countach-sidebar">
      <header className="countach-sidebar-brand">
        <span className="countach-sidebar-brand-glyph" aria-hidden>
          ##
        </span>
        <div className="countach-sidebar-brand-text">
          <p className="countach-sidebar-brand-title">PM Monitor</p>
          <p className="countach-sidebar-brand-meta">Predictive</p>
          <p className="countach-sidebar-brand-meta">Maintenance</p>
        </div>
      </header>

      <p className="countach-sidebar-section">Navigation</p>

      <nav className="countach-sidebar-nav" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const label = NAV_LABELS[item.href] ?? item.label;
          const glyph = NAV_GLYPHS[item.href] ?? "+";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "countach-sidebar-link",
                isActive && "countach-sidebar-link--active",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="countach-sidebar-link-glyph-wrap" aria-hidden>
                <span className="countach-sidebar-link-glyph">{glyph}</span>
              </span>
              <span className="countach-sidebar-link-label">{label}</span>
            </Link>
          );
        })}
      </nav>

      <footer className="countach-sidebar-footer">
        <span className="countach-sidebar-footer-logo" aria-hidden>
          N
        </span>
        <span className="countach-sidebar-footer-text">Casual Room v2.1</span>
      </footer>
    </aside>
  );
}
