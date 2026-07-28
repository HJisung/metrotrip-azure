/**
 * 수도권 전철 간략 노선도 데이터.
 *
 * 공식 노선도 이미지를 그대로 쓰지 않고 직접 그린 이유:
 *  1. 이미지는 저작권 확인이 필요하고, 확대하면 글자가 뭉갠다
 *  2. 노선을 눌러 강조하거나 역을 클릭하려면 벡터여야 한다
 *  3. 외부 API/이미지를 받아오지 않아 화면이 즉시 뜬다
 *
 * 주의: **좌표는 실제 지리 좌표가 아니라 도식화한 위치**다.
 * 지하철 노선도가 원래 그렇듯 보기 좋게 각도를 정리했고,
 * 주요 역·환승역 위주로만 넣었다. 전체 역을 채우는 것은 다음 단계.
 *
 * 환승역은 한 노선에만 이름을 적는다. 같은 이름을 여러 노선에 중복해서
 * 넣으면 라벨이 겹쳐 읽기 어려워지기 때문이다.
 */

export type MetroStation = {
  name: string;
  x: number;
  y: number;
  /** 환승역이면 흰 속을 채운 큰 점으로 그린다 */
  transfer?: boolean;
};

export type MetroLine = {
  id: string;
  /** 노선 이름 (범례와 강조 표시에 쓴다) */
  name: string;
  /** 공식 노선 색 */
  color: string;
  /** SVG path — 노선이 지나는 경로 */
  path: string;
  stations: MetroStation[];
};

export const METRO_VIEWBOX = { width: 1000, height: 740 };

export const METRO_LINES: MetroLine[] = [
  {
    id: '1',
    name: '1호선',
    color: '#0052A4',
    path: 'M 780 60 V 180 L 700 250 H 545 L 500 258 H 420 L 345 305 L 320 360 L 295 415 L 270 470 L 245 525 L 220 580 L 198 632 L 178 682 L 165 712',
    stations: [
      { name: '소요산', x: 780, y: 60 },
      { name: '의정부', x: 780, y: 150 },
      { name: '광운대', x: 740, y: 220, transfer: true },
      { name: '청량리', x: 700, y: 250, transfer: true },
      { name: '종로3가', x: 600, y: 250, transfer: true },
      { name: '서울역', x: 345, y: 305, transfer: true },
      { name: '노량진', x: 320, y: 360, transfer: true },
      { name: '구로', x: 295, y: 415, transfer: true },
      { name: '안양', x: 270, y: 470 },
      { name: '수원', x: 245, y: 525, transfer: true },
      { name: '평택', x: 220, y: 580 },
      { name: '천안', x: 198, y: 632 },
      { name: '온양온천', x: 178, y: 682 },
      { name: '신창', x: 165, y: 712 },
    ],
  },
  {
    id: '2',
    name: '2호선',
    color: '#00A84D',
    path: 'M 400 260 H 660 Q 690 260 690 290 V 440 Q 690 470 660 470 H 400 Q 370 470 370 440 V 290 Q 370 260 400 260 Z',
    stations: [
      { name: '시청', x: 405, y: 260, transfer: true },
      { name: '을지로입구', x: 455, y: 260 },
      { name: '을지로3가', x: 500, y: 260, transfer: true },
      { name: '동대문역사문화공원', x: 565, y: 260, transfer: true },
      { name: '왕십리', x: 690, y: 305, transfer: true },
      { name: '건대입구', x: 690, y: 370, transfer: true },
      { name: '잠실', x: 655, y: 470, transfer: true },
      { name: '삼성', x: 615, y: 470 },
      { name: '선릉', x: 575, y: 470, transfer: true },
      { name: '교대', x: 510, y: 470, transfer: true },
      { name: '사당', x: 430, y: 470, transfer: true },
      { name: '신도림', x: 370, y: 435, transfer: true },
      { name: '합정', x: 370, y: 330, transfer: true },
      { name: '홍대입구', x: 370, y: 300, transfer: true },
    ],
  },
  {
    id: '3',
    name: '3호선',
    color: '#EF7C1C',
    path: 'M 120 90 L 200 170 L 270 240 L 330 282 H 430 L 480 302 L 520 342 L 560 382 L 620 442 L 680 502 L 725 548',
    stations: [
      { name: '대화', x: 120, y: 90 },
      { name: '화정', x: 200, y: 170 },
      { name: '연신내', x: 270, y: 240, transfer: true },
      { name: '경복궁', x: 352, y: 282 },
      { name: '안국', x: 402, y: 282 },
      { name: '충무로', x: 480, y: 302, transfer: true },
      { name: '약수', x: 520, y: 342, transfer: true },
      { name: '옥수', x: 560, y: 382 },
      { name: '고속터미널', x: 620, y: 442, transfer: true },
      { name: '양재', x: 680, y: 502 },
      { name: '오금', x: 725, y: 548, transfer: true },
    ],
  },
  {
    id: '4',
    name: '4호선',
    color: '#00A5DE',
    path: 'M 860 120 L 800 180 L 755 225 L 690 300 L 620 332 L 560 362 L 515 402 L 468 452 L 420 500 L 360 560 L 305 612',
    stations: [
      { name: '당고개', x: 860, y: 120 },
      { name: '노원', x: 800, y: 180, transfer: true },
      { name: '창동', x: 755, y: 225, transfer: true },
      { name: '한성대입구', x: 690, y: 300 },
      { name: '동대문', x: 620, y: 332, transfer: true },
      { name: '명동', x: 560, y: 362 },
      { name: '회현', x: 515, y: 402 },
      { name: '이수', x: 468, y: 452, transfer: true },
      { name: '남태령', x: 420, y: 500 },
      { name: '과천', x: 360, y: 560 },
      { name: '오이도', x: 305, y: 612 },
    ],
  },
  {
    id: '5',
    name: '5호선',
    color: '#996CAC',
    path: 'M 90 330 H 200 L 280 372 L 350 398 L 420 374 L 470 348 H 545 L 600 372 L 665 398 L 730 428 L 800 462',
    stations: [
      { name: '방화', x: 90, y: 330 },
      { name: '김포공항', x: 170, y: 330, transfer: true },
      { name: '목동', x: 280, y: 372 },
      { name: '여의도', x: 350, y: 398, transfer: true },
      { name: '공덕', x: 420, y: 374, transfer: true },
      { name: '광화문', x: 470, y: 348 },
      { name: '을지로4가', x: 512, y: 348 },
      { name: '청구', x: 545, y: 348, transfer: true },
      { name: '군자', x: 600, y: 372, transfer: true },
      { name: '천호', x: 665, y: 398, transfer: true },
      { name: '강동', x: 730, y: 428 },
      { name: '마천', x: 800, y: 462 },
    ],
  },
  {
    id: '6',
    name: '6호선',
    color: '#CD7C2F',
    path: 'M 235 165 L 295 205 L 350 248 L 415 232 H 520 L 575 262 L 632 300 L 690 340 L 745 378',
    stations: [
      { name: '응암', x: 235, y: 165 },
      { name: '불광', x: 295, y: 205, transfer: true },
      { name: '독립문', x: 350, y: 248 },
      { name: '효창공원앞', x: 415, y: 232 },
      { name: '삼각지', x: 470, y: 232, transfer: true },
      { name: '이태원', x: 520, y: 232 },
      { name: '신당', x: 575, y: 262 },
      { name: '동묘앞', x: 632, y: 300, transfer: true },
      { name: '안암', x: 690, y: 340 },
      { name: '봉화산', x: 745, y: 378 },
    ],
  },
  {
    id: '7',
    name: '7호선',
    color: '#747F00',
    path: 'M 830 155 L 780 215 L 730 270 L 675 320 L 620 370 L 565 420 L 510 470 L 450 520 L 390 570 L 330 618',
    stations: [
      { name: '장암', x: 830, y: 155 },
      { name: '도봉산', x: 780, y: 215, transfer: true },
      { name: '태릉입구', x: 730, y: 270, transfer: true },
      { name: '상봉', x: 675, y: 320, transfer: true },
      { name: '강남구청', x: 620, y: 370, transfer: true },
      { name: '논현', x: 565, y: 420 },
      { name: '내방', x: 510, y: 470 },
      { name: '대림', x: 450, y: 520, transfer: true },
      { name: '온수', x: 390, y: 570, transfer: true },
      { name: '부평구청', x: 330, y: 618, transfer: true },
    ],
  },
  {
    id: '8',
    name: '8호선',
    color: '#E6186C',
    path: 'M 640 470 L 672 512 L 700 552 L 725 592',
    stations: [
      { name: '암사', x: 640, y: 470 },
      { name: '가락시장', x: 672, y: 512, transfer: true },
      { name: '문정', x: 700, y: 552 },
      { name: '모란', x: 725, y: 592, transfer: true },
    ],
  },
  {
    id: '9',
    name: '9호선',
    color: '#B0A070',
    path: 'M 150 405 L 230 425 L 310 448 L 390 470 L 470 492 L 550 505 L 630 520 L 700 535',
    stations: [
      { name: '개화', x: 150, y: 405 },
      { name: '당산', x: 310, y: 448, transfer: true },
      { name: '동작', x: 470, y: 492, transfer: true },
      { name: '신논현', x: 550, y: 505, transfer: true },
      { name: '봉은사', x: 630, y: 520 },
      { name: '중앙보훈병원', x: 700, y: 535 },
    ],
  },
];
