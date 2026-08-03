import type { ReactNode } from 'react';

type PreviewFrameProps = {
  title: string;
  /** 화면 한 줄 설명 */
  description: string;
  /**
   * 준비중 안내 문구.
   * 발표 중 "이미 되는 기능"으로 오해받지 않도록 화면마다 반드시 밝힌다.
   */
  notice: string;
  /** 노선도처럼 넓게 봐야 하는 화면은 가로 폭 제한을 푼다 */
  wide?: boolean;
  children: ReactNode;
};

/**
 * 발표용 프리뷰 화면의 공통 껍데기 (docs/SPEC.md 2-1).
 *
 * 이 안에 들어가는 화면은 "다음 단계에는 이렇게 만듭니다"를 보여주는 용도이며,
 * 실제로 동작하지 않는다. 그래서 제목 옆 준비중 배지와 안내 문구를 항상 함께 노출한다.
 */
export function PreviewFrame({
  title,
  description,
  notice,
  wide = false,
  children,
}: PreviewFrameProps) {
  return (
    <div className="h-full overflow-y-auto bg-background">
      <div
        className={
          wide
            ? 'flex flex-col gap-lg p-md sm:p-lg'
            : 'mx-auto flex max-w-4xl flex-col gap-lg p-md sm:p-lg'
        }
      >
        <header className="flex flex-col gap-xs border-b border-outline-variant pb-md">
          <h2 className="text-display-lg font-heading text-on-surface">{title}</h2>
          <p className="max-w-2xl text-body-lg text-on-surface-variant">{description}</p>
        </header>

        <p className="border-l-2 border-tertiary px-md py-xs text-body-md text-on-surface-variant">
          {notice}
        </p>

        {children}
      </div>
    </div>
  );
}
