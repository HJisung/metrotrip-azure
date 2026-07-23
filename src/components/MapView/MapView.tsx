import { useEffect, useRef, useState } from 'react';

type MapViewProps = {
  /** 지도 중심 위도 */
  lat: number;
  /** 지도 중심 경도 */
  lng: number;
};

/**
 * 지도 확대 레벨. 숫자가 작을수록 확대된다.
 *
 * 레벨과 축척은 실측으로 확인했다 (100px 기준):
 *   1 → 25m   2 → 50m    3 → 100m
 *   4 → 200m  5 → 400m   6 → 800m
 * 축척 표시 기준으로는 레벨 3이 50m, 레벨 5가 250m에 해당한다.
 */
const DEFAULT_LEVEL = 3; // 축척 50m
const MIN_LEVEL = 1; // 확대 한계 (숫자가 작을수록 확대)
const MAX_LEVEL = 5; // 축소 한계 — 축척 250m

/**
 * 소수점 레벨(예: 3.5)은 쓰지 않는다.
 *
 * SDK가 소수 레벨을 받아주기는 하고 좌표 계산도 그에 맞게 나오지만,
 * 타일이 그려지지 않고 축척 표시가 NaN 으로 깨진다. 정식 지원 범위가 아니다.
 * 확대/축소는 카카오 기본 동작(정수 레벨 1칸씩)을 그대로 쓴다.
 */


/**
 * 카카오맵을 표시하는 컴포넌트.
 *
 * SDK는 index.html에서 autoload=false로 로드되므로,
 * kakao.maps.load() 안에서 지도를 생성해야 한다.
 */
export function MapView({ lat, lng }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 지도 최초 생성 (1회만)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!window.kakao?.maps) {
      setError(
        '카카오맵 SDK를 불러오지 못했습니다. .env의 VITE_KAKAO_MAP_KEY 값과 개발자 콘솔의 도메인 등록을 확인하세요.',
      );
      return;
    }

    window.kakao.maps.load(() => {
      const map = new window.kakao.maps.Map(container, {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: DEFAULT_LEVEL,
      });

      // 축소 한계를 두는 이유:
      // 크게 축소할수록 채워야 할 타일이 4배씩 늘어 로딩 중 화면이 비어 보인다.
      // 이 앱은 역 주변 1km를 보는 용도라 그 이상 축소할 이유도 없다.
      map.setMinLevel(MIN_LEVEL);
      map.setMaxLevel(MAX_LEVEL);

      mapRef.current = map;
    });
    // 최초 1회만 생성한다. 이후 좌표 변경은 아래 effect에서 처리.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 좌표가 바뀌면 중심 이동
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.panTo(new window.kakao.maps.LatLng(lat, lng));
  }, [lat, lng]);

  if (error) {
    return <div className="map-error">{error}</div>;
  }

  return <div ref={containerRef} className="map-view" />;
}
