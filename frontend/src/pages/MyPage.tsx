import { MyPageFeature } from '../features/my-page/MyPageFeature';
import { getAuthPath, navigate } from '../app/route';
import { LoginRequiredModal } from '../features/auth/ui/LoginRequiredModal';

export function MyPage({ onLogout }: { onLogout: () => void }) {
  if (!window.localStorage.getItem('metrotrip-access-token')) {
    return <LoginRequiredModal onConfirm={() => navigate(getAuthPath('login'))} />;
  }
  return <MyPageFeature onLogout={onLogout} />;
}
