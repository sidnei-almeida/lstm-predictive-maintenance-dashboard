import { AppShell } from "@/components/layout/app-shell";
import { MaintenanceProvider } from "@/components/providers/maintenance-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <MaintenanceProvider>
      <AppShell>{children}</AppShell>
    </MaintenanceProvider>
  );
}
