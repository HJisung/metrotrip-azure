import { useEffect, useState } from 'react';
import type { Station } from '../../shared/types/station';
import { Icon } from '../../shared/ui/Icon';
import { useKakaoMap } from './hooks/useKakaoMap';
import { usePlaceMarkers } from './hooks/usePlaceMarkers';
import { useStationList } from './hooks/useStationList';
import { useStationPlaces } from './hooks/useStationPlaces';
import { MapView } from './ui/MapView';
import { PlaceList } from './ui/PlaceList';
import { StationList } from './ui/StationList';
import { TimetableFeature } from '../timetable/TimetableFeature';
import { Card } from '../../shared/ui/Card';
import { Button } from '../../shared/ui/Button';

type MapScreenProps = {
  selected: Station;
  onSelectStation: (station: Station) => void;
};

/** 지도 중심 레이아웃: 상단 역 순서·검색, 좌측 장소, 우측 시간표 */
export function StationMapFeature({ selected, onSelectStation }: MapScreenProps) {
  const [timetableOpen, setTimetableOpen] = useState(false);
  const placeState = useStationPlaces(selected.name);
  const stationState = useStationList();
  const mapState = useKakaoMap({ lat: selected.lat, lng: selected.lng });

  useEffect(() => setTimetableOpen(false), [selected.name]);

  usePlaceMarkers({
    mapRef: mapState.mapRef,
    mapReady: mapState.mapReady,
    places: placeState.places,
    selectedPlaceId: placeState.selectedPlaceId,
    onSelectPlace: placeState.selectPlace,
  });

  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-surface-container-low">
      <section className="absolute inset-0" aria-label="지도 영역">
        <MapView
          containerRef={mapState.containerRef}
          error={mapState.error}
          mapReady={mapState.mapReady}
          stationName={selected.name}
          onRecenter={mapState.recenter}
          onZoom={mapState.zoom}
        />
      </section>

      <div className="pointer-events-none relative z-40 flex h-full min-h-0 flex-col justify-between lg:flex-row">
        <div className="pointer-events-auto shrink-0 lg:order-2 lg:w-auto">
          <StationList selected={selected} onSelect={onSelectStation} {...stationState} />
        </div>

        <div className="relative min-h-0 flex-1 lg:order-1 lg:h-full lg:flex-1">
          <Card className="pointer-events-auto absolute bottom-0 left-0 top-0 flex w-full min-h-0 flex-col overflow-hidden rounded-none border-y-0 border-l-0 bg-surface/95 shadow-xl backdrop-blur-xl sm:bottom-0 sm:left-0 sm:top-0 sm:w-[22rem] lg:left-0 lg:w-[23rem]">
            <header className="flex shrink-0 items-center gap-sm border-b border-outline-variant/70 bg-surface-bright/75 p-md">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-container text-primary">
                <Icon name="subway" />
              </span>
              <div className="min-w-0">
                <p className="text-label-caps text-on-surface-variant">현재 선택한 역</p>
                <h1 className="truncate text-headline-sm text-on-surface">{selected.name}</h1>
                <p className="text-body-md text-on-surface-variant">{selected.line}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setTimetableOpen(true)}
                aria-label={`${selected.name} 시간표 열기`}
                aria-expanded={timetableOpen}
                className="ml-auto text-primary"
              >
                <Icon name="schedule" className="text-[18px]" />
                시간표
              </Button>
            </header>

            <PlaceList
              places={placeState.places}
              status={placeState.status}
              selectedPlaceId={placeState.selectedPlaceId}
              onSelect={placeState.selectPlace}
            />
          </Card>
        </div>
      </div>

      {timetableOpen && (
        <TimetableFeature
          station={selected}
          onClose={() => setTimetableOpen(false)}
        />
      )}
    </div>
  );
}
