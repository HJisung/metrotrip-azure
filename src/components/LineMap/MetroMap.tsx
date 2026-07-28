import { useState } from 'react';
import {
  METRO_LINES,
  METRO_VIEWBOX,
  type MetroLine,
} from '../../data/metroLines';

/**
 * 수도권 간략 노선도.
 *
 * 마우스를 올린 노선만 굵고 진하게 띄우고 나머지는 흐리게 만든다.
 * 터치 기기에는 hover가 없으므로, 아래 범례를 눌러서도 같은 강조가 되게 했다.
 */
export function MetroMap() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);

  // 마우스를 올린 노선이 우선, 없으면 눌러서 고정해 둔 노선
  const active = hovered ?? pinned;

  // 강조된 노선을 맨 나중에 그려서 다른 노선 위로 올린다
  const ordered = [...METRO_LINES].sort((a, b) => {
    if (a.id === active) return 1;
    if (b.id === active) return -1;
    return 0;
  });

  return (
    <div className="flex flex-col gap-sm">
      {/* 좁은 화면에서는 글자가 뭉개지므로 가로 스크롤로 넘긴다 */}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${METRO_VIEWBOX.width} ${METRO_VIEWBOX.height}`}
          className="h-auto w-full min-w-[720px]"
          role="img"
          aria-label="수도권 전철 간략 노선도"
          onMouseLeave={() => setHovered(null)}
        >
          {ordered.map((line) => (
            <LineGroup
              key={line.id}
              line={line}
              isActive={active === line.id}
              isDimmed={active !== null && active !== line.id}
              onEnter={() => setHovered(line.id)}
            />
          ))}
        </svg>
      </div>

      {/* 범례 — 터치 기기에서는 이걸 눌러 강조한다 */}
      <div className="flex flex-wrap gap-xs">
        {METRO_LINES.map((line) => {
          const isActive = active === line.id;
          return (
            <button
              key={line.id}
              type="button"
              onMouseEnter={() => setHovered(line.id)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(line.id)}
              onBlur={() => setHovered(null)}
              onClick={() => setPinned(pinned === line.id ? null : line.id)}
              aria-pressed={pinned === line.id}
              className={
                isActive
                  ? 'flex items-center gap-xs rounded-full border px-md py-xs text-body-md font-bold text-on-surface'
                  : 'flex items-center gap-xs rounded-full border border-outline-variant px-md py-xs text-body-md text-on-surface-variant transition-colors hover:bg-surface-container-low'
              }
              style={isActive ? { borderColor: line.color } : undefined}
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: line.color }}
              />
              {line.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type LineGroupProps = {
  line: MetroLine;
  isActive: boolean;
  isDimmed: boolean;
  onEnter: () => void;
};

function LineGroup({ line, isActive, isDimmed, onEnter }: LineGroupProps) {
  return (
    <g
      onMouseEnter={onEnter}
      style={{
        opacity: isDimmed ? 0.16 : 1,
        // fill-box 를 써야 노선 자기 자신의 가운데를 기준으로 커진다
        transformBox: 'fill-box',
        transformOrigin: 'center',
        transform: isActive ? 'scale(1.03)' : undefined,
        transition: 'opacity 180ms ease, transform 180ms ease',
        cursor: 'pointer',
      }}
    >
      {/* 선이 얇아서 그대로는 마우스를 올리기 어렵다. 투명한 굵은 선을 깔아 둔다 */}
      <path
        d={line.path}
        fill="none"
        stroke="transparent"
        strokeWidth={26}
        strokeLinecap="round"
      />
      <path
        d={line.path}
        fill="none"
        stroke={line.color}
        strokeWidth={isActive ? 9 : 6}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: 'stroke-width 180ms ease' }}
      />

      {line.stations.map((station) => (
        <circle
          key={station.name}
          cx={station.x}
          cy={station.y}
          r={station.transfer ? 6 : 4}
          fill={station.transfer ? '#ffffff' : line.color}
          stroke={line.color}
          strokeWidth={station.transfer ? 3 : 2}
        />
      ))}

      {/*
        역 이름은 강조된 노선에만 띄운다.
        9개 노선 이름을 한꺼번에 그리면 도심 쪽에서 글자가 서로 겹쳐 못 읽는다.
      */}
      {isActive &&
        line.stations.map((station) => {
          // 오른쪽 끝에 있는 역은 글자가 화면 밖으로 나가므로 왼쪽에 붙인다
          const labelOnLeft = station.x > 700;
          return (
            <text
              key={station.name}
              x={labelOnLeft ? station.x - 11 : station.x + 11}
              y={station.y + 4}
              textAnchor={labelOnLeft ? 'end' : 'start'}
              fontSize={13}
              fontWeight={700}
              fill="#041b3c"
              // 선 위에 글자가 겹쳐도 읽히도록 흰 테두리를 두른다
              stroke="#ffffff"
              strokeWidth={3.5}
              paintOrder="stroke"
            >
              {station.name}
            </text>
          );
        })}

      {/* 노선 번호 뱃지 — 강조하지 않아도 어느 선인지 알 수 있게 시작점에 둔다 */}
      <g>
        <circle
          cx={line.stations[0].x}
          cy={line.stations[0].y}
          r={11}
          fill={line.color}
          stroke="#ffffff"
          strokeWidth={2}
        />
        <text
          x={line.stations[0].x}
          y={line.stations[0].y + 4}
          textAnchor="middle"
          fontSize={12}
          fontWeight={700}
          fill="#ffffff"
        >
          {line.id}
        </text>
      </g>
    </g>
  );
}
