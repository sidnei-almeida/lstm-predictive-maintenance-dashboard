import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="countach-tiling-manager dashboard-desktop-canvas flex h-dvh min-h-dvh w-full min-w-[1440px] overflow-hidden bg-[#000000]">
      <Sidebar />
      <div className="retro-canvas flex min-w-0 flex-1 flex-col overflow-hidden border-l border-[#222222]">
        <Topbar />
        <main className="min-h-0 flex-1 overflow-auto bg-[#000000]">{children}</main>
      </div>
    </div>
  );
}
