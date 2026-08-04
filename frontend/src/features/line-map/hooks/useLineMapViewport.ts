import type { PointerEvent, WheelEvent } from 'react';
import { useCallback, useRef, useState } from 'react';
import type { Point, Viewport } from '../types';

const INITIAL_VIEWPORT: Viewport = { x: 0, y: 0, scale: 0.88 };
const MIN_SCALE = 0.7;
const MAX_SCALE = 2.8;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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

export function useLineMapViewport() {
  const svgRef = useRef<SVGSVGElement>(null);
  const pointersRef = useRef(new Map<number, Point>());
  const dragRef = useRef<{ start: Point; viewport: Viewport } | null>(null);
  const pinchRef = useRef<{ distance: number; center: Point; viewport: Viewport } | null>(null);
  const [viewport, setViewport] = useState(INITIAL_VIEWPORT);
  const [dragging, setDragging] = useState(false);

  const zoomAt = useCallback((nextScale: number, point: Point) => {
    setViewport((current) => {
      const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
      const ratio = scale / current.scale;
      return {
        scale,
        x: point.x - (point.x - current.x) * ratio,
        y: point.y - (point.y - current.y) * ratio,
      };
    });
  }, []);

  const onWheel = useCallback((event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const point = getLocalPoint(event, svg);
    zoomAt(viewport.scale * (event.deltaY < 0 ? 1.12 : 0.89), point);
  }, [viewport.scale, zoomAt]);

  const onPointerDown = useCallback((event: PointerEvent<SVGSVGElement>) => {
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
      setDragging(true);
    }
  }, [viewport]);

  const onPointerMove = useCallback((event: PointerEvent<SVGSVGElement>) => {
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
        x: pinchRef.current.viewport.x + center.x - pinchRef.current.center.x + pinchRef.current.center.x -
          (pinchRef.current.center.x - pinchRef.current.viewport.x) * (scale / pinchRef.current.viewport.scale),
        y: pinchRef.current.viewport.y + center.y - pinchRef.current.center.y + pinchRef.current.center.y -
          (pinchRef.current.center.y - pinchRef.current.viewport.y) * (scale / pinchRef.current.viewport.scale),
      });
      return;
    }
    if (!dragRef.current) return;
    setViewport({
      ...dragRef.current.viewport,
      x: dragRef.current.viewport.x + point.x - dragRef.current.start.x,
      y: dragRef.current.viewport.y + point.y - dragRef.current.start.y,
    });
  }, []);

  const onPointerUp = useCallback((event: PointerEvent<SVGSVGElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) dragRef.current = null;
    if (pointersRef.current.size === 0) setDragging(false);
    svgRef.current?.releasePointerCapture(event.pointerId);
  }, []);

  return {
    svgRef,
    viewport,
    dragging,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    zoomAt,
    resetViewport: () => setViewport(INITIAL_VIEWPORT),
  };
}

export type LineMapViewportState = ReturnType<typeof useLineMapViewport>;
