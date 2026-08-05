import { useEffect, useState } from 'react';
import { getReviewPath, navigate } from '../../app/route';
import { listMyReviews } from '../reviews/api/reviews';
import type { Review } from '../reviews/types';
import { Icon } from '../../shared/ui/Icon';
import { PreviewFrame } from '../../shared/ui/PreviewFrame';
import { Card } from '../../shared/ui/Card';
import { Badge } from '../../shared/ui/Badge';

const EXAMPLE_USER = { nickname: '지하철여행자', email: 'metro@example.com', initial: '지' };
const EXAMPLE_STATS = [
  { icon: 'star', label: '즐겨찾기', value: 4 },
  { icon: 'edit_note', label: '작성한 후기', value: 0 },
  { icon: 'route', label: '저장한 동선', value: 1 },
];
const EXAMPLE_FAVORITES = ['탕정', '천안', '아산', '온양온천'];
const ACCOUNT_MENU = [
  { icon: 'manage_accounts', label: '회원 정보 수정' },
  { icon: 'lock_reset', label: '비밀번호 변경' },
  { icon: 'logout', label: '로그아웃' },
];

function reviewText(content: string) {
  return content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function ReviewSummary({ review }: { review: Review }) {
  return <button type="button" className="flex w-full flex-col gap-xs border-b border-outline-variant/70 p-md text-left transition hover:bg-surface-container-low last:border-b-0" onClick={() => navigate(getReviewPath({ kind: 'detail', reviewId: review.reviewId }))}>
    <div className="flex flex-wrap items-center gap-xs"><span className="font-bold text-on-surface">{review.startStationName}</span><Icon name="arrow_forward" className="text-[16px] text-on-surface-variant" /><span className="font-bold text-on-surface">{review.endStationName}</span><span className="ml-auto flex items-center gap-xs text-body-md text-tertiary">★ {(review.rating / 2).toFixed(1)}</span></div>
    <p className="text-body-lg font-semibold text-on-surface">{review.title}</p>
    <p className="line-clamp-2 text-body-md text-on-surface-variant">{reviewText(review.content)}</p>
    <div className="flex flex-wrap items-center gap-xs">{review.tags.map((tag) => <Badge key={tag}>#{tag}</Badge>)}<span className="ml-auto text-label-caps text-on-surface-variant">{review.travelCost === null ? '경비 미입력' : `${review.travelCost.toLocaleString()}원`}</span></div>
  </button>;
}

export function MyPageFeature({ onLogout }: { onLogout: () => void }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    let cancelled = false;
    listMyReviews()
      .then((response) => { if (!cancelled) setReviews(response.items); })
      .catch((caught) => { if (!cancelled) setReviewError(caught instanceof Error ? caught.message : '내 후기를 불러오지 못했습니다.'); })
      .finally(() => { if (!cancelled) setReviewLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return <PreviewFrame title="마이페이지" description="즐겨찾기·후기·저장한 동선을 한곳에서 관리합니다." notice="내 후기는 로그인한 계정 기준으로 불러옵니다.">
    <Card className="flex items-center gap-md p-md"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-container text-headline-sm font-bold text-on-primary-container">{EXAMPLE_USER.initial}</span><div className="min-w-0 flex-1"><p className="text-body-lg font-bold text-on-surface">{EXAMPLE_USER.nickname}</p><p className="truncate text-body-md text-on-surface-variant">{EXAMPLE_USER.email}</p></div><span className="hidden shrink-0 items-center gap-xs rounded-lg bg-surface-container-low px-sm py-sm text-body-md text-on-surface-variant sm:flex"><Icon name="edit" className="text-[18px]" />프로필 수정</span></Card>

    <Card className="grid grid-cols-1 overflow-hidden sm:grid-cols-3">{EXAMPLE_STATS.map((stat, index) => <div key={stat.label} className="flex flex-row items-center gap-sm border-b border-outline-variant/70 p-md last:border-b-0 sm:flex-col sm:border-b-0 sm:border-r sm:last:border-r-0"><Icon name={stat.icon} className="text-[20px] text-primary" /><span className="text-headline-sm font-bold text-on-surface">{index === 1 ? reviews.length : stat.value}</span><span className="text-label-caps uppercase tracking-widest text-on-surface-variant">{stat.label}</span></div>)}</Card>

    <Card className="p-md"><h3 className="text-label-caps uppercase tracking-widest text-on-surface-variant">즐겨찾기 역</h3><div className="mt-sm flex flex-wrap gap-xs">{EXAMPLE_FAVORITES.map((name) => <Badge key={name} className="gap-xs bg-surface-container text-on-surface"><Icon name="star" className="text-[16px] text-primary" />{name}</Badge>)}</div></Card>

    <Card className="overflow-hidden"><h3 className="border-b border-outline-variant/70 px-md py-md text-label-caps uppercase tracking-widest text-on-surface-variant">작성한 후기</h3>{reviewLoading && <p className="p-md text-body-md text-on-surface-variant">내 후기를 불러오는 중입니다.</p>}{!reviewLoading && reviewError && <p className="p-md text-body-md text-error">{reviewError}</p>}{!reviewLoading && !reviewError && reviews.length === 0 && <p className="p-md text-body-md text-on-surface-variant">작성한 후기가 없습니다.</p>}{!reviewLoading && !reviewError && reviews.map((review) => <ReviewSummary key={review.reviewId} review={review} />)}</Card>

    <Card className="overflow-hidden">{ACCOUNT_MENU.map((menu) => <button key={menu.label} type="button" onClick={menu.icon === 'logout' ? onLogout : undefined} className="flex w-full items-center gap-sm border-b border-outline-variant/70 px-md py-md text-body-lg text-on-surface transition hover:bg-surface-container-low last:border-b-0"><Icon name={menu.icon} className="text-[20px] text-on-surface-variant" />{menu.label}<Icon name="chevron_right" className="ml-auto text-[20px] text-on-surface-variant" /></button>)}</Card>
    <p className="pb-md text-center text-body-md text-error/70">회원 탈퇴</p>
  </PreviewFrame>;
}
