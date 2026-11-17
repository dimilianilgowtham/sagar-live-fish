"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import { createStorageAdapter } from "./store";

const storage = createStorageAdapter(() => window.localStorage);
const CHANGE_EVENT = "sagar-store-change";
function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}
const serverSnapshot = () => null;

export function usePersistentState<T>(
  key: string,
  decode: (raw: string | null) => T,
) {
  const snapshot = useCallback(() => storage.read(key), [key]);
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const value = useMemo(() => decode(raw), [raw, decode]);
  const update = useCallback(
    (next: T | ((current: T) => T)) => {
      const current = decode(snapshot());
      const resolved =
        typeof next === "function"
          ? (next as (current: T) => T)(current)
          : next;
      const serialized = JSON.stringify(resolved);
      const persisted = storage.write(key, serialized);
      window.dispatchEvent(new Event(CHANGE_EVENT));
      return persisted;
    },
    [decode, key, snapshot],
  );
  return [value, update, raw] as const;
}
