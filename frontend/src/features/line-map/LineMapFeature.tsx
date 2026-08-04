import { useEffect, useState } from 'react';
import type { Station } from '../../shared/types/station';
import { PreviewFrame } from '../../shared/ui/PreviewFrame';
import { useLineMapStations } from './hooks/useLineMapStations';
import { useLineMapViewport } from './hooks/useLineMapViewport';
import { MetroMapPanel } from './ui/MetroMapPanel';

type LineMapViewProps = {
  selected: Station | null;
};

/** 노선도와 노선도 내부 선택 상태를 담당하는 화면 */
export function LineMapFeature({ selected: initialSelected }: LineMapViewProps) {
  const { stations, loadError } = useLineMapStations();
  const viewport = useLineMapViewport();
  const [selected, setSelected] = useState<Station | null>(initialSelected);

  useEffect(() => {
    setSelected(initialSelected);
  }, [initialSelected]);

  return (
    <PreviewFrame
      title="노선도"
      description="1호선 천안·아산 구간의 역을 약도에서 선택합니다."
      notice="역을 클릭하거나 포커스한 뒤 Enter 또는 Space를 누르면 선택 상태와 역 정보가 갱신됩니다."
      wide
    >
      <section className="border-t border-outline-variant pt-md">
        <h3 className="mb-sm text-label-caps uppercase tracking-widest text-on-surface-variant">
          1호선 · 천안 ~ 아산 11개 역
        </h3>
        {loadError ? (
          <p className="border-l-2 border-error px-md py-sm text-body-md text-error" role="alert">
            노선 정보를 불러오지 못했습니다.
          </p>
        ) : (
          <MetroMapPanel
            stations={stations}
            selected={selected}
            onSelect={setSelected}
            viewport={viewport}
          />
        )}
      </section>
    </PreviewFrame>
  );
}
