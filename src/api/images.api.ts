import { api } from './api';

export const uploadImages = (files: File[]) => {
  const formData = new FormData();
  files.forEach(file => formData.append('images', file));

  return api.post<string[]>('/images', formData);
};