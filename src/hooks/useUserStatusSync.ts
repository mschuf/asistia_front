import { useCallback, useEffect, useRef, useState } from "react";
import {
  getUserStatusSyncStatus,
  USER_STATUS_SOURCES,
  type RunningSync,
  type UserStatusSource,
} from "@/api/userStatus";

const POLL_MS_ACTIVE = 2_000;

function sameRunning(left: RunningSync[], right: RunningSync[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((item, index) => item.source === right[index]?.source && item.startedAt === right[index]?.startedAt);
}

function tabIsVisible(): boolean {
  return typeof document === "undefined" || document.visibilityState === "visible";
}

/**
 * Consulta el estado de sincronización al entrar y solo hace polling mientras hay fuentes en curso.
 * @param onFinished - Fuentes que pasaron de "en curso" a detenidas.
 */
export function useUserStatusSync(onFinished: (sources: UserStatusSource[]) => void) {
  const [running, setRunning] = useState<RunningSync[]>([]);
  const previous = useRef<UserStatusSource[]>([]);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  const refresh = useCallback(async () => {
    const status = await getUserStatusSyncStatus();
    setRunning((current) => sameRunning(current, status.running) ? current : status.running);
    return status.running;
  }, []);

  const mergeRunning = useCallback((sources: UserStatusSource[]) => {
    if (sources.length === 0) return;
    const startedAt = new Date().toISOString();
    setRunning((current) => {
      const bySource = new Map(current.map((item) => [item.source, item]));
      for (const source of sources) {
        if (!bySource.has(source)) bySource.set(source, { source, startedAt });
      }
      return USER_STATUS_SOURCES.flatMap((source) => {
        const item = bySource.get(source);
        return item ? [item] : [];
      });
    });
  }, []);

  useEffect(() => {
    const current = running.map((item) => item.source);
    const finished = previous.current.filter((source) => !current.includes(source));
    previous.current = current;
    if (finished.length > 0) onFinishedRef.current(finished);
  }, [running]);

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (!tabIsVisible()) return;
      void refresh().catch(() => {
        if (cancelled) return;
      });
    };
    tick();
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    const id = running.length > 0 ? window.setInterval(tick, POLL_MS_ACTIVE) : 0;
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      if (id) window.clearInterval(id);
    };
  }, [refresh, running.length]);

  return { running, refresh, mergeRunning };
}
