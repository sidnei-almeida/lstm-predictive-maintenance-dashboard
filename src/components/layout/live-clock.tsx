"use client";

import { useEffect, useState } from "react";

export function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const immediate = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(immediate);
      window.clearInterval(id);
    };
  }, []);

  if (!now) {
    return (
      <span className={className ?? "font-mono text-xs tabular-nums text-muted-foreground"}>
        —:—:—
      </span>
    );
  }

  return (
    <time
      className={className ?? "font-mono text-xs tabular-nums text-muted-foreground"}
      dateTime={now.toISOString()}
    >
      {now
        .toLocaleString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          month: "short",
          day: "2-digit",
          hour12: false,
        })
        .toUpperCase()}
    </time>
  );
}
