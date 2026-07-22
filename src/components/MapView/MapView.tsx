import { useEffect, useRef, useState } from 'react';

type MapViewProps = {
  /** 지도 중심 위도 */
  lat: number;
  /** 지도 중심 경도 */
  lng: number;
};

/** 지도 확대 레벨. 숫자가 작을수록 확대되며, 3이면 반경 1km 정도가 화면에 들어온다. */
const MAP_LEVEL = 5;

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
      mapRef.current = new window.kakao.maps.Map(container, {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: MAP_LEVEL,
      });
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
