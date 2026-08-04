import { Button } from '../../../shared/ui/Button';
import { Icon } from '../../../shared/ui/Icon';

type MapControlsProps = {
  mapReady: boolean;
  onRecenter: () => void;
  onZoom: (delta: number) => void;
};

export function MapControls({ mapReady, onRecenter, onZoom }: MapControlsProps) {
  return (
    <div className="absolute bottom-md right-md z-30 flex flex-col gap-xs">
      <Button type="button" variant="outline" size="icon" onClick={onRecenter} disabled={!mapReady} aria-label="선택한 역으로 이동" className="bg-surface-bright text-primary shadow-card">
        <Icon name="my_location" />
      </Button>
      <div className="flex flex-col gap-xs">
        <Button type="button" variant="outline" size="icon" onClick={() => onZoom(-1)} disabled={!mapReady} aria-label="지도 확대" className="bg-surface-bright shadow-card">
          <Icon name="add" />
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={() => onZoom(1)} disabled={!mapReady} aria-label="지도 축소" className="bg-surface-bright shadow-card">
          <Icon name="remove" />
        </Button>
      </div>
    </div>
  );
}
