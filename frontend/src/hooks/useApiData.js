import { useCallback, useContext, useEffect, useRef, useState } from "react";
import api, { errorMessage } from "../api";
import GeneralContext from "../dashboard/GeneralContext";

/**
 * GET `path` and keep it fresh.
 *  - interval: poll every N ms, but only while the tab is visible (and refresh immediately when it becomes visible)
 *  - re-fetches when an order is placed (context refreshKey)
 *  - aborts in-flight requests on unmount/path change, ignores out-of-order responses
 *  - keeps showing the last good data if a refresh fails (error is reported separately)
 *  - no state update (=> no re-render) when polling returns identical data
 */
export default function useApiData(path, { interval = 0, enabled = true } = {}) {
  const { refreshKey } = useContext(GeneralContext);
  const [state, setState] = useState({ data: null, error: null, loading: true, stale: false });
  const lastJson = useRef("");
  const controller = useRef(null);

  const load = useCallback(
    async ({ silent } = {}) => {
      controller.current?.abort();
      const ctrl = new AbortController();
      controller.current = ctrl;
      if (!silent) setState((s) => ({ ...s, loading: s.data === null }));
      try {
        const res = await api.get(path, { signal: ctrl.signal });
        if (ctrl.signal.aborted) return;
        const data = res.data;
        const stale = res.headers?.["x-data-stale"] === "true";
        const json = JSON.stringify(data) + stale;
        if (json === lastJson.current) {
          setState((s) => (s.error || s.loading ? { ...s, error: null, loading: false } : s));
        } else {
          lastJson.current = json;
          setState({ data, error: null, loading: false, stale });
        }
      } catch (err) {
        if (ctrl.signal.aborted || err?.code === "ERR_CANCELED") return;
        setState((s) => ({ ...s, loading: false, error: errorMessage(err) }));
      }
    },
    [path]
  );

  useEffect(() => {
    if (!enabled) return undefined;
    load();
    return () => controller.current?.abort();
  }, [load, enabled, refreshKey]);

  useEffect(() => {
    if (!enabled || !interval) return undefined;
    const tick = () => document.visibilityState === "visible" && load({ silent: true });
    const id = setInterval(tick, interval);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [load, interval, enabled]);

  return { ...state, refresh: () => load(), refreshing: false };
}
