import type { Station } from '../../../shared/types/station';
import { Icon } from '../../../shared/ui/Icon';
import { Card } from '../../../shared/ui/Card';
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

/** 지도 상단의 역 순서와 독립 검색 영역 */
export function StationList({
  selected,
  onSelect,
  keyword,
  setKeyword,
  stations,
  searchResults,
  status,
  searchStatus,
}: StationListProps) {
  return (
    <div className="flex w-full flex-col items-end gap-xs p-3 sm:p-[30px] lg:w-auto">
      <Card className="w-fit max-w-full px-sm py-xs backdrop-blur-sm sm:px-md">
        {status === 'loading' ? (
          <p className="flex min-h-10 items-center gap-xs text-body-md text-on-surface-variant" role="status">
            <Icon name="progress_activity" className="animate-spin text-[18px]" />
            역 목록을 불러오는 중입니다.
          </p>
        ) : status === 'error' ? (
          <p className="min-h-10 py-xs text-body-md text-error" role="alert">
            역 목록을 불러오지 못했습니다.
          </p>
        ) : stations.length === 0 ? (
          <p className="min-h-10 py-xs text-body-md text-on-surface-variant">검색 결과가 없습니다.</p>
        ) : (
          <ul className="flex flex-wrap items-center" aria-label="역 순서">
            {stations.map((station, index) => {
              const isActive = selected?.name === station.name;
              return (
                <li key={station.name} className="flex items-center">
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => onSelect(station)}
                    className={`min-h-9 px-xs py-xs text-body-md transition-colors ${
                      isActive
                        ? 'font-bold text-primary underline decoration-2 underline-offset-4'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    {station.name.replace(/역$/, '')}
                  </button>
                  {index < stations.length - 1 && (
                    <span className="px-[2px] text-on-surface-variant/60" aria-hidden="true">
                      -
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="relative flex w-full justify-end">
        <div className="w-full max-w-64">
          <label className="flex items-center gap-xs rounded-xl border border-outline-variant bg-surface-bright px-sm shadow-card backdrop-blur-sm">
            <Icon name="search" className="text-on-surface-variant" />
            <span className="sr-only">역 이름 검색</span>
            <Input
              aria-label="역 이름 검색"
              className="h-10 min-w-0 flex-1 border-none bg-transparent px-xs shadow-none focus:ring-0"
              type="search"
              placeholder="역 이름 검색"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword('')}
                aria-label="역 검색어 지우기"
                className="text-on-surface-variant hover:text-primary"
              >
                <Icon name="close" className="text-[18px]" />
              </button>
            )}
          </label>
          {keyword && searchStatus === 'success' && searchResults.length > 0 && (
            <ul className="absolute right-0 z-10 mt-1 w-full overflow-hidden rounded-[5px] border border-outline-variant bg-surface shadow-md" aria-label="역 검색 결과">
              {searchResults.map((station) => (
                <li key={station.name}>
                  <button
                    type="button"
                    className="w-full px-sm py-xs text-left text-body-md text-on-surface hover:bg-surface-container-low"
                    onClick={() => {
                      onSelect(station);
                      setKeyword('');
                    }}
                  >
                    {station.name.replace(/역$/, '')}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {keyword && searchStatus === 'success' && searchResults.length === 0 && (
            <p className="absolute right-0 z-10 mt-1 w-full rounded-[5px] border border-outline-variant bg-surface px-sm py-xs text-body-md text-on-surface-variant shadow-md">
              검색 결과가 없습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
