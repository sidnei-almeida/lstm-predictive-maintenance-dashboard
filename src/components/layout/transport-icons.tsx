import type { SVGProps } from "react";

type GlyphProps = SVGProps<SVGSVGElement>;

const BASE_PROPS = {
  viewBox: "0 0 12 12",
  width: 12,
  height: 12,
  focusable: "false" as const,
  "aria-hidden": true,
};

export function PlayGlyph(props: GlyphProps) {
  return (
    <svg {...BASE_PROPS} {...props} fill="currentColor">
      <path d="M2.6 1.3 10.3 6 2.6 10.7Z" />
    </svg>
  );
}

export function PauseGlyph(props: GlyphProps) {
  return (
    <svg {...BASE_PROPS} {...props} fill="currentColor">
      <rect x="2.4" y="1.4" width="2.8" height="9.2" />
      <rect x="6.8" y="1.4" width="2.8" height="9.2" />
    </svg>
  );
}

export function StopGlyph(props: GlyphProps) {
  return (
    <svg {...BASE_PROPS} {...props} fill="currentColor">
      <rect x="1.9" y="1.9" width="8.2" height="8.2" />
    </svg>
  );
}

export function AlertGlyph(props: GlyphProps) {
  return (
    <svg
      {...BASE_PROPS}
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d="M6 1.1 11.4 10.6H0.6Z" />
      <path d="M6 4.6V7.4" />
      <path d="M6 9.1V9.2" />
    </svg>
  );
}
