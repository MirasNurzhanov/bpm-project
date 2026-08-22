import { useCallback, useEffect, useRef, useState } from 'react';

// Shared loading/error/empty/refresh pattern for every list & detail screen.
// `fetcher` is called with no memoization requirement on the caller's part;
// re-runs whenever an entry in `deps` changes, like useEffect.
export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async ({ isRefresh = false } = {}) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (e) {
      setError(e);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refetch = useCallback(() => run({ isRefresh: false }), [run]);
  const refresh = useCallback(() => run({ isRefresh: true }), [run]);

  return { data, loading, refreshing, error, refetch, refresh };
}
