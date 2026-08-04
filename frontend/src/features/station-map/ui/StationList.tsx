import type { Station } from '../../../shared/types/station';
import { Card } from '../../../shared/ui/Card';
import { Icon } from '../../../shared/ui/Icon';
import { Input } from '../../../shared/ui/Input';

type StationListProps = {
  selected: Station | null;
  onSelect: (station: Station) => void;
  keyword: string;
  setKeyword: (keyword: string) => void;
  stations: Station[];
  searchResults: Station[];
  status: 'loading' | 'success' | 'error';
  searchStatus: 'loading' | 'success' | 'error';
};

export function StationList({ selected, onSelect, keyword, setKeyword, stations, searchResults, status, searchStatus }: StationListProps) {
  return (
    <div className="flex w-full min-w-0 flex-col items-end gap-sm p-3 sm:p-lg lg:w-auto">
      <Card className="station-order-list scrollbar-none w-full max-w-full overflow-x-auto bg-surface-bright/95 p-xs backdrop-blur-xl lg:w-auto">
        {status === 'loading' ? (
          <p className="flex min-h-10 items-center gap-xs px-sm text-body-md text-on-surface-variant" role="status">
            <Icon name="progress_activity" className="animate-spin text-[18px]" /> 역 목록을 불러오는 중입니다.
          </p>
        ) : status === 'error' ? (
          <p className="min-h-10 px-sm py-xs text-body-md text-error" role="alert">역 목록을 불러오지 못했습니다.</p>
        ) : stations.length === 0 ? (
          <p className="min-h-10 px-sm py-xs text-body-md text-on-surface-variant">검색 결과가 없습니다.</p>
        ) : (
          <ul className="flex w-max min-w-full flex-nowrap items-center gap-xs" aria-label="역 순서">
            {stations.map((station, index) => {
              const isActive = selected?.name === station.name;
              return (
                <li key={station.name} className="flex items-center gap-xs">
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => onSelect(station)}
                    className={`min-h-9 rounded-lg px-sm py-xs text-body-md transition-all ${
                      isActive
                        ? 'bg-primary font-bold text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:bg-primary-container/50 hover:text-primary'
                    }`}
                  >
                    {station.name.replace(/역$/, '')}
                  </button>
                  {index < stations.length - 1 && <span className="h-px w-2 bg-outline-variant" aria-hidden="true" />}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="relative w-full max-w-[min(100%,22rem)]">
        <label className="flex items-center gap-xs rounded-xl border border-outline-variant bg-surface-bright/95 px-sm shadow-card backdrop-blur-xl">
          <Icon name="search" className="text-on-surface-variant" />
          <span className="sr-only">역 이름 검색</span>
          <Input
            aria-label="역 이름 검색"
            className="h-11 min-w-0 flex-1 border-none bg-transparent px-xs shadow-none focus:ring-0"
            type="search"
            placeholder="어느 역으로 갈까요?"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          {keyword && (
            <button type="button" onClick={() => setKeyword('')} aria-label="역 검색어 지우기" className="rounded-full p-xs text-on-surface-variant hover:bg-surface-container-low hover:text-primary">
              <Icon name="close" className="text-[18px]" />
            </button>
          )}
        </label>
        {keyword && searchStatus === 'success' && searchResults.length > 0 && (
          <Card className="absolute right-0 z-10 mt-xs w-full overflow-hidden p-xs" role="listbox" aria-label="역 검색 결과">
            {searchResults.map((station) => (
              <button
                key={station.name}
                type="button"
                className="w-full rounded-lg px-md py-sm text-left text-body-md text-on-surface hover:bg-surface-container-low"
                onClick={() => { onSelect(station); setKeyword(''); }}
              >
                {station.name.replace(/역$/, '')}
              </button>
            ))}
          </Card>
        )}
        {keyword && searchStatus === 'success' && searchResults.length === 0 && (
          <Card className="absolute right-0 z-10 mt-xs w-full px-md py-sm text-body-md text-on-surface-variant">검색 결과가 없습니다.</Card>
        )}
      </div>
    </div>
  );
}
