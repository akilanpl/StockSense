"use client";

import { useCallback, useEffect, useState } from "react";

type QueryState<T> =
  | { status: "loading"; data: undefined; error: undefined }
  | { status: "error"; data: undefined; error: unknown }
  | { status: "ready"; data: T; error: undefined };

export function useApiQuery<T>(load: () => Promise<T>, queryKey = "") {
  const [attempt, setAttempt] = useState(0);
  const [resolved, setResolved] = useState<{
    requestKey: string;
    state: QueryState<T>;
  }>({
    requestKey: "",
    state: { status: "loading", data: undefined, error: undefined },
  });

  const requestKey = `${queryKey}#${attempt}`;

  const reload = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    let active = true;

    load()
      .then((data) => {
        if (active) {
          setResolved({
            requestKey,
            state: { status: "ready", data, error: undefined },
          });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setResolved({
            requestKey,
            state: { status: "error", data: undefined, error },
          });
        }
      });

    return () => {
      active = false;
    };
  }, [attempt, load, queryKey, requestKey]);

  const pending = resolved.requestKey !== requestKey;
  const state: QueryState<T> = pending
    ? { status: "loading", data: undefined, error: undefined }
    : resolved.state;

  return { ...state, reload };
}
