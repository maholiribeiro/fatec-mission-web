import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Carrega dados assíncronos com estados de loading/erro e função de recarregar.
 * Ignora respostas de requisições antigas (evita "piscar" dados ao trocar filtros).
 */
export function useFetch(fn, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const req = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const executar = useCallback(fn, deps);

  const reload = useCallback(async () => {
    const id = ++req.current;
    setLoading(true);
    setError(null);
    try {
      const r = await executar();
      if (id === req.current) setData(r);
    } catch (e) {
      if (id === req.current) setError(e);
    } finally {
      if (id === req.current) setLoading(false);
    }
  }, [executar]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}
