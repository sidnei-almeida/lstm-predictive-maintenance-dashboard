import { AlertsHistoryView } from "@/components/alerts/alerts-history-view";
import { AlertsPageShell } from "@/components/alerts/alerts-page-shell";

export default function AlertsPage() {
  return (
    <AlertsPageShell>
      <AlertsHistoryView />
    </AlertsPageShell>
  );
}
