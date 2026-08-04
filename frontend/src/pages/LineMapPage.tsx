import type { Station } from '../shared/types/station';
import { LineMapFeature } from '../features/line-map/LineMapFeature';

export function LineMapPage({ selected }: { selected: Station }) {
  return <LineMapFeature selected={selected} />;
}
