import { uploadImages } from '../../../api/images.api';

// 이미지 파일 배열을 서버에 업로드하고 URL 목록을 반환
export function useImageUpload() {
  const upload = async (files: File[]) => {
    if (files.length === 0) return [];

    const res = await uploadImages(files);
    return res.data; 
  };

  return { upload };
}