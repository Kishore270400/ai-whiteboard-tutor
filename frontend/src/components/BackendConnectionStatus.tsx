"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { checkBackendHealth } from "@/services/api";

export type ConnectionState = "checking" | "connected" | "disconnected";

const POLL_INTERVAL_MS = 15_000;

type BackendConnectionStatusProps = {
  onStatusChange?: (status: ConnectionState) => void;
};

export default function BackendConnectionStatus({
  onStatusChange,
}: BackendConnectionStatusProps) {
  const [mounted, setMounted] = useState(false);
  const [connection, setConnection] = useState<ConnectionState>("checking");
  const [detail, setDetail] = useState<string>("Checking connection…");
  const inFlightRef = useRef(false);
  const onStatusChangeRef = useRef(onStatusChange);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  const applyResult = useCallback((next: ConnectionState, message: string) => {
    setConnection(next);
    setDetail(message);
    onStatusChangeRef.current?.(next);
  }, []);

  const runHealthCheck = useCallback(
    async (options?: { showChecking?: boolean }) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      if (options?.showChecking) {
        applyResult("checking", "Checking connection…");
      }

      try {
        const result = await checkBackendHealth();
        if (result.ok) {
          applyResult(
            "connected",
            `${result.data.application} v${result.data.version}`,
          );
        } else {
          applyResult("disconnected", result.message);
        }
      } finally {
        inFlightRef.current = false;
      }
    },
    [applyResult],
  );

  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;

    const safeCheck = async (showChecking: boolean) => {
      if (cancelled || inFlightRef.current) return;
      inFlightRef.current = true;
      if (showChecking) {
        applyResult("checking", "Checking connection…");
      }

      try {
        const result = await checkBackendHealth();
        if (cancelled) return;
        if (result.ok) {
          applyResult(
            "connected",
            `${result.data.application} v${result.data.version}`,
          );
        } else {
          applyResult("disconnected", result.message);
        }
      } finally {
        if (!cancelled) inFlightRef.current = false;
      }
    };

    void safeCheck(true);

    const intervalId = window.setInterval(() => {
      void safeCheck(false);
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [applyResult, mounted]);

  if (!mounted) {
    return (
      <div
        className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs text-amber-800 shadow-sm ring-1 ring-amber-200"
        role="status"
        aria-live="polite"
      >
        <Loader2 size={14} className="shrink-0 animate-spin text-amber-600" aria-hidden />
        <span className="font-medium">Checking connection</span>
      </div>
    );
  }

  const styles =
    connection === "connected"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : connection === "disconnected"
        ? "bg-rose-50 text-rose-800 ring-rose-200"
        : "bg-amber-50 text-amber-800 ring-amber-200";

  return (
    <div
      className={`inline-flex max-w-full flex-wrap items-center gap-2 rounded-full px-3 py-2 text-xs shadow-sm ring-1 ${styles}`}
      role="status"
      aria-live="polite"
    >
      {connection === "connected" ? (
        <Wifi size={14} className="shrink-0 text-emerald-600" aria-hidden />
      ) : connection === "disconnected" ? (
        <WifiOff size={14} className="shrink-0 text-rose-600" aria-hidden />
      ) : (
        <Loader2 size={14} className="shrink-0 animate-spin text-amber-600" aria-hidden />
      )}

      <span className="font-medium">
        {connection === "connected"
          ? "Backend Connected"
          : connection === "disconnected"
            ? "Backend Disconnected"
            : "Checking connection"}
      </span>

      {connection === "connected" && (
        <CheckCircle2 size={13} className="shrink-0 text-emerald-600" aria-hidden />
      )}

      <span className="hidden text-[11px] opacity-80 sm:inline sm:max-w-[18rem] sm:truncate">
        {detail}
      </span>

      {connection === "disconnected" && (
        <button
          type="button"
          onClick={() => void runHealthCheck({ showChecking: true })}
          className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-white"
        >
          <RefreshCw size={12} aria-hidden />
          Retry Connection
        </button>
      )}
    </div>
  );
}
