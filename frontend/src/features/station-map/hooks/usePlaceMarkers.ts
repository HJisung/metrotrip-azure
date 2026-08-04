import { useEffect, useRef } from 'react';
import { getMarkerImage } from '../ui/markerIcons';
import type { Place } from '../types';

function infoWindowHtml(place: Place) {
  const isDark = document.documentElement.classList.contains('dark');
  const accent = isDark ? '#8bb4ff' : '#175dcc';
  const heading = isDark ? '#e6edff' : '#1d252c';
  const muted = isDark ? '#b7c0d6' : '#63707a';
  const escape = (text: string) =>
    text.replace(/[&<>"]/g, (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character] ?? character,
    );

  return `
    <div style="padding:10px 14px 14px;width:230px;line-height:1.45;font-family:Inter,system-ui,sans-serif;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.05em;color:${accent};">${escape(place.categoryName)}</div>
      <div style="margin-top:2px;font-size:14px;font-weight:700;color:${heading};">${escape(place.name)}</div>
      <div style="margin-top:4px;font-size:12px;color:${muted};">${escape(place.address)}</div>
    </div>
  `;
}

type UsePlaceMarkersOptions = {
  mapRef: React.MutableRefObject<kakao.maps.Map | null>;
  mapReady: boolean;
  places: Place[];
  selectedPlaceId: string | null;
  onSelectPlace: (place: Place) => void;
};

export function usePlaceMarkers({
  mapRef,
  mapReady,
  places,
  selectedPlaceId,
  onSelectPlace,
}: UsePlaceMarkersOptions) {
  const markersRef = useRef(new Map<string, kakao.maps.Marker>());
  const infoWindowRef = useRef<kakao.maps.InfoWindow | null>(null);

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
      window.kakao.maps.event.addListener(marker, 'click', () => onSelectPlace(place));
      markers.set(place.id, marker);
    });

    return () => {
      markers.forEach((marker) => marker.setMap(null));
      markers.clear();
    };
  }, [mapReady, mapRef, onSelectPlace, places]);

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
  }, [mapRef, places, selectedPlaceId]);
}
