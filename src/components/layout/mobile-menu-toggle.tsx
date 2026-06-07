"use client";

import { cn } from "@/lib/utils";

type MobileMenuToggleProps = {
  expanded: boolean;
  onClick: () => void;
};

export function MobileMenuToggle({ expanded, onClick }: MobileMenuToggleProps) {
  return (
    <button
      type="button"
      className={cn(
        "countach-mobile-menu-toggle",
        expanded && "countach-mobile-menu-toggle--expanded",
      )}
      aria-label={expanded ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={expanded}
      aria-controls="countach-mobile-drawer"
      onClick={onClick}
    >
      <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden>
        <line
          className="countach-mobile-menu-toggle__line countach-mobile-menu-toggle__line--top"
          x1="0"
          y1="1"
          x2="18"
          y2="1"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          className="countach-mobile-menu-toggle__line countach-mobile-menu-toggle__line--mid"
          x1="0"
          y1="7"
          x2="14"
          y2="7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          className="countach-mobile-menu-toggle__line countach-mobile-menu-toggle__line--bot"
          x1="0"
          y1="13"
          x2="18"
          y2="13"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
