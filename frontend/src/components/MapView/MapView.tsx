import { useEffect, useRef, useState } from 'react';
import { Icon } from '../Icon';
import { getMarkerImage } from './markerIcons';
import type { Place } from '../../types/place';

type MapViewProps = {
  lat: number;
  lng: number;
  stationName: string;
  places: Place[];
  selectedPlaceId: string | null;
  onSelectPlace: (place: Place) => void;
};

const DEFAULT_LEVEL = 3;
const MIN_LEVEL = 1;
const MAX_LEVEL = 5;

function infoWindowHtml(place: Place) {
  const isDark = document.documentElement.classList.contains('dark');
  const accent = isDark ? '#8bb4ff' : '#175dcc';
  const heading = isDark ? '#e6edff' : '#1d252c';
  const muted = isDark ? '#b7c0d6' : '#63707a';
  const escape = (text: string) =>
    text.replace(
      /[&<>"]/g,
      (character) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[
          character
        ] ?? character,
    );

  return `
    <div style="padding:10px 14px 14px;width:230px;line-height:1.45;font-family:Inter,system-ui,sans-serif;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.05em;color:${accent};">
        ${escape(place.categoryName)}
      </div>
      <div style="margin-top:2px;font-size:14px;font-weight:700;color:${heading};">
        ${escape(place.name)}
      </div>
      <div style="margin-top:4px;font-size:12px;color:${muted};">
        ${escape(place.address)}
      </div>
    </div>
  `;
}

/** 카카오 지도를 표시하고 장소 목록과 선택 상태를 공유한다. */
export function MapView({
  lat,
  lng,
  stationName,
  places,
  selectedPlaceId,
  onSelectPlace,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef(new Map<string, kakao.maps.Marker>());
  const infoWindowRef = useRef<kakao.maps.InfoWindow | null>(null);
  const initialCenterRef = useRef({ lat, lng });
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!window.kakao?.maps) {
      setError(
        '카카오맵 SDK를 불러오지 못했습니다. .env의 VITE_KAKAO_MAP_KEY를 확인해 주세요.',
      );
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
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const markers = markersRef.current;

    markers.forEach((marker) => marker.setMap(null));
    markers.clear();
    infoWindowRef.current?.close();

    places.forEach((place) => {
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(place.lat, place.lng),
        map,
        title: place.name,
        image: getMarkerImage(place.category),
      });

      window.kakao.maps.event.addListener(marker, 'click', () => {
        onSelectPlace(place);
      });
      markers.set(place.id, marker);
    });

    return () => {
      markers.forEach((marker) => marker.setMap(null));
      markers.clear();
    };
  }, [mapReady, onSelectPlace, places]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPlaceId) return;

    const place = places.find(({ id }) => id === selectedPlaceId);
    const marker = markersRef.current.get(selectedPlaceId);
    if (!place || !marker) return;

    infoWindowRef.current?.close();
    const infoWindow = new window.kakao.maps.InfoWindow({
      content: infoWindowHtml(place),
      removable: true,
    });
    infoWindow.open(map, marker);
    infoWindowRef.current = infoWindow;
  }, [places, selectedPlaceId]);

  const zoom = (delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    const next = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, map.getLevel() + delta));
    map.setLevel(next);
  };

  const recenter = () => {
    const map = mapRef.current;
    if (!map) return;
    map.panTo(new window.kakao.maps.LatLng(lat, lng));
  };

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-lg">
        <p className="max-w-[28rem] text-body-md leading-relaxed text-error">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" role="application" aria-label={`${stationName} 지도`} />

      <div className="absolute bottom-md right-md z-30 flex flex-col gap-xs">
        <button
          type="button"
          onClick={recenter}
          disabled={!mapReady}
          aria-label="선택한 역으로 이동"
          className="flex h-11 w-11 items-center justify-center border border-outline-variant bg-surface-container-lowest text-primary shadow-sm transition-all hover:bg-surface-container-low active:scale-95"
        >
          <Icon name="my_location" />
        </button>
        <div className="flex flex-col overflow-hidden border border-outline-variant bg-surface-container-lowest shadow-sm">
          <button
            type="button"
            onClick={() => zoom(-1)}
            disabled={!mapReady}
            aria-label="지도 확대"
            className="flex h-12 w-12 items-center justify-center border-b border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            <Icon name="add" />
          </button>
          <button
            type="button"
            onClick={() => zoom(1)}
            disabled={!mapReady}
            aria-label="지도 축소"
            className="flex h-12 w-12 items-center justify-center text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            <Icon name="remove" />
          </button>
        </div>
      </div>
    </div>
  );
}
