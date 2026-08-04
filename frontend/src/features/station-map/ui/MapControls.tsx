import { Icon } from '../../../shared/ui/Icon';

type MapControlsProps = {
  mapReady: boolean;
  onRecenter: () => void;
  onZoom: (delta: number) => void;
};

export function MapControls({ mapReady, onRecenter, onZoom }: MapControlsProps) {
  return (
    <div className="absolute bottom-md right-md z-30 flex flex-col gap-xs">
      <button
        type="button"
        onClick={onRecenter}
        disabled={!mapReady}
        aria-label="선택한 역으로 이동"
        className="flex h-11 w-11 items-center justify-center border border-outline-variant bg-surface-container-lowest text-primary shadow-sm transition-all hover:bg-surface-container-low active:scale-95"
      >
        <Icon name="my_location" />
      </button>
      <div className="flex flex-col overflow-hidden border border-outline-variant bg-surface-container-lowest shadow-sm">
        <button
          type="button"
          onClick={() => onZoom(-1)}
          disabled={!mapReady}
          aria-label="지도 확대"
          className="flex h-12 w-12 items-center justify-center border-b border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-low"
        >
          <Icon name="add" />
        </button>
        <button
          type="button"
          onClick={() => onZoom(1)}
          disabled={!mapReady}
          aria-label="지도 축소"
          className="flex h-12 w-12 items-center justify-center text-on-surface-variant transition-colors hover:bg-surface-container-low"
        >
          <Icon name="remove" />
        </button>
      </div>
    </div>
  );
}
