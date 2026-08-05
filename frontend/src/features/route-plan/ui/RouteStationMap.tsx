import { useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Station } from '../../../shared/types/station';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { Icon } from '../../../shared/ui/Icon';
import { useLineMapViewport } from '../../line-map/hooks/useLineMapViewport';
import type { LineOrder } from '../lib/findRoutes';
import { projectStations, type ProjectedStation } from '../lib/projectStations';

/**
 * 출발·도착역을 고르는 지하철 지도 (docs/SPEC.md 2-2 R1).
 *
 * 카카오·네이버 지하철처럼 역을 누르면 그 자리에 말풍선이 뜨고
 * 출발/도착을 고른다.
 *
 * 역 위치는 위경도를 투영해서 만들기 때문에(`lib/projectStations.ts`)
 * 노선이 늘어나도 좌표를 따로 찍지 않아도 된다.
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

/**
 * 말풍선 크기 (화면 픽셀 기준).
 * SVG 단위로 바꿔서 쓰므로 화면이 좁아져도 크기가 유지된다.
 */
const BUBBLE_PX = { width: 148, height: 58, gap: 14 };

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
  const viewportState = useLineMapViewport();
  const {
    svgRef,
    viewport,
    dragging,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    zoomAt,
    resetViewport,
  } = viewportState;

  const [openStation, setOpenStation] = useState<string | null>(null);

  /**
   * viewBox 1단위가 화면에서 몇 픽셀인지.
   *
   * 지도는 폭에 맞춰 축소되므로, 좁은 화면에서는 글자와 점이 같이 작아져
   * 360px 폭에서 역 이름이 6px 까지 줄어든다.
   * 그래서 렌더 배율을 재서 글자·점 크기를 화면 기준으로 되돌린다.
   */
  const [fit, setFit] = useState(1);

  // 역 목록이 바뀌면(= 노선 데이터 교체) 열려 있던 말풍선을 닫는다.
  useEffect(() => {
    setOpenStation(null);
  }, [stations]);

  const { stations: positioned, viewBox } = projectStations(stations);

  useEffect(() => {
    const element = svgRef.current;
    if (!element) return;

    const measure = () => {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      // preserveAspectRatio 기본값(meet)은 가로·세로 중 작은 배율을 쓴다.
      setFit(
        Math.min(rect.width / viewBox.width, rect.height / viewBox.height),
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [svgRef, viewBox.width, viewBox.height]);

  /** 화면 픽셀 크기를 SVG 단위로 바꾼다. */
  const u = (px: number) => px / (fit || 1);
  const BUBBLE = {
    width: u(BUBBLE_PX.width),
    height: u(BUBBLE_PX.height),
    gap: u(BUBBLE_PX.gap),
  };
  const positionByName = new Map(
    positioned.map((station) => [station.name, station]),
  );

  const routePoints = routeStationNames
    .map((name) => positionByName.get(name))
    .filter((station): station is ProjectedStation => Boolean(station));

  const onRoute = new Set(routeStationNames);
  const opened = openStation ? positionByName.get(openStation) : undefined;

  if (positioned.length === 0) {
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

  // 위쪽 공간이 부족하면 말풍선을 역 아래로 뒤집는다.
  const bubbleAbove = opened
    ? opened.y - BUBBLE.height - BUBBLE.gap > 0
    : true;
  const bubbleY = opened
    ? bubbleAbove
      ? opened.y - BUBBLE.height - BUBBLE.gap
      : opened.y + BUBBLE.gap
    : 0;
  const bubbleX = opened ? opened.x - BUBBLE.width / 2 : 0;

  return (
    <div className="flex flex-col gap-sm">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <p className="text-body-md text-on-surface-variant">
          역을 눌러 출발·도착을 정하세요. 드래그로 이동, 휠·핀치로 확대됩니다.
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
            onClick={() =>
              zoomAt(viewport.scale / 1.25, {
                x: viewBox.width / 2,
                y: viewBox.height / 2,
              })
            }
            aria-label="지도 축소"
          >
            <Icon name="remove" className="text-[20px]" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() =>
              zoomAt(viewport.scale * 1.25, {
                x: viewBox.width / 2,
                y: viewBox.height / 2,
              })
            }
            aria-label="지도 확대"
          >
            <Icon name="add" className="text-[20px]" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={resetViewport}>
            <Icon name="fit_screen" className="text-[18px]" />
            초기화
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-outline-variant/70">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
          className="block h-[min(68vh,640px)] min-h-[380px] w-full select-none"
          role="group"
          aria-label="출발·도착역을 고르는 지하철 지도"
          style={{ touchAction: 'none', cursor: dragging ? 'grabbing' : 'grab' }}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={() => setOpenStation(null)}
        >
          <title>출발·도착역을 고르는 지하철 지도</title>
          <desc>
            역을 클릭하거나 포커스한 뒤 Enter 를 누르면 출발·도착으로 지정할 수
            있습니다.
          </desc>

          <g
            transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}
          >
            {/* 노선 — 순서대로 이은 선 */}
            <g aria-label="노선">
              {Object.entries(lineOrder).map(([line, names]) => {
                const points = names
                  .map((name) => positionByName.get(name))
                  .filter((station): station is ProjectedStation =>
                    Boolean(station),
                  );
                if (points.length < 2) return null;
                return (
                  <path
                    key={line}
                    d={toPath(points)}
                    fill="none"
                    stroke="var(--color-outline-variant)"
                    strokeWidth={u(6)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })}
            </g>

            {/* 확정된 경로 강조 */}
            {routePoints.length > 1 && (
              <path
                d={toPath(routePoints)}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth={u(6)}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              />
            )}

            {/* 역 */}
            <g aria-label="역">
              {positioned.map((station, index) => {
                const isFrom = station.name === fromName;
                const isTo = station.name === toName;
                const isOnRoute = onRoute.has(station.name);
                const radius = isFrom || isTo ? u(9) : u(6);

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
                    {/*
                      역 원만으로는 손가락으로 누르기 작아서,
                      보이지 않는 원을 겹쳐 클릭 영역만 넓힌다.
                      너무 키우면 지도를 끄는 동작을 방해하므로 적당히 둔다.
                    */}
                    <circle
                      cx={station.x}
                      cy={station.y}
                      r={u(20)}
                      fill="transparent"
                    />
                    <circle
                      cx={station.x}
                      cy={station.y}
                      r={radius}
                      style={{
                        fill,
                        stroke: 'var(--color-primary)',
                        strokeWidth: u(2.5),
                        pointerEvents: 'none',
                      }}
                    />
                    <text
                      x={station.x}
                      y={station.y + (index % 2 === 0 ? u(-16) : u(24))}
                      textAnchor="middle"
                      style={{
                        fill: 'var(--color-on-surface)',
                        fontSize: u(12),
                        fontWeight: isFrom || isTo ? 800 : 600,
                        pointerEvents: 'none',
                      }}
                    >
                      {station.name}
                    </text>
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
                  rx={u(8)}
                  style={{
                    fill: 'var(--color-surface-bright)',
                    stroke: 'var(--color-outline-variant)',
                    strokeWidth: u(1),
                    filter: `drop-shadow(0 ${u(3)}px ${u(8)}px rgb(0 0 0 / 0.18))`,
                  }}
                />
                {/* 역을 가리키는 꼬리 */}
                <path
                  d={
                    bubbleAbove
                      ? `M ${opened.x - u(7)} ${bubbleY + BUBBLE.height} L ${opened.x} ${bubbleY + BUBBLE.height + u(9)} L ${opened.x + u(7)} ${bubbleY + BUBBLE.height} Z`
                      : `M ${opened.x - u(7)} ${bubbleY} L ${opened.x} ${bubbleY - u(9)} L ${opened.x + u(7)} ${bubbleY} Z`
                  }
                  style={{ fill: 'var(--color-surface-bright)' }}
                />

                <text
                  x={opened.x}
                  y={bubbleY + u(17)}
                  textAnchor="middle"
                  style={{
                    fill: 'var(--color-on-surface)',
                    fontSize: u(13),
                    fontWeight: 700,
                  }}
                >
                  {opened.name}
                </text>

                {(['from', 'to'] as const).map((kind, index) => {
                  const label = kind === 'from' ? '출발' : '도착';
                  const width = u(60);
                  const x = opened.x + (index === 0 ? -width - u(3) : u(3));
                  const y = bubbleY + u(26);
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
                        height={u(22)}
                        rx={u(7)}
                        style={{
                          fill:
                            kind === 'from'
                              ? 'var(--color-primary)'
                              : 'var(--color-secondary-container)',
                        }}
                      />
                      <text
                        x={x + width / 2}
                        y={y + u(15)}
                        textAnchor="middle"
                        style={{
                          fill:
                            kind === 'from'
                              ? 'var(--color-on-primary)'
                              : 'var(--color-on-secondary-container)',
                          fontSize: u(11),
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
