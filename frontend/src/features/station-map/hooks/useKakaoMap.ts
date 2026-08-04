import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_LEVEL = 3;
const MIN_LEVEL = 1;
const MAX_LEVEL = 5;

type UseKakaoMapOptions = {
  lat: number;
  lng: number;
};

export function useKakaoMap({ lat, lng }: UseKakaoMapOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const initialCenterRef = useRef({ lat, lng });
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!window.kakao?.maps) {
      setError('카카오맵 SDK를 불러오지 못했습니다. .env의 VITE_KAKAO_MAP_KEY를 확인해 주세요.');
      return;
    }

    window.kakao.maps.load(() => {
      const map = new window.kakao.maps.Map(container, {
        center: new window.kakao.maps.LatLng(
          initialCenterRef.current.lat,
          initialCenterRef.current.lng,
        ),
        level: DEFAULT_LEVEL,
      });
      map.setMinLevel(MIN_LEVEL);
      map.setMaxLevel(MAX_LEVEL);
      mapRef.current = map;
      setMapReady(true);
    });
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.panTo(new window.kakao.maps.LatLng(lat, lng));
  }, [lat, lng]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !mapReady) return;

    let animationFrameId: number | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (animationFrameId !== null) return;

      animationFrameId = window.requestAnimationFrame(() => {
        mapRef.current?.relayout();
        animationFrameId = null;
      });
    });

    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [mapReady]);

  const zoom = useCallback((delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    const next = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, map.getLevel() + delta));
    map.setLevel(next);
  }, []);

  const recenter = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.panTo(new window.kakao.maps.LatLng(lat, lng));
  }, [lat, lng]);

  return {
    containerRef,
    mapRef,
    mapReady,
    error,
    zoom,
    recenter,
  };
}

export { MAX_LEVEL, MIN_LEVEL };
