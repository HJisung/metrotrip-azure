import { useEffect, useState } from 'react';
import { getStations, searchStations } from '../../../shared/lib/stations';
import type { Station } from '../../../shared/types/station';

type LoadStatus = 'loading' | 'success' | 'error';

export function useStationList() {
  const [keyword, setKeyword] = useState('');
  const [stations, setStations] = useState<Station[]>([]);
  const [searchResults, setSearchResults] = useState<Station[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [searchStatus, setSearchStatus] = useState<LoadStatus>('success');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    getStations()
      .then((result) => {
        if (!cancelled) {
          setStations(result);
          setStatus('success');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setSearchStatus('loading');
    searchStations(keyword)
      .then((result) => {
        if (!cancelled) {
          setSearchResults(result);
          setSearchStatus('success');
        }
      })
      .catch(() => {
        if (!cancelled) setSearchStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [keyword]);

  return { keyword, setKeyword, stations, searchResults, status, searchStatus };
}
