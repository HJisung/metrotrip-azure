import { useCallback, useEffect, useMemo, useState } from 'react';
import { getStations } from '../../../shared/lib/stations';
import type { Station } from '../../../shared/types/station';
import { searchRoutes } from '../api/routes';
import type {
  RouteOptionKind,
  RouteSearchResult,
  RouteSearchStatus,
} from '../types';

/**
 * 경로 화면 상태 (docs/SPEC.md 2-2).
 *
 * 출발·도착역이 바뀌면 경로를 다시 계산하고, 계산된 안 중 하나를 확정해 둔다.
 */

/** 처음 보여줄 구간. 탕정역을 경유해 장소 추천까지 확인할 수 있는 구간으로 골랐다. */
const DEFAULT_FROM = '천안역';
const DEFAULT_TO = '온양온천역';

export function useRoutePlan() {
  const [stations, setStations] = useState<Station[]>([]);
  const [fromName, setFromName] = useState(DEFAULT_FROM);
  const [toName, setToName] = useState(DEFAULT_TO);
  const [result, setResult] = useState<RouteSearchResult | null>(null);
  const [status, setStatus] = useState<RouteSearchStatus>('idle');
  const [selectedKind, setSelectedKind] = useState<RouteOptionKind | null>(null);

  useEffect(() => {
    let alive = true;
    getStations().then((loaded) => {
      if (alive) setStations(loaded);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setStatus('loading');

    searchRoutes(fromName, toName)
      .then((found) => {
        if (!alive) return;
        setResult(found);
        // 계산 결과가 바뀌면 첫 번째 안(최단거리)을 기본으로 확정한다.
        setSelectedKind(found?.options[0]?.kind ?? null);
        setStatus('success');
      })
      .catch(() => {
        if (alive) setStatus('error');
      });

    return () => {
      alive = false;
    };
  }, [fromName, toName]);

  const swap = useCallback(() => {
    setFromName(toName);
    setToName(fromName);
  }, [fromName, toName]);

  const selectedOption = useMemo(
    () =>
      result?.options.find((option) => option.kind === selectedKind) ?? null,
    [result, selectedKind],
  );

  return {
    stations,
    fromName,
    toName,
    setFromName,
    setToName,
    swap,
    status,
    result,
    selectedKind,
    setSelectedKind,
    selectedOption,
  };
}
