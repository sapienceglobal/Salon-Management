'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

/**
 * Custom hook for API calls with loading, error, and data state.
 * @param {string} url - API endpoint
 * @param {object} options - { immediate: true/false }
 */
export function useApi(url, options = { immediate: true }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(url, { params });
      setData(res.data);
      return res;
    } catch (err) {
      setError(err.message || 'Something went wrong');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (options.immediate) fetchData();
  }, [fetchData, options.immediate]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Custom hook for API mutations (POST, PUT, DELETE).
 */
export function useMutation(method = 'post') {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (url, data = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api[method](url, data);
      return res;
    } catch (err) {
      setError(err.message || 'Something went wrong');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}
