import type { Station } from '../../../shared/types/station';

/**
 * 역의 위도·경도를 SVG 좌표로 투영한다 (docs/SPEC.md 2-2 R1).
 *
 * 노선도 좌표를 손으로 찍지 않으므로, DB 담당이 250개 역을 내려줘도
 * 코드를 고치지 않고 그대로 그려진다.
 *
 * 대신 실제 지리를 따르기 때문에 진짜 노선도처럼 45도로 정돈된 모양은 아니고,
 * 역이 몰린 구간은 라벨이 겹칠 수 있다.
 */

/** 긴 쪽 기준 크기. viewBox 는 이 값과 실제 비율로 정해진다. */
const BASE_SIZE = 1000;

/** 역 이름이 잘리지 않도록 가장자리에 남겨 두는 여백 */
const PADDING = 90;

export type ProjectedStation = Station & { x: number; y: number };

export type StationProjection = {
  stations: ProjectedStation[];
  /**
   * 투영 결과를 꽉 채우는 viewBox.
   *
   * 고정 크기를 쓰면 노선 모양에 따라 위아래나 좌우가 크게 비어
   * 지도가 가운데 작게 박힌다. 그래서 내용에 맞춰 계산한다.
   */
  viewBox: { width: number; height: number };
};

const EMPTY: StationProjection = {
  stations: [],
  viewBox: { width: BASE_SIZE, height: BASE_SIZE },
};

export function projectStations(stations: Station[]): StationProjection {
  if (stations.length === 0) return EMPTY;

  // 경도 1도의 실제 거리는 위도가 높아질수록 짧아진다.
  // cos 보정을 하지 않으면 지도가 가로로 늘어나 보인다.
  const meanLat =
    stations.reduce((sum, station) => sum + station.lat, 0) / stations.length;
  const lngScale = Math.cos((meanLat * Math.PI) / 180);

  const points = stations.map((station) => ({
    station,
    // 위도는 북쪽이 클수록 화면 위로 가야 하므로 부호를 뒤집는다.
    px: station.lng * lngScale,
    py: -station.lat,
  }));

  const xs = points.map((point) => point.px);
  const ys = points.map((point) => point.py);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);

  // 역이 하나뿐이거나 일직선이면 폭이 0이 되므로 나눗셈을 방어한다.
  const spanX = Math.max(...xs) - minX || 1;
  const spanY = Math.max(...ys) - minY || 1;

  // 가로세로 같은 배율을 써야 지리적으로 찌그러지지 않는다.
  const scale = BASE_SIZE / Math.max(spanX, spanY);

  return {
    stations: points.map(({ station, px, py }) => ({
      ...station,
      x: PADDING + (px - minX) * scale,
      y: PADDING + (py - minY) * scale,
    })),
    viewBox: {
      width: spanX * scale + PADDING * 2,
      height: spanY * scale + PADDING * 2,
    },
  };
}
