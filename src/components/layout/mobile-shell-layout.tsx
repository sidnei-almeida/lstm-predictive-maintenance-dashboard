"use client";

import { useState } from "react";

import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function MobileShellLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div className="countach-tiling-manager dashboard-shell flex h-dvh min-h-dvh w-full overflow-hidden bg-[#000000]">
        <Sidebar />
        <div className="retro-canvas flex min-w-0 flex-1 flex-col overflow-hidden border-l border-[#222222]">
          <Topbar onMenuOpen={() => setDrawerOpen(true)} />
          <main className="dashboard-main min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-[#000000]">
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
