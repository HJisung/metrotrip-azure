import type { RefObject } from 'react';
import type { Station } from '../../shared/types/station';

export type Direction = 'up' | 'down';

export type TimetableRow = {
  hour: string;
  minutes: string;
  tag?: string;
};

export type TimetablePanelProps = {
  station: Station;
  onClose: () => void;
  direction: Direction;
  onDirectionChange: (direction: Direction) => void;
  rows: TimetableRow[];
  dialogRef: RefObject<HTMLElement | null>;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
};
