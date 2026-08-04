import { getPath, navigate } from '../../../app/route';
import { Button } from '../../../shared/ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../shared/ui/Dialog';

export function LoginRequiredModal({ onConfirm }: { onConfirm: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => !open && navigate(getPath('map'))}>
      <DialogContent className="max-w-[24rem] text-center">
        <DialogHeader className="items-center pr-0">
          <DialogTitle>로그인이 필요합니다</DialogTitle>
          <DialogDescription>마이페이지를 이용하려면 먼저 로그인해주세요.</DialogDescription>
        </DialogHeader>
        <div className="mt-lg flex justify-center gap-sm">
          <Button type="button" variant="outline" onClick={() => navigate(getPath('map'))}>닫기</Button>
          <Button type="button" onClick={onConfirm}>로그인하기</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
