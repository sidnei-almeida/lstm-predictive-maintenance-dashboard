"use client";

import { cn } from "@/lib/utils";

const HERO_IMAGE = "/images/lamborghini.png";
const HERO_LOGO = "/images/lambologo.png";

export type SectionHeroStatusVariant = "live" | "paused" | "idle" | "static";

export type SectionHeroProps = {
  title: string;
  subtitle: string;
  statusLabel: string;
  statusVariant?: SectionHeroStatusVariant;
  "aria-label"?: string;
};

export function SectionHero({
  title,
  subtitle,
  statusLabel,
  statusVariant = "static",
  "aria-label": ariaLabel = "Section hero",
}: SectionHeroProps) {
  return (
    <section
      className="countach-dashboard-hero relative w-full shrink-0 overflow-hidden rounded-none border border-[#333333] bg-black"
      aria-label={ariaLabel}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={HERO_IMAGE}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        decoding="async"
        fetchPriority="high"
      />

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/65"
        aria-hidden
      />

      <div className="absolute inset-0 z-10 flex items-center p-3 pr-24 pl-3 sm:pr-28 sm:pl-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_LOGO}
            alt="Lamborghini"
            className="countach-dashboard-hero__logo h-16 w-auto shrink-0 object-contain object-left sm:h-20 lg:h-28"
            decoding="async"
          />
          <div className="min-w-0">
            <h1 className="countach-dashboard-hero__title">{title}</h1>
            <p className="countach-dashboard-hero__subtitle">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="absolute top-2 right-2 z-20">
        <div
          className={cn(
            "countach-dashboard-hero__status inline-flex items-center gap-2 border border-[#ffaa00] bg-black/70 px-3 py-1.5",
            statusVariant === "live" && "countach-dashboard-hero__status--live",
            statusVariant === "paused" && "countach-dashboard-hero__status--paused",
            statusVariant === "idle" && "countach-dashboard-hero__status--idle",
            statusVariant === "static" && "countach-dashboard-hero__status--static",
          )}
          role="status"
          aria-label={statusLabel}
        >
          <span className="countach-dashboard-hero__led size-1.5 shrink-0 rounded-none" aria-hidden />
          <span className="font-mono text-[9px] font-bold tracking-[0.24em] text-[#ffaa00] uppercase">
            {statusLabel}
          </span>
        </div>
      </div>
    </section>
  );
}
