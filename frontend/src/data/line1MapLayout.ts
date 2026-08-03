export type LineMapStationLayout = {
  stationName: string;
  x: number;
  y: number;
  labelPosition: 'above' | 'below';
};

/** 실제 위도·경도와 분리해서 관리하는 SVG 약도 좌표 */
export const LINE1_STATION_LAYOUT: LineMapStationLayout[] = [
  { stationName: '성환역', x: 120, y: 390, labelPosition: 'above' },
  { stationName: '직산역', x: 230, y: 320, labelPosition: 'below' },
  { stationName: '두정역', x: 340, y: 245, labelPosition: 'above' },
  { stationName: '천안역', x: 450, y: 300, labelPosition: 'below' },
  { stationName: '봉명역', x: 560, y: 405, labelPosition: 'above' },
  { stationName: '쌍용역', x: 670, y: 350, labelPosition: 'below' },
  { stationName: '아산역', x: 780, y: 250, labelPosition: 'above' },
  { stationName: '탕정역', x: 890, y: 315, labelPosition: 'below' },
  { stationName: '배방역', x: 1000, y: 420, labelPosition: 'above' },
  { stationName: '온양온천역', x: 1110, y: 345, labelPosition: 'below' },
  { stationName: '신창역', x: 1220, y: 230, labelPosition: 'above' },
];

export const LINE1_MAP_VIEWBOX = {
  width: 1340,
  height: 620,
};
