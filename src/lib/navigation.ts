import {
  BarChart3,
  Bell,
  LayoutDashboard,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Dataset & Model Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Alerts / History", href: "/alerts", icon: Bell },
  { label: "Simulation Control Center", href: "/simulation", icon: SlidersHorizontal },
];

export const APP_TITLE = "Real-Time Predictive Maintenance Monitor";
export const APP_SUBTITLE =
  "Historical CSV replayed as a simulated IoT machine stream";

export const ANALYTICS_TITLE = "Dataset & Model Analytics";
export const ANALYTICS_SUBTITLE =
  "AI4I data profile · LSTM sequence · failure-risk analysis";

export const ALERTS_TITLE = "Prediction History & Failure Review";
export const ALERTS_SUBTITLE =
  "Model predictions · ground-truth failures · replay event audit";

/** Routes that render SectionHero inside page content (no cream title strip in topbar) */
export const ROUTES_WITH_SECTION_HERO = ["/", "/analytics", "/alerts"] as const;

export const CONTEXT_LABELS = [
  "Historical CSV",
  "Dataset Replay",
  "LSTM Sequence Inference",
] as const;
