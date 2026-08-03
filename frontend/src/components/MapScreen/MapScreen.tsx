import { useCallback, useEffect, useState } from 'react';
import { getPlacesByStation } from '../../api/places';
import type { Place } from '../../types/place';
import type { Station } from '../../types/station';
import { Icon } from '../Icon';
import { MapView } from '../MapView/MapView';
import { PlaceList } from './PlaceList';
import { StationList } from '../StationList/StationList';
import { TimetablePanel } from './TimetablePanel';

type MapScreenProps = {
  selected: Station;
  onSelectStation: (station: Station) => void;
};

/** 지도 중심 레이아웃: 상단 역 순서·검색, 좌측 장소, 우측 시간표 */
export function MapScreen({ selected, onSelectStation }: MapScreenProps) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [placesStatus, setPlacesStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [timetableOpen, setTimetableOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPlaces([]);
    setPlacesStatus('loading');
    setSelectedPlaceId(null);
    setTimetableOpen(false);

    getPlacesByStation(selected.name)
      .then((result) => {
        if (!cancelled) {
          setPlaces(result);
          setPlacesStatus('success');
        }
      })
      .catch(() => {
        if (!cancelled) setPlacesStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [selected.name]);

  const selectPlace = useCallback((place: Place) => {
    setSelectedPlaceId(place.id);
  }, []);

  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-surface-container-low">
      <section className="absolute inset-0" aria-label="지도 영역">
        <MapView
          lat={selected.lat}
          lng={selected.lng}
          stationName={selected.name}
          places={places}
          selectedPlaceId={selectedPlaceId}
          onSelectPlace={selectPlace}
        />
      </section>

      <div className="pointer-events-none relative z-40 flex h-full min-h-0 flex-col justify-between lg:flex-row">
        <div className="pointer-events-auto shrink-0 lg:order-2 lg:w-auto">
          <StationList selected={selected} onSelect={onSelectStation} />
        </div>

        <div className="relative min-h-0 flex-1 lg:order-1 lg:h-full lg:flex-1">
          <aside className="pointer-events-auto absolute bottom-0 left-0 top-0 flex w-full min-h-0 flex-col overflow-hidden border border-outline-variant bg-surface/95 shadow-md backdrop-blur-sm sm:bottom-0 sm:left-0 sm:top-0 sm:w-[22rem] lg:left-0 lg:w-[23rem]">
            <header className="flex shrink-0 items-center gap-sm border-b border-outline-variant p-md">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-on-primary">
                <Icon name="subway" />
              </span>
              <div className="min-w-0">
                <p className="text-label-caps text-on-surface-variant">현재 선택한 역</p>
                <h1 className="truncate text-headline-sm text-on-surface">{selected.name}</h1>
                <p className="text-body-md text-on-surface-variant">{selected.line}</p>
              </div>
              <button
                type="button"
                onClick={() => setTimetableOpen(true)}
                aria-label={`${selected.name} 시간표 열기`}
                aria-expanded={timetableOpen}
                className="ml-auto flex shrink-0 items-center gap-xs border-b border-primary px-xs py-xs text-body-md font-bold text-primary hover:text-on-surface"
              >
                <Icon name="schedule" className="text-[18px]" />
                시간표
              </button>
            </header>

            <PlaceList
              places={places}
              status={placesStatus}
              selectedPlaceId={selectedPlaceId}
              onSelect={selectPlace}
            />
          </aside>
        </div>
      </div>

      {timetableOpen && (
        <TimetablePanel
          station={selected}
          onClose={() => setTimetableOpen(false)}
        />
      )}
    </div>
  );
}
