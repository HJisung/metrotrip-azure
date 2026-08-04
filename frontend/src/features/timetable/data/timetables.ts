import type { Direction, TimetableRow } from '../types';

export const TIMETABLES: Record<string, Record<Direction, TimetableRow[]>> = {
  탕정역: {
    up: [
      { hour: '06', minutes: '03  17  31  45' },
      { hour: '07', minutes: '02  14  26  38  50' },
      { hour: '08', minutes: '04  18  32  46', tag: '혼잡' },
      { hour: '09', minutes: '03  21  39' },
      { hour: '23', minutes: '08  36', tag: '막차' },
    ],
    down: [
      { hour: '06', minutes: '08  22  36  50' },
      { hour: '07', minutes: '04  16  28  40  52' },
      { hour: '08', minutes: '10  24  38  52' },
      { hour: '22', minutes: '12  30  48', tag: '막차' },
    ],
  },
};

export const DIRECTION_LABELS: Record<Direction, string> = {
  up: '상행',
  down: '하행',
};
