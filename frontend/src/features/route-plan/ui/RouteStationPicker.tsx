import type { Station } from '../../../shared/types/station';
import { Badge } from '../../../shared/ui/Badge';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { Icon } from '../../../shared/ui/Icon';

/** 출발·도착역 선택 (docs/SPEC.md 2-2 R1). */

type RouteStationPickerProps = {
  stations: Station[];
  fromName: string;
  toName: string;
  onFromChange: (name: string) => void;
  onToChange: (name: string) => void;
  onSwap: () => void;
};

const selectClassName =
  'w-full rounded-lg border border-outline-variant bg-surface-bright px-sm py-sm text-body-lg text-on-surface';

export function RouteStationPicker({
  stations,
  fromName,
  toName,
  onFromChange,
  onToChange,
  onSwap,
}: RouteStationPickerProps) {
  return (
    <Card className="flex flex-col gap-sm p-md">
      <div className="flex items-center gap-sm">
        <Badge className="shrink-0">출발</Badge>
        <label className="sr-only" htmlFor="route-from">
          출발역
        </label>
        <select
          id="route-from"
          className={selectClassName}
          value={fromName}
          onChange={(event) => onFromChange(event.target.value)}
        >
          {stations.map((station) => (
            <option key={station.name} value={station.name}>
              {station.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end pr-xs">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onSwap}
          aria-label="출발역과 도착역 바꾸기"
        >
          <Icon name="swap_vert" className="text-[20px]" />
        </Button>
      </div>

      <div className="flex items-center gap-sm">
        <Badge className="shrink-0 bg-secondary-container text-on-secondary-container">
          도착
        </Badge>
        <label className="sr-only" htmlFor="route-to">
          도착역
        </label>
        <select
          id="route-to"
          className={selectClassName}
          value={toName}
          onChange={(event) => onToChange(event.target.value)}
        >
          {stations.map((station) => (
            <option key={station.name} value={station.name}>
              {station.name}
            </option>
          ))}
        </select>
      </div>
    </Card>
  );
}
