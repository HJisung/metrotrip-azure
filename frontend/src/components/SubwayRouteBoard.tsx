"use client";

import type { components } from "@metrotrip/contracts";
import { Clock3, Minus, Plus, RotateCcw, TrainFront, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SubwayRouteSchedule } from "@/lib/transitTimetable";
import {
  loadSubwayLineMap,
  REAL_LINE_META,
  type LineMapData,
} from "@/lib/subwayLineMap";

type Station = components["schemas"]["StationSummary"];

type SubwayRouteBoardProps = {
  stations: Station[];
  selectedStationId: string | null;
  routeStationIds: string[];
  departureTime: string;
  schedule: SubwayRouteSchedule | null;
  scheduleStatus: "idle" | "loading" | "success" | "error";
  scheduleError: string | null;
  stationsLoading: boolean;
  onSelectStation: (stationId: string) => void;
  onRemoveRouteStation: (stationId: string) => void;
  onResetRoute: () => void;
  onRetryStations: () => void;
};

function routeRole(index: number, length: number) {
  if (index === 0) return "출발";
  if (index === length - 1) return "도착";
  return "경유";
}

// 화면에 보일 기본 확대 배율. 노선도는 실제 지리 좌표라 연천~신창까지 매우 길다.
// 처음에는 선택한 역 주변만 보이게 확대해서 시작한다.
const DEFAULT_SCALE = 6.5;
const MIN_SCALE = 1.5;
const MAX_SCALE = 20;
// 뷰박스 기준 한 변의 길이(지도 좌표 단위). scale로 나눠 확대/축소를 표현한다.
const VIEW_SIZE = 640;

export function SubwayRouteBoard({
  stations,
  selectedStationId,
  routeStationIds,
  departureTime,
  schedule,
  scheduleStatus,
  scheduleError,
  stationsLoading,
  onSelectStation,
  onRemoveRouteStation,
  onResetRoute,
  onRetryStations,
}: SubwayRouteBoardProps) {
  const stationsById = useMemo(() => new Map(stations.map((station) => [station.id, station])), [stations]);

  const [lineMap, setLineMap] = useState<LineMapData | null>(null);
  const [mapError, setMapError] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // 화면 중심(지도 좌표계)과 확대 배율. 드래그·휠·역 선택으로 바뀐다.
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const dragRef = useRef<{ startX: number; startY: number; startCenter: { x: number; y: number } } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadSubwayLineMap()
      .then((data) => {
        if (cancelled) return;
        setLineMap(data);
        // 최초 로드 시 화면 중심을 지도 한가운데로 잡아 둔다 (선택한 역이 있으면 아래 effect가 덮어쓴다).
        setCenter({ x: (data.bounds.minX + data.bounds.maxX) / 2, y: (data.bounds.minY + data.bounds.maxY) / 2 });
      })
      .catch(() => !cancelled && setMapError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  // 선택한 역이 바뀌면 그 역으로 화면 중심을 옮긴다 (기존 rail의 scrollIntoView 대응).
  useEffect(() => {
    if (!lineMap || !selectedStationId) return;
    const station = lineMap.stations.get(selectedStationId);
    if (!station) return;
    const task = window.setTimeout(() => setCenter({ x: station.x, y: station.y }), 0);
    return () => window.clearTimeout(task);
  }, [lineMap, selectedStationId]);

  const zoomAt = useCallback((factor: number) => {
    setScale((current) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, current * factor)));
  }, []);

  // 휠 확대·축소는 preventDefault가 필요해서 React onWheel이 아니라 직접 리스너로 붙인다
  // (그렇지 않으면 페이지 전체가 같이 스크롤된다).
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomAt(event.deltaY < 0 ? 1.15 : 1 / 1.15);
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [zoomAt]);

  function handlePointerDown(event: React.PointerEvent<SVGSVGElement>) {
    // 포인터 캡처는 "요소 밖으로 나가도 드래그가 이어지게" 해주는 부가 기능이라,
    // 실패해도(예: 이미 해제된 포인터) 드래그 시작 자체는 막지 않는다.
    try {
      (event.target as Element).setPointerCapture(event.pointerId);
    } catch {
      // 캡처 실패는 무시한다 — 없어도 창 안에서의 드래그는 정상 동작한다.
    }
    dragRef.current = { startX: event.clientX, startY: event.clientY, startCenter: center };
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const drag = dragRef.current;
    if (!drag || !svgRef.current) return;
    // 화면 픽셀 1칸이 지도 좌표로 얼마인지: (뷰박스 폭 ÷ 화면 픽셀 폭).
    const rect = svgRef.current.getBoundingClientRect();
    const viewBoxWidth = VIEW_SIZE / scale;
    const pxToMap = viewBoxWidth / rect.width;
    const dx = (event.clientX - drag.startX) * pxToMap;
    const dy = (event.clientY - drag.startY) * pxToMap;
    setCenter({ x: drag.startCenter.x - dx, y: drag.startCenter.y - dy });
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  const half = VIEW_SIZE / scale / 2;
  const viewBox = `${center.x - half} ${center.y - half} ${half * 2} ${half * 2}`;

  const routeIndexByStation = useMemo(() => {
    const map = new Map<string, number>();
    routeStationIds.forEach((id, index) => map.set(id, index));
    return map;
  }, [routeStationIds]);

  return <section className="subwayRouteBoard" aria-label="지하철 경로 선택">
    <header className="subwayBoardHeader">
      <div>
        <p className="eyebrow">TIMETABLE ROUTE</p>
        <h2>시간표로 만드는 지하철 경로</h2>
        <p>노선도에서 역을 고르고 오른쪽 아래 추가 버튼을 누르세요. 첫 역은 출발, 마지막 역은 도착, 사이는 경유역이 됩니다.</p>
      </div>
      <div className="subwayDepartureInput" aria-live="polite"><Clock3 size={15} aria-hidden /><span>현재 시각</span><time>{departureTime || "--:--"}</time></div>
    </header>

    <div className="subwaySelectedRoute" aria-live="polite">
      <div className="subwaySelectedTopline"><strong>선택한 경로</strong>{routeStationIds.length ? <button type="button" onClick={onResetRoute}><RotateCcw size={14} aria-hidden /> 초기화</button> : null}</div>
      {routeStationIds.length ? <ol>
        {routeStationIds.map((stationId, index) => {
          const station = stationsById.get(stationId);
          const scheduled = schedule?.stops.find((item) => item.id === stationId);
          return <li key={stationId} className={routeRole(index, routeStationIds.length)}>
            <span>{routeRole(index, routeStationIds.length)}</span>
            <strong>{station?.name ?? "선택한 역"}역</strong>
            {scheduled ? <time>{scheduled.time}</time> : null}
            <button type="button" aria-label={`${station?.name ?? "선택한"}역 경로에서 삭제`} onClick={() => onRemoveRouteStation(stationId)}><X size={14} aria-hidden /></button>
          </li>;
        })}
      </ol> : <p className="subwayRouteEmpty">아직 추가한 역이 없습니다. 노선 위에서 역을 고른 뒤 파란 버튼을 눌러주세요.</p>}
      {scheduleStatus === "loading" ? <p className="subwayScheduleState">DB 시간표에서 같은 열차 번호를 찾는 중…</p> : null}
      {scheduleStatus === "success" && schedule ? <div className="subwayScheduleSummary"><TrainFront size={17} aria-hidden /><span>{schedule.departureTime} 출발</span><i /><strong>{schedule.arrivalTime} 도착</strong><small>{schedule.durationMinutes}분 · 열차 {schedule.legs.map((leg) => leg.trainNo).join(" → ")}</small></div> : null}
      {scheduleStatus === "error" && scheduleError ? <p className="subwayScheduleError">{scheduleError}</p> : null}
    </div>

    <div className="subwayRailViewport" ref={viewportRef}>
      {mapError || (!stations.length && !stationsLoading) ? <div className="subwayStationEmpty" role="status">
        <TrainFront size={24} aria-hidden />
        <strong>{stationsLoading ? "공식 API에서 역을 불러오는 중입니다" : "역 정보를 불러오지 못했습니다"}</strong>
        <p>{stationsLoading ? "잠시만 기다려 주세요." : "백엔드 연결을 확인한 뒤 다시 시도해 주세요."}</p>
        {!stationsLoading ? <button type="button" onClick={onRetryStations}>역 다시 불러오기</button> : null}
      </div> : !lineMap ? <div className="subwayStationEmpty" role="status">
        <TrainFront size={24} aria-hidden />
        <strong>노선도를 그리는 중입니다</strong>
      </div> : <>
        <svg
          ref={svgRef}
          className="subwayLineMapSvg"
          viewBox={viewBox}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          role="img"
          aria-label="1·2·4호선 노선도"
        >
          {lineMap.edges.map((edge, index) => {
            const from = lineMap.stations.get(edge.from);
            const to = lineMap.stations.get(edge.to);
            if (!from || !to) return null;
            return <line
              key={`${edge.line}-${edge.from}-${edge.to}-${index}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={REAL_LINE_META[edge.line].color}
              strokeWidth={0.9}
              strokeLinecap="round"
            />;
          })}
          {[...lineMap.stations.values()].map((station) => {
            const isTransfer = station.lines.length > 1;
            const isSelected = station.stationId === selectedStationId;
            const routeIndex = routeIndexByStation.get(station.stationId);
            const color = REAL_LINE_META[station.lines[0]].color;
            const radius = isTransfer ? 2.2 : 1.3;
            return <g
              key={station.stationId}
              onClick={() => onSelectStation(station.stationId)}
              className="subwayMapStation"
              data-station-id={station.stationId}
              data-station-name={station.name}
              transform={`translate(${station.x} ${station.y})`}
            >
              <circle r={radius + 1.6} fill="transparent" />
              <circle
                r={radius}
                fill={isTransfer ? "white" : color}
                stroke={color}
                strokeWidth={isTransfer ? 0.7 : 0}
              />
              {isSelected ? <circle r={radius + 2} fill="none" stroke={color} strokeWidth={0.6} /> : null}
              {routeIndex !== undefined ? <>
                <circle r={2.6} fill={color} stroke="white" strokeWidth={0.5} />
                <text textAnchor="middle" dominantBaseline="central" fontSize={2.6} fill="white" fontWeight={700}>{routeIndex + 1}</text>
              </> : null}
              {isSelected || isTransfer ? <text x={radius + 2} y={0.9} fontSize={3} fill="#101828" fontWeight={isSelected ? 700 : 600}>{station.name}</text> : null}
            </g>;
          })}
        </svg>
        <div className="subwayMapControls">
          <button type="button" onClick={() => zoomAt(1.3)} aria-label="확대"><Plus size={16} aria-hidden /></button>
          <button type="button" onClick={() => zoomAt(1 / 1.3)} aria-label="축소"><Minus size={16} aria-hidden /></button>
        </div>
      </>}
    </div>

    <footer className="subwayBoardFooter">
      <span><i style={{ background: REAL_LINE_META.line1.color }} /> 1호선</span>
      <span><i style={{ background: REAL_LINE_META.line2.color }} /> 2호선</span>
      <span><i style={{ background: REAL_LINE_META.line4.color }} /> 4호선</span>
      <span>시간표가 없는 구간은 임의로 추정하지 않습니다.</span>
    </footer>
  </section>;
}
