import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Station } from '../../../shared/types/station';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { Icon } from '../../../shared/ui/Icon';
import { useLineMapViewport } from '../../line-map/hooks/useLineMapViewport';
import type { LineOrder } from '../lib/findRoutes';
import { layoutSchematic } from '../lib/schematicLayout';

/**
 * 출발·도착역을 고르는 지하철 노선도 (docs/SPEC.md 2-2 R1).
 *
 * 카카오·네이버 지하철처럼 역을 누르면 그 자리에 말풍선이 뜨고
 * 출발/도착을 고른다.
 *
 * 역은 `lib/schematicLayout.ts` 가 **등간격 도식**으로 배치한다.
 * 위경도 그대로 찍으면 역이 촘촘한 구간에서 간격이 몇 px 로 줄어 못 누른다.
 *
 * 좌표는 화면 픽셀 단위이고, 지도는 카드보다 넓다. 끌어서 보는 것이 전제다.
 * 드래그·확대 처리는 노선도 화면과 같은 훅을 재사용한다.
 */

type PickKind = 'from' | 'to';

type RouteStationMapProps = {
  stations: Station[];
  lineOrder: LineOrder;
  fromName: string;
  toName: string;
  /** 확정된 경로의 역 이름(순서대로). 지도에 굵게 강조한다. */
  routeStationNames: string[];
  onPick: (stationName: string, kind: PickKind) => void;
  onSwap: () => void;
};

/** 말풍선 크기 (픽셀) */
const BUBBLE = { width: 148, height: 58, gap: 16 };

/** 역 라벨 크기 (픽셀) */
const LABEL_SIZE = 12;

function toPath(points: { x: number; y: number }[]) {
  return points
    .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`)
    .join(' ');
}

export function RouteStationMap({
  stations,
  lineOrder,
  fromName,
  toName,
  routeStationNames,
  onPick,
  onSwap,
}: RouteStationMapProps) {
  const {
    svgRef,
    viewport,
    dragging,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    zoomAt,
    centerOn,
    resetViewport,
  } = useLineMapViewport();

  const [openStation, setOpenStation] = useState<string | null>(null);

  /**
   * 보이는 영역 크기(픽셀).
   *
   * viewBox 를 이 값으로 두면 SVG 1단위가 화면 1픽셀이 되어,
   * 글자·점 크기를 배율로 환산할 필요가 없어진다.
   */
  const [viewSize, setViewSize] = useState({ width: 800, height: 480 });

  const layout = useMemo(
    () => layoutSchematic(stations, lineOrder),
    [stations, lineOrder],
  );

  const positionByName = useMemo(
    () => new Map(layout.stations.map((station) => [station.name, station])),
    [layout],
  );

  useEffect(() => {
    setOpenStation(null);
  }, [stations]);

  useEffect(() => {
    // ResizeObserver 를 <svg> 에 직접 붙이면 브라우저에 따라 크기 변화를
    // 알려주지 않는다(replaced element). 감싸는 div 를 대신 관측한다.
    const element = svgRef.current;
    const container = element?.parentElement;
    if (!element || !container) return;

    const measure = () => {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setViewSize({ width: rect.width, height: rect.height });
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [svgRef]);

  // 고른 역이 바뀌면 그 역으로 시선을 옮긴다. 지도가 화면보다 넓기 때문이다.
  useEffect(() => {
    const station = positionByName.get(fromName);
    if (station) centerOn(station);
  }, [fromName, positionByName, centerOn]);

  useEffect(() => {
    const station = positionByName.get(toName);
    if (station) centerOn(station);
  }, [toName, positionByName, centerOn]);

  const onRoute = new Set(routeStationNames);
  const opened = openStation ? positionByName.get(openStation) : undefined;
  const routePoints = routeStationNames
    .map((name) => positionByName.get(name))
    .filter((station) => station !== undefined);

  /** 확대해도 글자는 화면에서 같은 크기로 남긴다. */
  const labelSize = LABEL_SIZE / viewport.scale;
  const routeKey = routeStationNames.join('>');

  /**
   * 겹치지 않는 라벨만 고른다.
   *
   * 축소해서 많은 역이 한 화면에 들어오면 글자가 서로 겹친다.
   * 중요한 역부터 자리를 잡고, 이미 놓인 라벨과 부딪히면 건너뛴다.
   * 확대하면 간격이 벌어져 더 많은 라벨이 살아난다.
   */
  const visibleLabels = useMemo(() => {
    const onRouteNames = new Set(routeKey ? routeKey.split('>') : []);
    const rank = (name: string) =>
      name === fromName || name === toName ? 0 : onRouteNames.has(name) ? 1 : 2;

    const placed: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const shown = new Set<string>();

    const ordered = [...layout.stations].sort(
      (a, b) => rank(a.name) - rank(b.name),
    );

    for (const station of ordered) {
      // 한글은 글자 하나가 대략 폰트 크기만큼 넓다.
      const halfWidth = (station.name.length * labelSize) / 2;
      const centerY = station.y - labelSize * 1.6;
      const box = {
        x1: station.x - halfWidth,
        y1: centerY - labelSize * 0.7,
        x2: station.x + halfWidth,
        y2: centerY + labelSize * 0.7,
      };

      const collides = placed.some(
        (other) =>
          box.x1 < other.x2 &&
          box.x2 > other.x1 &&
          box.y1 < other.y2 &&
          box.y2 > other.y1,
      );
      if (collides) continue;

      placed.push(box);
      shown.add(station.name);
    }

    return shown;
  }, [layout, fromName, toName, routeKey, labelSize]);

  if (layout.stations.length === 0) {
    return (
      <Card className="p-lg text-body-md text-on-surface-variant">
        노선 정보를 불러오는 중입니다.
      </Card>
    );
  }

  const pick = (kind: PickKind) => {
    if (!opened) return;
    onPick(opened.name, kind);
    setOpenStation(null);
  };

  const onBubbleKeyDown = (
    event: KeyboardEvent<SVGGElement>,
    kind: PickKind,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    pick(kind);
  };

  const onStationKeyDown = (
    event: KeyboardEvent<SVGGElement>,
    stationName: string,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    setOpenStation((current) => (current === stationName ? null : stationName));
  };

  const bubbleY = opened ? opened.y - BUBBLE.height - BUBBLE.gap : 0;
  const bubbleX = opened ? opened.x - BUBBLE.width / 2 : 0;
  const center = { x: viewSize.width / 2, y: viewSize.height / 2 };

  return (
    <div className="flex flex-col gap-sm">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <p className="text-body-md text-on-surface-variant">
          역을 눌러 출발·도착을 정하세요. 좌우로 끌어서 다른 구간을 봅니다.
        </p>
        <div className="flex items-center gap-xs">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSwap}
            aria-label="출발역과 도착역 바꾸기"
          >
            <Icon name="swap_horiz" className="text-[18px]" />
            방향 바꾸기
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => zoomAt(viewport.scale / 1.25, center)}
            aria-label="지도 축소"
          >
            <Icon name="remove" className="text-[20px]" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => zoomAt(viewport.scale * 1.25, center)}
            aria-label="지도 확대"
          >
            <Icon name="add" className="text-[20px]" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              resetViewport();
              const station = positionByName.get(fromName);
              if (station) centerOn(station);
            }}
          >
            <Icon name="my_location" className="text-[18px]" />
            출발역으로
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-outline-variant/70">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewSize.width} ${viewSize.height}`}
          className="block h-[var(--route-map-height)] min-h-0 w-full select-none"
          role="group"
          aria-label="출발·도착역을 고르는 지하철 노선도"
          style={{ touchAction: 'none', cursor: dragging ? 'grabbing' : 'grab' }}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={() => setOpenStation(null)}
        >
          <title>출발·도착역을 고르는 지하철 노선도</title>
          <desc>
            역을 클릭하거나 포커스한 뒤 Enter 를 누르면 출발·도착으로 지정할 수
            있습니다.
          </desc>

          <g
            transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}
          >
            <g aria-label="노선">
              {layout.paths.map(({ line, points }) =>
                points.length < 2 ? null : (
                  <path
                    key={line}
                    d={toPath(points)}
                    fill="none"
                    stroke="var(--color-outline-variant)"
                    strokeWidth={8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ),
              )}
            </g>

            {routePoints.length > 1 && (
              <path
                d={toPath(routePoints)}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth={8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              />
            )}

            <g aria-label="역">
              {layout.stations.map((station) => {
                const isFrom = station.name === fromName;
                const isTo = station.name === toName;
                const isOnRoute = onRoute.has(station.name);
                const radius = isFrom || isTo ? 11 : 7;

                const fill = isFrom
                  ? 'var(--color-primary)'
                  : isTo
                    ? 'var(--color-tertiary-fixed-dim)'
                    : isOnRoute
                      ? 'var(--color-primary-container)'
                      : 'var(--color-surface-bright)';

                return (
                  <g
                    key={station.name}
                    data-station-id={station.name}
                    className="metro-station"
                    role="button"
                    tabIndex={0}
                    aria-label={`${station.name}, ${station.line}${
                      isFrom ? ', 출발역' : isTo ? ', 도착역' : ''
                    }`}
                    aria-expanded={openStation === station.name}
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenStation((current) =>
                        current === station.name ? null : station.name,
                      );
                    }}
                    onKeyDown={(event) => onStationKeyDown(event, station.name)}
                  >
                    {/* 손가락으로도 누를 수 있도록 보이지 않는 클릭 영역을 겹친다 */}
                    <circle
                      cx={station.x}
                      cy={station.y}
                      r={20}
                      fill="transparent"
                    />
                    <circle
                      cx={station.x}
                      cy={station.y}
                      r={radius}
                      style={{
                        fill,
                        stroke: 'var(--color-primary)',
                        strokeWidth: 3,
                        pointerEvents: 'none',
                      }}
                    />
                    {visibleLabels.has(station.name) && (
                      <text
                        x={station.x}
                        y={station.y - labelSize * 1.6}
                        textAnchor="middle"
                        style={{
                          fill: isOnRoute
                            ? 'var(--color-on-surface)'
                            : 'var(--color-on-surface-variant)',
                          fontSize: labelSize,
                          fontWeight: isFrom || isTo ? 800 : 600,
                          pointerEvents: 'none',
                          paintOrder: 'stroke',
                          stroke: 'var(--color-surface-bright)',
                          strokeWidth: labelSize * 0.3,
                          strokeLinejoin: 'round',
                        }}
                      >
                        {station.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            {/* 역을 누르면 뜨는 말풍선 — 출발/도착 지정 */}
            {opened && (
              <g
                onClick={(event) => event.stopPropagation()}
                aria-label={`${opened.name} 지정`}
              >
                <rect
                  x={bubbleX}
                  y={bubbleY}
                  width={BUBBLE.width}
                  height={BUBBLE.height}
                  rx={10}
                  style={{
                    fill: 'var(--color-surface-bright)',
                    stroke: 'var(--color-outline-variant)',
                    strokeWidth: 1.5,
                    filter: 'drop-shadow(0 4px 10px rgb(0 0 0 / 0.22))',
                  }}
                />
                <path
                  d={`M ${opened.x - 7} ${bubbleY + BUBBLE.height} L ${opened.x} ${bubbleY + BUBBLE.height + 9} L ${opened.x + 7} ${bubbleY + BUBBLE.height} Z`}
                  style={{ fill: 'var(--color-surface-bright)' }}
                />

                <text
                  x={opened.x}
                  y={bubbleY + 19}
                  textAnchor="middle"
                  style={{
                    fill: 'var(--color-on-surface)',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {opened.name}
                </text>

                {(['from', 'to'] as const).map((kind, index) => {
                  const label = kind === 'from' ? '출발' : '도착';
                  const width = 60;
                  const x = opened.x + (index === 0 ? -width - 3 : 3);
                  const y = bubbleY + 27;
                  return (
                    <g
                      key={kind}
                      className="metro-station"
                      role="button"
                      tabIndex={0}
                      aria-label={`${opened.name}을 ${label}역으로 지정`}
                      onClick={() => pick(kind)}
                      onKeyDown={(event) => onBubbleKeyDown(event, kind)}
                    >
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={22}
                        rx={7}
                        style={{
                          fill:
                            kind === 'from'
                              ? 'var(--color-primary)'
                              : 'var(--color-secondary-container)',
                        }}
                      />
                      <text
                        x={x + width / 2}
                        y={y + 15}
                        textAnchor="middle"
                        style={{
                          fill:
                            kind === 'from'
                              ? 'var(--color-on-primary)'
                              : 'var(--color-on-secondary-container)',
                          fontSize: 11,
                          fontWeight: 700,
                          pointerEvents: 'none',
                        }}
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </g>
        </svg>
      </Card>
    </div>
  );
}
