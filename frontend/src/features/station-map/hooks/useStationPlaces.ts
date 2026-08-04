import { useCallback, useEffect, useState } from 'react';
import { getPlacesByStation } from '../api/places';
import type { Place, PlaceLoadStatus } from '../types';

export function useStationPlaces(stationName: string) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [status, setStatus] = useState<PlaceLoadStatus>('loading');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPlaces([]);
    setStatus('loading');
    setSelectedPlaceId(null);
    getPlacesByStation(stationName)
      .then((result) => {
        if (!cancelled) {
          setPlaces(result);
          setStatus('success');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [stationName]);

  const selectPlace = useCallback((place: Place) => {
    setSelectedPlaceId(place.id);
  }, []);

  return { places, status, selectedPlaceId, selectPlace };
}
