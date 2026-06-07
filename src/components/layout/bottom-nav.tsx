"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const MOBILE_LABELS: Record<string, string> = {
  "/": "Home",
  "/analytics": "Models",
  "/alerts": "Alerts",
  "/simulation": "Sim",
};

const MOBILE_GLYPHS: Record<string, string> = {
  "/": "|/|",
  "/analytics": "[+]",
  "/alerts": "!",
  "/simulation": ">_",
};

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="countach-bottom-nav"
      aria-label="Mobile navigation"
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const label = MOBILE_LABELS[item.href] ?? item.label;
        const glyph = MOBILE_GLYPHS[item.href] ?? "+";

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn("countach-bottom-nav__item", isActive && "countach-bottom-nav__item--active")}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="countach-bottom-nav__glyph" aria-hidden>
              {glyph}
            </span>
            <span className="countach-bottom-nav__label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
