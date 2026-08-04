import { useEffect, useState } from 'react';
import { getStations } from '../../../shared/lib/stations';
import type { Station } from '../../../shared/types/station';

export function useLineMapStations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getStations()
      .then((result) => {
        if (!cancelled) setStations(result);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { stations, loadError };
}
