import { useState } from 'react';
import { Icon } from '../Icon';
import { MetroMap } from './MetroMap';
import { asset } from '../../lib/asset';

/** public/ 에 넣어 둔 수도권 노선도 이미지 파일명 */
const MAP_IMAGE = 'metro-map.png';

type Mode = 'image' | 'interactive';

/**
 * 수도권 노선도 패널.
 *
 * 기본은 공식 노선도 이미지를 보여주고, 필요하면 직접 그린 SVG 노선도로 바꿔 볼 수 있다.
 * 이미지는 역이 다 들어 있어 정확하지만 마우스를 올려도 반응하지 않고,
 * SVG 는 역이 일부만 있지만 노선을 강조해 볼 수 있다. 둘 다 쓸모가 있어 함께 둔다.
 *
 * public/metro-map.png 가 아직 없으면 자동으로 SVG 쪽으로 넘어간다.
 */
export function MetroMapPanel() {
  const [mode, setMode] = useState<Mode>('image');
  const [imageMissing, setImageMissing] = useState(false);
  // 화면 폭에 맞추면 역 이름이 너무 작아서, 크게 보기(가로 스크롤)를 함께 둔다
  const [zoomed, setZoomed] = useState(false);

  const showImage = mode === 'image' && !imageMissing;

  return (
    <div className="flex flex-col gap-sm">
      <div className="flex flex-wrap items-center gap-sm">
        <div className="flex gap-xs rounded-lg border border-outline-variant p-xs">
          <button
            type="button"
            onClick={() => setMode('image')}
            disabled={imageMissing}
            aria-pressed={showImage}
            className={
              showImage
                ? 'rounded-md bg-primary px-md py-xs text-label-caps text-on-primary'
                : 'rounded-md px-md py-xs text-label-caps text-on-surface-variant disabled:opacity-40'
            }
          >
            전체 노선도
          </button>
          <button
            type="button"
            onClick={() => setMode('interactive')}
            aria-pressed={!showImage}
            className={
              !showImage
                ? 'rounded-md bg-primary px-md py-xs text-label-caps text-on-primary'
                : 'rounded-md px-md py-xs text-label-caps text-on-surface-variant'
            }
          >
            노선 강조 보기
          </button>
        </div>

        <p className="text-body-md text-on-surface-variant">
          {showImage
            ? '역이 모두 표시된 노선도입니다.'
            : '노선에 마우스를 올리면 그 노선만 강조됩니다.'}
        </p>

        {showImage && (
          <button
            type="button"
            onClick={() => setZoomed(!zoomed)}
            className="ml-auto flex items-center gap-xs rounded-lg border border-outline-variant px-md py-xs text-body-md text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            <Icon
              name={zoomed ? 'zoom_out_map' : 'zoom_in'}
              className="text-[18px]"
            />
            {zoomed ? '화면에 맞추기' : '크게 보기'}
          </button>
        )}
      </div>

      {showImage ? (
        <>
          {/* 좁은 화면에서는 글자가 뭉개지므로 가로 스크롤로 넘긴다 */}
          <div className="overflow-auto rounded-lg border border-outline-variant">
            <img
              src={asset(MAP_IMAGE)}
              alt="수도권 전철 노선도"
              className={
                zoomed
                  ? 'h-auto w-[2000px] max-w-none'
                  : 'h-auto w-full min-w-[900px]'
              }
              onError={() => {
                // 파일을 아직 넣지 않았으면 직접 그린 노선도로 넘어간다
                setImageMissing(true);
                setMode('interactive');
              }}
            />
          </div>
          <a
            href={asset(MAP_IMAGE)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-xs self-start text-body-md text-primary underline"
          >
            <Icon name="open_in_new" className="text-[16px]" />
            원본 크기로 열기
          </a>
        </>
      ) : (
        <>
          <MetroMap />
          <p className="flex items-start gap-xs text-body-md text-on-surface-variant">
            <Icon name="info" className="shrink-0 text-[18px]" />
            <span>
              보기 편하도록 각도를 정리한 <strong>도식도</strong>라 실제 지리
              위치와는 다릅니다. 주요 역·환승역만 표시됩니다.
            </span>
          </p>
        </>
      )}

      {imageMissing && (
        <p className="flex items-start gap-xs text-body-md text-tertiary">
          <Icon name="warning" className="shrink-0 text-[18px]" />
          <span>
            <code>public/{MAP_IMAGE}</code> 파일이 없어 직접 그린 노선도를 대신
            보여주고 있습니다.
          </span>
        </p>
      )}
    </div>
  );
}
