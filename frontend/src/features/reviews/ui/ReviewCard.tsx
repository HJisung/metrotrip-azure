import { Eye, Heart, MapPin, Star } from 'lucide-react';
import type { Review } from '../types';
import { getDefaultReviewImage } from '../defaultImages';
import { Badge } from '../../../shared/ui/Badge';
import { navigate, getReviewPath } from '../../../app/route';

function stripHtml(content: string) {
  return content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function reviewImage(review: Review) {
  return review.media[0]?.mediaUrl ?? getDefaultReviewImage(review.reviewId).src;
}

function reviewImageClass(review: Review) {
  return review.media[0] ? 'aspect-[4/3]' : getDefaultReviewImage(review.reviewId).aspectClass;
}

export function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="mb-[var(--review-grid-gap)] break-inside-avoid overflow-hidden rounded-[var(--radius-lg)] border border-outline-variant/70 bg-surface-bright shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgb(29_37_44_/_14%)]">
      <button type="button" className="block w-full text-left" onClick={() => navigate(getReviewPath({ kind: 'detail', reviewId: review.reviewId }))}>
        <div className={`relative overflow-hidden bg-surface-container-low ${reviewImageClass(review)}`}>
          <img src={reviewImage(review)} alt="후기 대표 이미지" className="h-full w-full object-cover transition duration-500 hover:scale-105" />
        </div>
        <div className="grid gap-sm p-[var(--review-card-padding)]">
          <h3 className="text-headline-sm font-bold text-on-surface">{review.title}</h3>
          <p className="line-clamp-3 text-body-md text-on-surface-variant">{stripHtml(review.content)}</p>
          <div className="flex items-center justify-between gap-sm text-label-caps text-on-surface-variant">
            <span>{review.authorNickname} · {new Date(review.createdAt).toLocaleDateString('ko-KR')}</span>
            <span className="flex shrink-0 items-center gap-xs"><Eye size={14} />{review.viewCount}</span>
          </div>
          <div className="flex items-center justify-between gap-sm border-t border-outline-variant/60 pt-sm text-body-md">
            <span className="flex items-center gap-xs text-primary"><MapPin size={15} />{review.startStationName} → {review.endStationName} <span className="text-amber-500">· <Star size={15} fill="currentColor" className="inline" /> {(review.rating / 2).toFixed(1)}</span></span>
            <span className="flex shrink-0 items-center gap-xs text-on-surface-variant"><Heart size={15} />{review.likeCount ?? 0}</span>
          </div>
          {review.tags.length > 0 && <div className="flex flex-wrap gap-xs">{review.tags.map((tag) => <Badge key={tag}>#{tag}</Badge>)}</div>}
        </div>
      </button>
    </article>
  );
}
