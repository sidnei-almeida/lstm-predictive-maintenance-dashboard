"use client";

import { useEffect, useRef, useState } from "react";

import { ApiColdStartOverlay } from "@/components/layout/api-cold-start-overlay";
import { useMaintenanceStore } from "@/store/maintenance-store";

export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const bootReady = useMaintenanceStore((s) => s.bootReady);
  const bootPhase = useMaintenanceStore((s) => s.bootPhase);
  const bootError = useMaintenanceStore((s) => s.bootError);
  const startBoot = useMaintenanceStore((s) => s.startBoot);
  const startStream = useMaintenanceStore((s) => s.startStream);

  const autoStarted = useRef(false);
  const [overlayDismissed, setOverlayDismissed] = useState(false);

  // The overlay fades the moment boot lands, then unmounts once the CSS
  // transition has run. Both are derived from bootReady so a boot that drops
  // back to not-ready (a retry, a fault) puts the overlay back on screen.
  const fadeOut = bootReady;
  const showOverlay = !bootReady || !overlayDismissed;

  useEffect(() => {
    void startBoot();
  }, [startBoot]);

  // Kick the replay off on its own once boot lands — no visitor click required.
  useEffect(() => {
    if (!bootReady || autoStarted.current) return;
    autoStarted.current = true;
    startStream();
  }, [bootReady, startStream]);

  useEffect(() => {
    if (!bootReady) return;
    const timer = setTimeout(() => {
      setOverlayDismissed(true);
    }, 520);
    return () => clearTimeout(timer);
  }, [bootReady]);

  return (
    <>
      {bootReady ? children : null}
      {showOverlay ? (
        <ApiColdStartOverlay
          bootPhase={bootPhase}
          bootError={bootError}
          fadeOut={fadeOut}
        />
      ) : null}
    </>
  );
}
