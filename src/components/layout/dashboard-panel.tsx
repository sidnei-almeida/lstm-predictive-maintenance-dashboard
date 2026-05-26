import { cn } from "@/lib/utils";

type DashboardPanelProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function DashboardPanel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: DashboardPanelProps) {
  return (
    <section className={cn("retro-panel", className)}>
      <header className="retro-panel-header">
        <div className="min-w-0">
          <h2 className="card-title">{title}</h2>
          {description ? <p className="card-subtitle">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className={cn("retro-panel-body min-h-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}
