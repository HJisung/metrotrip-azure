import { useEffect, useState } from 'react';
import { searchStations } from '../../api/stations';
import type { Station } from '../../types/station';

type StationListProps = {
  /** 현재 선택된 역 (지도 중심과 동기화) */
  selected: Station | null;
  onSelect: (station: Station) => void;
};

/** 역 검색창 + 목록. 검색어가 바뀔 때마다 api/stations.ts를 통해 목록을 갱신한다. */
export function StationList({ selected, onSelect }: StationListProps) {
  const [keyword, setKeyword] = useState('');
  const [stations, setStations] = useState<Station[]>([]);

  useEffect(() => {
    let cancelled = false;
    searchStations(keyword).then((result) => {
      if (!cancelled) setStations(result);
    });
    return () => {
      cancelled = true;
    };
  }, [keyword]);

  return (
    <div className="station-list">
      <input
        className="station-search"
        type="text"
        placeholder="역 이름 검색"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <ul className="station-items">
        {stations.map((station) => (
          <li key={station.name}>
            <button
              type="button"
              className={
                selected?.name === station.name
                  ? 'station-item station-item-active'
                  : 'station-item'
              }
              onClick={() => onSelect(station)}
            >
              <span className="station-name">{station.name}</span>
              <span className="station-line">{station.line}</span>
            </button>
          </li>
        ))}
        {stations.length === 0 && (
          <li className="station-empty">검색 결과가 없습니다.</li>
        )}
      </ul>
    </div>
  );
}
