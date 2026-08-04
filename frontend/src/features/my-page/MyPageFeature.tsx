import { Icon } from '../../shared/ui/Icon';
import { PreviewFrame } from '../../shared/ui/PreviewFrame';
import { Card } from '../../shared/ui/Card';
import { Badge } from '../../shared/ui/Badge';

/** 화면 구성을 보여주기 위한 가짜 계정이다. 실제 회원 데이터가 아니다. */
const EXAMPLE_USER = {
  nickname: '지하철덕후',
  email: 'metro@example.com',
  initial: '지',
};

const EXAMPLE_STATS = [
  { icon: 'star', label: '즐겨찾기', value: 4 },
  { icon: 'edit_note', label: '작성한 후기', value: 2 },
  { icon: 'route', label: '저장한 동선', value: 1 },
];

const EXAMPLE_FAVORITES = ['탕정역', '온양온천역', '천안역', '아산역'];

const EXAMPLE_REVIEWS = [
  {
    from: '탕정역',
    to: '온양온천역',
    rating: 5,
    cost: '12,000원',
    body: '온천 다녀오고 근처에서 밥까지 먹기 딱 좋았어요.',
  },
  {
    from: '천안역',
    to: '두정역',
    rating: 4,
    cost: '8,000원',
    body: '빵집 투어하기 좋습니다. 주말엔 사람이 좀 많아요.',
  },
];

const ACCOUNT_MENU = [
  { icon: 'manage_accounts', label: '회원 정보 수정' },
  { icon: 'lock_reset', label: '비밀번호 변경' },
  { icon: 'logout', label: '로그아웃' },
];

/** 마이페이지 프리뷰 (docs/SPEC.md 2-1). 로그인 이후 화면 구성만 보여준다. */
export function MyPageFeature({ onLogout }: { onLogout: () => void }) {
  return (
    <PreviewFrame
      title="마이페이지"
      description="즐겨찾기·후기·저장한 동선을 한곳에서 관리합니다."
      notice="정보를 불러올 수 없습니다."
    >
      {/* 프로필 */}
      <Card className="flex items-center gap-md p-md">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-container text-headline-sm font-bold text-on-primary-container">
          {EXAMPLE_USER.initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body-lg font-bold text-on-surface">
            {EXAMPLE_USER.nickname}
          </p>
          <p className="truncate text-body-md text-on-surface-variant">
            {EXAMPLE_USER.email}
          </p>
        </div>
        <span className="hidden shrink-0 items-center gap-xs rounded-lg bg-surface-container-low px-sm py-sm text-body-md text-on-surface-variant sm:flex">
          <Icon name="edit" className="text-[18px]" />
          프로필 수정
        </span>
      </Card>

      {/* 요약 숫자 */}
      <Card className="grid grid-cols-3 overflow-hidden">
        {EXAMPLE_STATS.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-xs border-r border-outline-variant/70 p-md last:border-r-0"
          >
            <Icon name={stat.icon} className="text-[20px] text-primary" />
            <span className="text-headline-sm font-bold text-on-surface">
              {stat.value}
            </span>
            <span className="text-label-caps uppercase tracking-widest text-on-surface-variant">
              {stat.label}
            </span>
          </div>
        ))}
      </Card>

      {/* 즐겨찾기한 역 */}
      <Card className="p-md">
        <h3 className="text-label-caps uppercase tracking-widest text-on-surface-variant">
          즐겨찾기한 역
        </h3>
        <div className="mt-sm flex flex-wrap gap-xs">
          {EXAMPLE_FAVORITES.map((name) => (
            <Badge key={name} className="gap-xs bg-surface-container text-on-surface">
              <Icon name="star" className="text-[16px] text-primary" />
              {name}
            </Badge>
          ))}
        </div>
      </Card>

      {/* 작성한 후기 */}
      <Card className="overflow-hidden">
        <h3 className="border-b border-outline-variant/70 px-md py-md text-label-caps uppercase tracking-widest text-on-surface-variant">
          작성한 후기
        </h3>
        <ul>
          {EXAMPLE_REVIEWS.map((review) => (
            <li
              key={`${review.from}-${review.to}`}
              className="flex flex-col gap-xs border-b border-outline-variant/70 p-md transition hover:bg-surface-container-low last:border-b-0"
            >
              <div className="flex flex-wrap items-center gap-xs">
                <span className="text-body-md font-bold text-on-surface">
                  {review.from}
                </span>
                <Icon
                  name="arrow_forward"
                  className="text-[16px] text-on-surface-variant"
                />
                <span className="text-body-md font-bold text-on-surface">
                  {review.to}
                </span>
                <span className="ml-auto flex items-center gap-xs text-body-md text-tertiary">
                  <Icon name="star" className="text-[16px]" />
                  {review.rating}.0
                </span>
              </div>
              <p className="text-body-md text-on-surface-variant">
                {review.body}
              </p>
              <p className="text-label-caps uppercase tracking-widest text-on-surface-variant/70">
                여행 경비 {review.cost}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      {/* 계정 관리 */}
      <Card className="overflow-hidden">
        {ACCOUNT_MENU.map((menu) => (
          <button
            key={menu.label}
            type="button"
            onClick={menu.icon === 'logout' ? onLogout : undefined}
            className="flex w-full items-center gap-sm border-b border-outline-variant/70 px-md py-md text-body-lg text-on-surface transition hover:bg-surface-container-low last:border-b-0"
          >
            <Icon name={menu.icon} className="text-[20px] text-on-surface-variant" />
            {menu.label}
            <Icon
              name="chevron_right"
              className="ml-auto text-[20px] text-on-surface-variant"
            />
          </button>
        ))}
      </Card>

      <p className="pb-md text-center text-body-md text-error/70">회원 탈퇴</p>
    </PreviewFrame>
  );
}
