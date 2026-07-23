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
 * 휠 1칸(deltaY 100~120)이 약 0.3레벨 움직이도록 하는 계수.
 * 값을 키우면 조금만 굴려도 크게 변한다.
 */
const WHEEL_SENSITIVITY = 0.0025;


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

    let detachWheel: (() => void) | undefined;

    window.kakao.maps.load(() => {
      const map = new window.kakao.maps.Map(container, {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: DEFAULT_LEVEL,
        // 카카오 기본 휠 동작은 한 번에 한 레벨씩 계단식으로 움직인다.
        // 스크롤 양에 비례한 가변 확대를 쓰기 위해 끄고 직접 처리한다.
        scrollwheel: false,
      });

      // 축소 한계를 두는 이유:
      // 크게 축소할수록 채워야 할 타일이 4배씩 늘어 로딩 중 화면이 비어 보인다.
      // 이 앱은 역 주변 1km를 보는 용도라 그 이상 축소할 이유도 없다.
      map.setMinLevel(MIN_LEVEL);
      map.setMaxLevel(MAX_LEVEL);

      // 스크롤 양에 비례한 가변 확대/축소.
      // 카카오맵은 소수점 레벨을 실제로 렌더링하므로(레벨 3.5 = 축척 약 140m)
      // deltaY에 비례한 소수값을 그대로 넘긴다.
      const handleWheel = (event: WheelEvent) => {
        // 페이지가 같이 스크롤되지 않도록 막는다. passive: false 가 필요하다.
        event.preventDefault();

        const next = map.getLevel() + event.deltaY * WHEEL_SENSITIVITY;
        const clamped = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, next));
        map.setLevel(clamped);
      };

      container.addEventListener('wheel', handleWheel, { passive: false });
      detachWheel = () => container.removeEventListener('wheel', handleWheel);

      mapRef.current = map;
    });

    return () => detachWheel?.();
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
