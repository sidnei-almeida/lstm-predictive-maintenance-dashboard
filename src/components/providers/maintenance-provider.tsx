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

  const [showOverlay, setShowOverlay] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    void startBoot();
  }, [startBoot]);

  const autoStarted = useRef(false);

  // Kick the replay off on its own once boot lands — no visitor click required.
  useEffect(() => {
    if (!bootReady || autoStarted.current) return;
    autoStarted.current = true;
    startStream();
  }, [bootReady, startStream]);

  useEffect(() => {
    if (bootReady) {
      setFadeOut(true);
      const timer = setTimeout(() => {
        setShowOverlay(false);
      }, 520);
      return () => clearTimeout(timer);
    }
    setShowOverlay(true);
    setFadeOut(false);
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
