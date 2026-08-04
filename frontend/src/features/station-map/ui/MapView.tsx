import type { RefObject } from 'react';
import { MapControls } from './MapControls';

type MapViewProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  error: string | null;
  mapReady: boolean;
  stationName: string;
  onRecenter: () => void;
  onZoom: (delta: number) => void;
};

export function MapView({
  containerRef,
  error,
  mapReady,
  stationName,
  onRecenter,
  onZoom,
}: MapViewProps) {
  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-lg">
        <p className="max-w-[28rem] text-body-md leading-relaxed text-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" role="application" aria-label={`${stationName} 지도`} />
      <MapControls mapReady={mapReady} onRecenter={onRecenter} onZoom={onZoom} />
    </div>
  );
}
