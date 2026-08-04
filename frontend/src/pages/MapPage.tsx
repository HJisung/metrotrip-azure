import type { Station } from '../shared/types/station';
import { StationMapFeature } from '../features/station-map/StationMapFeature';

type MapPageProps = {
  selected: Station;
  onSelectStation: (station: Station) => void;
};

export function MapPage({ selected, onSelectStation }: MapPageProps) {
  return <StationMapFeature selected={selected} onSelectStation={onSelectStation} />;
}
