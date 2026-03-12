// 이미지 파일 배열을 FormData로 변환하여 서버에 업로드하고, 업로드된 이미지 URL 목록을 반환

import { api } from './api';

export const uploadImages = (files: File[]) => {
  const formData = new FormData();
  files.forEach(file => formData.append('images', file));

  return api.post<string[]>('/images', formData);
};