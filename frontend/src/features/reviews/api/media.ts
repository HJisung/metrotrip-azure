export type UploadedReviewImage = {
  mediaUrl: string;
  uploadUrl: string;
};

/**
 * 후기 이미지 업로드 경계입니다.
 * 현재 백엔드 POST /review-media가 501 계약 상태라 실제 업로드는 연결하지 않습니다.
 */
export async function uploadReviewImage(_file: File): Promise<UploadedReviewImage> {
  throw new Error('이미지 업로드 API가 아직 준비되지 않았습니다. 텍스트만 먼저 등록해주세요.');
}
