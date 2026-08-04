import type { Place } from '../types';
import { Icon } from '../../../shared/ui/Icon';

type PlaceListProps = {
  places: Place[];
  status: 'loading' | 'success' | 'error';
  selectedPlaceId: string | null;
  onSelect: (place: Place) => void;
};

function getCategoryIcon(category: Place['category']) {
  if (category === 'CE7') return 'local_cafe';
  if (category === 'AT4') return 'park';
  if (category === 'SW8') return 'subway';
  return 'restaurant';
}

/** 지도 주변 장소를 표시하고 지도 마커와 선택 상태를 공유한다. */
export function PlaceList({
  places,
  status,
  selectedPlaceId,
  onSelect,
}: PlaceListProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col border-t border-outline-variant">
      <div className="flex items-center justify-between border-b border-outline-variant py-md">
        <div>
          <h2 className="text-headline-sm">주변 장소</h2>
          <p className="text-body-md text-on-surface-variant">
            역에서 가까운 장소 {places.length}곳
          </p>
        </div>
        <span className="text-label-caps text-on-surface-variant">
          반경 1km
        </span>
      </div>

      {status === 'loading' ? (
        <div className="flex flex-1 items-center gap-sm p-md text-body-md text-on-surface-variant" role="status">
          <Icon name="progress_activity" className="animate-spin text-[22px]" />
          주변 장소를 불러오는 중입니다.
        </div>
      ) : status === 'error' ? (
        <div className="flex flex-1 items-center gap-sm p-md text-body-md text-error" role="alert">
          <Icon name="error_outline" className="text-[22px]" />
          주변 장소를 불러오지 못했습니다.
        </div>
      ) : places.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-sm p-lg text-center">
          <Icon name="location_off" className="text-[28px] text-on-surface-variant" />
          <p className="text-body-md text-on-surface-variant">
            표시할 주변 장소가 없습니다.
          </p>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 space-y-xs overflow-y-auto py-sm">
          {places.map((place) => {
            const isSelected = selectedPlaceId === place.id;

            return (
              <li key={place.id}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelect(place)}
                  className={`flex w-full items-start gap-sm border-b px-sm py-sm text-left transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-outline-variant/60 hover:bg-surface-container-low'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                      isSelected
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-primary'
                    }`}
                  >
                    <Icon name={getCategoryIcon(place.category)} className="text-[20px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-label-caps text-on-surface-variant">
                      {place.categoryName}
                    </span>
                    <span className="mt-0.5 block truncate text-body-lg font-bold text-on-surface">
                      {place.name}
                    </span>
                    <span className="mt-0.5 block truncate text-body-md text-on-surface-variant">
                      {place.address}
                    </span>
                  </span>
                  <Icon
                    name={isSelected ? 'radio_button_checked' : 'chevron_right'}
                    className="mt-sm shrink-0 text-[18px] text-primary"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
