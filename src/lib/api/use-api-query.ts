"use client";

import { useCallback, useEffect, useState } from "react";

type QueryState<T> =
  | { status: "loading"; data: undefined; error: undefined }
  | { status: "error"; data: undefined; error: unknown }
  | { status: "ready"; data: T; error: undefined };

export function useApiQuery<T>(load: () => Promise<T>, queryKey = "") {
  const [state, setState] = useState<QueryState<T>>({
    status: "loading",
    data: undefined,
    error: undefined,
  });
  const [attempt, setAttempt] = useState(0);

  const reload = useCallback(() => {
    setState({ status: "loading", data: undefined, error: undefined });
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    let active = true;

    load()
      .then((data) => {
        if (active) {
          setState({ status: "ready", data, error: undefined });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState({ status: "error", data: undefined, error });
        }
      });

    return () => {
      active = false;
    };
  }, [attempt, load, queryKey]);

  return { ...state, reload };
}
