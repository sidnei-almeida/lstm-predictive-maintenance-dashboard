"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DashboardPanelTab = {
  id: string;
  label: string;
  panel: ReactNode;
};

export function DashboardPanelTabs({
  tabs,
  ariaLabel,
}: {
  tabs: DashboardPanelTab[];
  ariaLabel: string;
}) {
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? "");

  return (
    <section aria-label={ariaLabel}>
      <div
        className="countach-section-tabs md:hidden"
        role="tablist"
        aria-label={ariaLabel}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeId === tab.id}
            className={cn(
              "countach-section-tab",
              activeId === tab.id && "countach-section-tab--active",
            )}
            onClick={() => setActiveId(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="hidden grid-cols-3 gap-[3px] md:grid">
        {tabs.map((tab) => (
          <div key={tab.id}>{tab.panel}</div>
        ))}
      </div>

      <div className="md:hidden">
        {tabs
          .filter((tab) => tab.id === activeId)
          .map((tab) => (
            <div key={tab.id} role="tabpanel" className="countach-mobile-panel">
              {tab.panel}
            </div>
          ))}
      </div>
    </section>
  );
}
