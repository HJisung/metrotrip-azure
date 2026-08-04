import { getPath, navigate } from '../../../app/route';

export function LoginRequiredModal({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-on-background/40 px-md">
      <div className="w-full max-w-[24rem] rounded-xl border border-outline-variant bg-surface-container-lowest p-lg text-center shadow-xl">
        <h2 className="text-headline-sm font-heading font-bold text-on-surface">로그인이 필요합니다</h2>
        <p className="mt-sm text-body-md text-on-surface-variant">마이페이지를 이용하려면 먼저 로그인해주세요.</p>
        <div className="mt-lg flex justify-center gap-sm">
          <button type="button" className="rounded-md border border-outline px-md py-sm text-body-md text-on-surface-variant" onClick={() => navigate(getPath('map'))}>닫기</button>
          <button type="button" className="rounded-md bg-primary px-md py-sm font-semibold text-on-primary" onClick={onConfirm}>로그인하기</button>
        </div>
      </div>
    </div>
  );
}
