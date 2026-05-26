"use client";

import { cn } from "@/lib/utils";

function MathNode({ symbol }: { symbol: string }) {
  return (
    <div className="flex h-9 min-w-9 shrink-0 items-center justify-center border border-[#ffaa00] bg-black px-1 font-mono text-[9px] font-bold leading-none tracking-tight text-[#ffaa00]">
      [{symbol}]
    </div>
  );
}

function WireH({ className }: { className?: string }) {
  return <div className={cn("h-px shrink-0 border-t border-[#ffaa00]", className)} />;
}

function WireV({ className }: { className?: string }) {
  return <div className={cn("w-px shrink-0 border-l border-[#ffaa00]", className)} />;
}

function PathLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono text-[8px] font-medium tracking-wide text-[#888888] uppercase",
        className,
      )}
    >
      {children}
    </span>
  );
}

function GateLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center border-r border-[#ffaa00]/30 px-1.5 py-2 font-mono text-[8px] font-bold leading-tight tracking-[0.12em] text-[#ffaa00] uppercase">
      {children}
    </div>
  );
}

function ForgetGateRow() {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[4.25rem_1fr]">
      <GateLabel>
        Forget
        <br />
        Gate
      </GateLabel>
      <div className="flex items-center px-3 py-3">
        <div className="flex w-full items-center">
          <div className="relative mr-1 flex h-10 w-8 flex-col items-center justify-between">
            <WireH className="absolute top-1/2 left-0 w-full -translate-y-1/2" />
            <WireV className="h-4" />
            <WireV className="h-4" />
          </div>
          <WireH className="w-2" />
          <MathNode symbol="σ" />
          <WireH className="w-4" />
          <MathNode symbol="×" />
          <div className="ml-1 flex flex-col items-center">
            <WireV className="h-4" />
            <PathLabel>C_t-1</PathLabel>
            <span className="font-mono text-[7px] text-[#666666]">(Cell)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputGateRow() {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[4.25rem_1fr]">
      <GateLabel>
        Input
        <br />
        Gate
      </GateLabel>
      <div className="flex items-center px-3 py-3">
        <div className="flex w-full items-center gap-0">
          <div className="flex flex-col gap-4">
            <div className="flex items-center">
              <WireH className="w-3" />
              <MathNode symbol="σ" />
              <WireH className="w-3" />
              <MathNode symbol="×" />
            </div>
            <div className="flex items-center">
              <WireH className="w-3" />
              <MathNode symbol="tanh" />
              <WireH className="w-3" />
              <MathNode symbol="×" />
            </div>
          </div>
          <div className="mx-1 flex h-[4.5rem] flex-col items-center justify-center">
            <WireV className="h-full" />
          </div>
          <div className="flex items-center">
            <WireH className="w-2" />
            <MathNode symbol="+" />
            <WireH className="w-4" />
            <div className="flex flex-col">
              <PathLabel>C_t</PathLabel>
              <span className="font-mono text-[7px] text-[#666666]">(Cell)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OutputGateRow() {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[4.25rem_1fr]">
      <GateLabel>
        Output
        <br />
        Gate
      </GateLabel>
      <div className="flex items-center px-3 py-3">
        <div className="flex w-full items-center">
          <div className="flex flex-col items-center">
            <PathLabel>C_t</PathLabel>
            <WireV className="my-0.5 h-3" />
            <MathNode symbol="tanh" />
          </div>
          <WireH className="w-4" />
          <div className="flex flex-col items-center gap-3">
            <WireH className="w-6" />
            <div className="flex items-center">
              <WireH className="w-2" />
              <MathNode symbol="σ" />
            </div>
          </div>
          <WireH className="w-3" />
          <MathNode symbol="×" />
          <WireH className="w-4" />
          <div className="flex flex-col">
            <PathLabel>h_t</PathLabel>
            <span className="font-mono text-[7px] text-[#666666]">(Hidden)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LstmCellSchematic({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex h-full min-h-0 flex-col bg-black", className)}
      role="img"
      aria-label="LSTM cell schematic: forget, input, and output gates"
    >
      <div className="grid shrink-0 grid-cols-[5.75rem_1fr] border-b border-[#222222]">
        <div className="flex flex-col justify-center gap-5 border-r border-[#ffaa00]/20 px-3 py-3">
          <PathLabel>X_t (Input)</PathLabel>
          <PathLabel>h_t-1 (Hidden)</PathLabel>
        </div>
        <div className="flex items-center px-3 py-3">
          <WireH className="w-5" />
          <span className="shrink-0 px-2 font-mono text-[7px] tracking-[0.14em] text-[#666666] uppercase">
            [ h_t-1 ; X_t ]
          </span>
          <WireH className="min-w-4 flex-1" />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-3 divide-y divide-[#222222]">
        <ForgetGateRow />
        <InputGateRow />
        <OutputGateRow />
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-[#222222] px-3 py-2">
        <PathLabel>C_t (Cell State)</PathLabel>
        <PathLabel className="block text-right">h_t (Hidden Out)</PathLabel>
      </div>
    </div>
  );
}
