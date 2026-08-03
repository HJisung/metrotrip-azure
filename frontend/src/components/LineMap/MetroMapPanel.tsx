import type { KeyboardEvent, PointerEvent, WheelEvent } from 'react';
import { useRef, useState } from 'react';
import { LINE1_MAP_VIEWBOX, LINE1_STATION_LAYOUT } from '../../data/line1MapLayout';
import type { Station } from '../../types/station';
import { Icon } from '../Icon';

type MetroMapPanelProps = {
  stations: Station[];
  selected: Station | null;
  onSelect: (station: Station) => void;
};

type PositionedStation = Station & {
  x: number;
  y: number;
  labelPosition: 'above' | 'below';
};

type Point = { x: number; y: number };
type Viewport = { x: number; y: number; scale: number };

const INITIAL_VIEWPORT: Viewport = { x: 0, y: 0, scale: 0.88 };
const MIN_SCALE = 0.7;
const MAX_SCALE = 2.8;

const BACKGROUND_ROADS = [
  'M 40 130 C 280 70 430 150 610 100 S 980 80 1300 145',
  'M 20 500 C 230 430 420 510 650 465 S 1040 430 1320 505',
  'M 150 30 C 210 180 190 370 270 590',
  'M 530 20 C 470 180 570 360 500 600',
  'M 930 20 C 850 190 960 360 900 600',
];

const BACKGROUND_BLOCKS = [
  { x: 80, y: 180, width: 180, height: 80 },
  { x: 330, y: 390, width: 180, height: 90 },
  { x: 720, y: 100, width: 170, height: 75 },
  { x: 1030, y: 455, width: 200, height: 85 },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getStationsWithLayout(stations: Station[]): PositionedStation[] {
  const stationByName = new Map(stations.map((station) => [station.name, station]));

  return LINE1_STATION_LAYOUT.flatMap((layout) => {
    const station = stationByName.get(layout.stationName);
    return station ? [{ ...station, ...layout }] : [];
  });
}

function getRoutePath(stations: PositionedStation[]) {
  return stations
    .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`)
    .join(' ');
}

function getLocalPoint(
  event: { clientX: number; clientY: number },
  element: SVGSVGElement,
): Point {
  const rect = element.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function getDistance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getCenter(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function handleStationKeyDown(
  event: KeyboardEvent<SVGGElement>,
  station: Station,
  onSelect: (station: Station) => void,
) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  onSelect(station);
}

/** 1호선 천안·아산 구간의 레이어형 인터랙티브 SVG 약도 */
export function MetroMapPanel({ stations, selected, onSelect }: MetroMapPanelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pointersRef = useRef(new Map<number, Point>());
  const dragRef = useRef<{ start: Point; viewport: Viewport } | null>(null);
  const pinchRef = useRef<{
    distance: number;
    center: Point;
    viewport: Viewport;
  } | null>(null);
  const [viewport, setViewport] = useState(INITIAL_VIEWPORT);
  const positions = getStationsWithLayout(stations);
  const routePath = getRoutePath(positions);

  const zoomAt = (nextScale: number, point: Point) => {
    setViewport((current) => {
      const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
      const ratio = scale / current.scale;
      return {
        scale,
        x: point.x - (point.x - current.x) * ratio,
        y: point.y - (point.y - current.y) * ratio,
      };
    });
  };

  const onWheel = (event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const point = getLocalPoint(event, svg);
    zoomAt(viewport.scale * (event.deltaY < 0 ? 1.12 : 0.89), point);
  };

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    const target = event.target as Element;
    if (target.closest('[data-station-id]')) return;

    const svg = svgRef.current;
    if (!svg) return;
    const point = getLocalPoint(event, svg);
    pointersRef.current.set(event.pointerId, point);
    svg.setPointerCapture(event.pointerId);

    if (pointersRef.current.size === 2) {
      const [first, second] = [...pointersRef.current.values()];
      pinchRef.current = {
        distance: getDistance(first, second),
        center: getCenter(first, second),
        viewport,
      };
      dragRef.current = null;
    } else {
      dragRef.current = { start: point, viewport };
    }
  };

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || !pointersRef.current.has(event.pointerId)) return;
    const point = getLocalPoint(event, svg);
    pointersRef.current.set(event.pointerId, point);

    if (pointersRef.current.size === 2 && pinchRef.current) {
      const [first, second] = [...pointersRef.current.values()];
      const center = getCenter(first, second);
      const ratio = getDistance(first, second) / pinchRef.current.distance;
      const scale = clamp(pinchRef.current.viewport.scale * ratio, MIN_SCALE, MAX_SCALE);
      setViewport({
        scale,
        x:
          pinchRef.current.viewport.x +
          (center.x - pinchRef.current.center.x) +
          pinchRef.current.center.x -
          (pinchRef.current.center.x - pinchRef.current.viewport.x) *
            (scale / pinchRef.current.viewport.scale),
        y:
          pinchRef.current.viewport.y +
          (center.y - pinchRef.current.center.y) +
          pinchRef.current.center.y -
          (pinchRef.current.center.y - pinchRef.current.viewport.y) *
            (scale / pinchRef.current.viewport.scale),
      });
      return;
    }

    if (!dragRef.current) return;
    setViewport({
      ...dragRef.current.viewport,
      x: dragRef.current.viewport.x + point.x - dragRef.current.start.x,
      y: dragRef.current.viewport.y + point.y - dragRef.current.start.y,
    });
  };

  const onPointerUp = (event: PointerEvent<SVGSVGElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) dragRef.current = null;
    svgRef.current?.releasePointerCapture(event.pointerId);
  };

  const resetViewport = () => setViewport(INITIAL_VIEWPORT);

  if (stations.length === 0) {
    return (
      <p className="rounded-lg border border-outline-variant p-lg text-body-md text-on-surface-variant">
        노선 정보를 불러오는 중입니다.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-sm">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <p className="text-body-md text-on-surface-variant">
          드래그해서 이동하고, 휠 또는 두 손가락으로 확대·축소할 수 있습니다.
        </p>
        <div className="flex items-center gap-xs">
          <button
            type="button"
            onClick={() => zoomAt(viewport.scale / 1.25, { x: 670, y: 310 })}
            aria-label="노선도 축소"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container"
          >
            <Icon name="remove" className="text-[20px]" />
          </button>
          <button
            type="button"
            onClick={() => zoomAt(viewport.scale * 1.25, { x: 670, y: 310 })}
            aria-label="노선도 확대"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container"
          >
            <Icon name="add" className="text-[20px]" />
          </button>
          <button
            type="button"
            onClick={resetViewport}
            className="flex h-9 items-center gap-xs rounded-lg border border-outline-variant px-sm text-body-md text-on-surface-variant hover:bg-surface-container"
          >
            <Icon name="fit_screen" className="text-[18px]" />
            초기화
          </button>
        </div>
      </div>

      <div className="metro-map-surface overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${LINE1_MAP_VIEWBOX.width} ${LINE1_MAP_VIEWBOX.height}`}
          className="block h-[min(62vh,620px)] min-h-[360px] w-full select-none"
          role="group"
          aria-label="1호선 천안·아산 구간 약도"
          style={{ touchAction: 'none', cursor: dragRef.current ? 'grabbing' : 'grab' }}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <title>1호선 천안·아산 구간 약도</title>
          <desc>11개 역을 선택할 수 있는 인터랙티브 SVG 노선도입니다.</desc>

          <g className="metro-map-background" aria-hidden="true">
            {BACKGROUND_BLOCKS.map((block) => (
              <rect key={`${block.x}-${block.y}`} {...block} rx="18" />
            ))}
            {BACKGROUND_ROADS.map((path) => (
              <path key={path} d={path} />
            ))}
            <path d="M 80 560 C 310 525 480 570 690 535 S 1040 520 1280 565" />
            <text x="90" y="85">천안·아산 생활권</text>
          </g>

          <g
            className="metro-map-viewport"
            transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}
          >
            <g className="metro-map-route-layer" aria-label="1호선 노선">
              <path d={routePath} className="metro-map-route-halo" />
              <path d={routePath} className="metro-map-route" />
            </g>

            <g className="metro-map-station-layer" aria-label="역">
              {positions.map((station) => {
                const isSelected = selected?.name === station.name;
                return (
                  <g
                    key={station.name}
                    data-station-id={station.name}
                    className={`metro-station${isSelected ? ' selected' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${station.name}, ${station.line}`}
                    aria-pressed={isSelected}
                    onClick={() => onSelect(station)}
                    onKeyDown={(event) =>
                      handleStationKeyDown(event, station, onSelect)
                    }
                  >
                    {isSelected && (
                      <circle
                        cx={station.x}
                        cy={station.y}
                        r="27"
                        className="metro-station-selected-ring"
                      />
                    )}
                    <circle cx={station.x} cy={station.y} r="15" className="metro-station-dot" />
                  </g>
                );
              })}
            </g>

            <g className="metro-map-label-layer" aria-label="역 이름">
              {positions.map((station) => (
                <text
                  key={station.name}
                  x={station.x}
                  y={station.y + (station.labelPosition === 'above' ? -34 : 52)}
                  textAnchor="middle"
                  className={`metro-station-label${selected?.name === station.name ? ' selected' : ''}`}
                >
                  {station.name}
                </text>
              ))}
            </g>
          </g>
        </svg>
      </div>

      {selected && (
        <aside className="rounded-xl border border-primary/40 bg-primary/5 p-md" aria-live="polite">
          <div className="flex items-start justify-between gap-md">
            <div>
              <p className="text-label-caps text-primary">선택한 역</p>
              <h2 className="mt-xs text-headline-sm text-on-surface">{selected.name}</h2>
              <p className="text-body-md text-on-surface-variant">{selected.line}</p>
            </div>
            <Icon name="location_on" className="text-primary" />
          </div>
          <p className="mt-sm text-body-md text-on-surface-variant">
            위도 {selected.lat.toFixed(5)} · 경도 {selected.lng.toFixed(5)}
          </p>
        </aside>
      )}
    </div>
  );
}
