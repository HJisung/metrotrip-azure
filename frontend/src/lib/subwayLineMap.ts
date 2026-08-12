type Point = { x: number; y: number };

type ApiLineStation = {
  stationId: number;
  stationName: string;
  stationOrder: number;
  latitude: number;
  longitude: number;
};

type ApiLineStationsResponse = {
  lineId: number;
  items: ApiLineStation[];
};

/** 실제 세 노선. DB의 line_id 6개가 이 세 노선으로 묶인다. */
export type RealLineId = "line1" | "line2" | "line4";

export const REAL_LINE_META: Record<RealLineId, { label: string; color: string }> = {
  line1: { label: "1호선", color: "#0052a4" },
  line2: { label: "2호선", color: "#00a84d" },
  line4: { label: "4호선", color: "#00a5de" },
};

const LINE_ID_TO_REAL: Record<number, RealLineId> = {
  1: "line1",
  2: "line1",
  3: "line4",
  4: "line2",
  5: "line2",
  6: "line2",
};

export type LineMapStation = {
  stationId: string;
  name: string;
  x: number;
  y: number;
  /** 이 역이 속한 실제 노선들 (2개 이상이면 환승역) */
  lines: RealLineId[];
};

export type LineMapEdge = {
  from: string;
  to: string;
  line: RealLineId;
};

export type LineMapData = {
  stations: Map<string, LineMapStation>;
  edges: LineMapEdge[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
};

function apiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  return configured.replace(/\/api\/v1\/?$/, "");
}

async function fetchLineStations(lineId: number): Promise<ApiLineStation[]> {
  const response = await fetch(`${apiBaseUrl()}/api/v1/lines/${lineId}/stations`);
  if (!response.ok) return [];
  const data = (await response.json()) as ApiLineStationsResponse;
  return data.items;
}

/**
 * 위경도를 화면 좌표로 바꾼다 (정거장식 도식이 아니라 실제 지리 좌표 기반).
 *
 * 손으로 그린 방향·구간 조합은 노선끼리 만나는 환승역 위치를 서로 다르게
 * 계산해서 억지로 맞추려 하면 도심 구간이 뒤엉켰다. 반면 API가 이미 모든 역의
 * 실제 위경도를 주므로, 그걸 그대로 투영하면 환승역은 같은 역이라 좌표가
 * 자동으로 일치하고 굴곡도 실제 노선과 같아진다.
 *
 * 경도는 위도에 비례해 지구 둘레가 줄어드므로 cos(기준위도)를 곱해 보정한다
 * (한국 위도대에서 동서 방향이 눌려 보이는 것을 막는다).
 */
const ORIGIN = { lat: 37.5665, lng: 126.978 }; // 서울시청 부근
const SCALE = 800; // 위경도 1도당 픽셀 수 느낌의 배율 (도 단위 좌표를 다루기 좋은 크기로)

function project(lat: number, lng: number): Point {
  const latRad = (ORIGIN.lat * Math.PI) / 180;
  return {
    x: (lng - ORIGIN.lng) * Math.cos(latRad) * SCALE,
    y: -(lat - ORIGIN.lat) * SCALE,
  };
}

function addStation(
  target: Map<string, LineMapStation>,
  station: ApiLineStation,
  line: RealLineId,
) {
  const id = String(station.stationId);
  const existing = target.get(id);
  if (existing) {
    if (!existing.lines.includes(line)) existing.lines.push(line);
    return;
  }
  const point = project(station.latitude, station.longitude);
  target.set(id, { stationId: id, name: station.stationName, x: point.x, y: point.y, lines: [line] });
}

function addEdges(edges: LineMapEdge[], stations: ApiLineStation[], line: RealLineId) {
  for (let i = 1; i < stations.length; i++) {
    edges.push({ from: String(stations[i - 1].stationId), to: String(stations[i].stationId), line });
  }
}

/**
 * 6개 line_id 를 실제 위경도로 투영해 3개 노선(1·2·4호선) 지도를 만든다.
 * 2호선은 순환선이라 마지막 역에서 첫 역으로 돌아가는 edge를 하나 더 넣는다.
 */
export async function loadSubwayLineMap(): Promise<LineMapData> {
  const [line1, line2, line3, line4, line5, line6] = await Promise.all(
    [1, 2, 3, 4, 5, 6].map(fetchLineStations),
  );

  const stations = new Map<string, LineMapStation>();
  const edges: LineMapEdge[] = [];

  const groups: [ApiLineStation[], number][] = [
    [line1, 1],
    [line2, 2],
    [line3, 3],
    [line4, 4],
    [line5, 5],
    [line6, 6],
  ];

  for (const [list, lineId] of groups) {
    const realLine = LINE_ID_TO_REAL[lineId];
    list.forEach((station) => addStation(stations, station, realLine));
    addEdges(edges, list, realLine);
  }

  // 2호선 본선(line_id=4)은 순환선이라 마지막 역(충정로) → 첫 역(시청)으로 닫는다.
  if (line4.length > 1) {
    edges.push({ from: String(line4[line4.length - 1].stationId), to: String(line4[0].stationId), line: "line2" });
  }

  const xs = [...stations.values()].map((s) => s.x);
  const ys = [...stations.values()].map((s) => s.y);
  const bounds = {
    minX: Math.min(...xs, 0),
    maxX: Math.max(...xs, 0),
    minY: Math.min(...ys, 0),
    maxY: Math.max(...ys, 0),
  };

  return { stations, edges, bounds };
}
