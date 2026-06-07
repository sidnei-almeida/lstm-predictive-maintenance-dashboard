import { MobileShellLayout } from "./mobile-shell-layout";

export function AppShell({ children }: { children: React.ReactNode }) {
  return <MobileShellLayout>{children}</MobileShellLayout>;
}
