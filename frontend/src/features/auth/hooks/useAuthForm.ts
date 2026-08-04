import { useState } from 'react';

export function useAuthForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function run<T>(action: () => Promise<T>) {
    setLoading(true);
    setError('');
    try {
      return await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '요청을 처리하지 못했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, setError, run };
}
