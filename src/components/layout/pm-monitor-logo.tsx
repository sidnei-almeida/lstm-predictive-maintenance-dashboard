import { cn } from "@/lib/utils";

type PmMonitorLogoProps = {
  className?: string;
  title?: string;
};

/** Industrial cog mark — VFD amber, no bezel (parent panel provides the frame). */
export function PmMonitorLogo({ className, title }: PmMonitorLogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("block shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M16 4.5 17.45 8.05 21.2 7.55 19.85 10.95 23.35 12.35 20.55 14.55 22.15 17.85 18.65 18.35 18.15 22 16 19.85 13.85 22 13.35 18.35 9.85 17.85 11.45 14.55 8.65 12.35 12.15 10.95 10.8 7.55 14.55 8.05 16 4.5Z"
        stroke="#ffaa00"
        strokeWidth="1.15"
        strokeLinejoin="miter"
      />
      <circle cx="16" cy="13.25" r="4.25" stroke="#ffaa00" strokeWidth="1.15" />
      <circle cx="16" cy="13.25" r="1.35" fill="#ffaa00" />
    </svg>
  );
}
