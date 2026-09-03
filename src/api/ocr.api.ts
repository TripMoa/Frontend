// src/api/ocr.api.ts

import { api } from "./api";
import type {
  OcrAutofillRequest,
  OcrAutofillWithPreviewResponse,
  OcrInitialResponse,
} from "../types/ocr.types";

// OCR 자동채움 호출
export const requestExpenseOcr = (tripId: number, file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post<OcrInitialResponse>(
    `/trips/${tripId}/expenses/ocr`,
    formData,
  );
};

// OCR 자동채움 + 지출 계산 미리보기 호출
export const requestExpenseOcrWithPreview = (
  tripId: number,
  file: File,
  request: OcrAutofillRequest,
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "request",
    new Blob([JSON.stringify(request)], { type: "application/json" }),
  );

  return api.post<OcrAutofillWithPreviewResponse>(
    `/trips/${tripId}/expenses/ocr`,
    formData,
  );
};
