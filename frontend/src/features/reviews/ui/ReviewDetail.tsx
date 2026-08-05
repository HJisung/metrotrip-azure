import { useEffect, useState } from 'react';
import { CalendarDays, Eye, Heart, MapPin, MoreHorizontal, Share2, Star } from 'lucide-react';
import { getReview, deleteReview } from '../api/reviews';
import type { Review } from '../types';
import { getReviewPath, navigate } from '../../../app/route';
import { Badge } from '../../../shared/ui/Badge';
import { PreviewFrame } from '../../../shared/ui/PreviewFrame';

function getCurrentUserId() {
  const token = window.localStorage.getItem('metrotrip-access-token');
  if (!token) return null;
  try { return Number(JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub); } catch { return null; }
}

export function ReviewDetail({ reviewId }: { reviewId: number }) {
  const [review, setReview] = useState<Review | null>(null);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    getReview(reviewId).then(setReview).catch((caught) => setError(caught instanceof Error ? caught.message : '후기를 불러오지 못했습니다.'));
  }, [reviewId]);

  if (!review) return <PreviewFrame title="후기 상세" description="" notice={error || '후기를 불러오는 중입니다.'}><p>{error || '불러오는 중...'}</p></PreviewFrame>;
  const isOwner = getCurrentUserId() === review.userId;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <article className="mx-auto flex w-full max-w-[var(--review-detail-width)] flex-col gap-[var(--review-detail-gap)] px-[var(--review-detail-gutter)] py-[var(--review-detail-gutter)]">
        <button type="button" className="w-fit text-body-md text-on-surface-variant transition hover:text-primary" onClick={() => navigate(getReviewPath({ kind: 'list' }))}>← 후기 목록</button>
        <header className="grid gap-[var(--spacing-md)]">
          <h1 className="text-[calc(var(--review-detail-title-size)*1.7)] font-heading font-bold leading-tight text-on-surface">{review.title}</h1>
          <div className="flex items-center justify-between gap-md text-body-md text-on-surface-variant">
            <div className="flex items-center gap-sm"><span className="flex h-[calc(2rem*0.8)] w-[calc(2rem*0.8)] items-center justify-center rounded-full bg-primary-container text-sm font-bold text-primary">{review.authorNickname.slice(0, 1)}</span><span className="font-semibold text-on-surface">{review.authorNickname}</span><span>·</span><CalendarDays size={14} />{new Date(review.createdAt).toLocaleDateString('ko-KR')}</div>
            <span>{new Date(review.createdAt).toLocaleDateString('ko-KR')}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-sm border-b border-outline-variant/70 pb-[var(--spacing-md)] text-body-md">
            <div className="flex items-center gap-sm text-primary"><MapPin size={16} />{review.startStationName} → {review.endStationName}<span className="text-on-surface-variant">·</span><span className="flex items-center gap-xs text-amber-500"><Star size={16} fill="currentColor" />{(review.rating / 2).toFixed(1)}</span><span className="text-on-surface-variant">·</span><span className="text-on-surface-variant">{review.travelCost === null ? '경비 미입력' : `${review.travelCost.toLocaleString()}원`}</span></div>
            <div className="flex items-center gap-sm text-on-surface-variant"><span className="flex items-center gap-xs"><Eye size={15} />{review.viewCount}</span><button type="button" className="flex items-center gap-xs hover:text-primary"><Share2 size={15} />공유</button>{isOwner && <div className="relative"><button type="button" aria-label="더보기" aria-expanded={menuOpen} className="rounded-full p-xs hover:bg-surface-container-low" onClick={() => setMenuOpen((open) => !open)}><MoreHorizontal size={18} /></button>{menuOpen && <div className="absolute right-0 top-full z-20 mt-xs w-28 rounded-[var(--radius-md)] border border-outline-variant bg-surface-bright p-xs shadow-card"><button type="button" className="w-full rounded-[var(--radius-sm)] px-sm py-sm text-left text-body-md hover:bg-surface-container-low" onClick={() => navigate(getReviewPath({ kind: 'edit', reviewId }))}>수정</button><button type="button" className="w-full rounded-[var(--radius-sm)] px-sm py-sm text-left text-body-md text-error hover:bg-error-container" onClick={async () => { if (window.confirm('후기를 삭제할까요?')) { await deleteReview(reviewId); navigate(getReviewPath({ kind: 'list' })); } }}>삭제</button></div>}</div>}</div>
          </div>
        </header>
        <div className="border-t border-outline-variant/70 pt-[var(--review-detail-gap)]"><div className="prose max-w-none text-body-lg leading-8 text-on-surface [&_img]:my-[var(--spacing-lg)] [&_img]:max-h-[38rem] [&_img]:max-w-full [&_img]:rounded-[var(--radius-lg)]" dangerouslySetInnerHTML={{ __html: review.content }} /></div>
        <div className="flex flex-wrap gap-xs border-t border-outline-variant/70 pt-[var(--spacing-lg)]">{review.tags.map((tag) => <Badge key={tag}>#{tag}</Badge>)}</div>
        <div className="flex justify-center border-t border-outline-variant/70 pt-[var(--spacing-lg)]"><button type="button" className="flex items-center gap-sm rounded-full border border-outline-variant px-lg py-sm text-body-md text-on-surface-variant transition hover:border-error/40 hover:text-error"><Heart size={17} />좋아요</button></div>
      </article>
    </div>
  );
}
