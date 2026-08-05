import type { ReviewPage } from '../../app/route';
import { getAuthPath, navigate } from '../../app/route';
import { useIsAuthenticated } from '../../shared/auth/session';
import { LoginRequiredModal } from '../auth/ui/LoginRequiredModal';
import { ReviewDetail } from './ui/ReviewDetail';
import { ReviewList } from './ui/ReviewList';
import { NewReviewWriter, ReviewEditor } from './ui/ReviewWriter';

export function ReviewsFeature({ page }: { page: ReviewPage }) {
  const authenticated = useIsAuthenticated();

  if (page.kind === 'list') return <ReviewList />;
  if (page.kind === 'detail') return <ReviewDetail reviewId={page.reviewId} />;
  if (page.kind === 'edit') return <ReviewEditor reviewId={page.reviewId} />;
  if (!authenticated) return <LoginRequiredModal onConfirm={() => navigate(getAuthPath('login'))} />;
  return <NewReviewWriter />;
}
