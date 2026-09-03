// src/api/report.api.ts

import { api } from "./api";
import type {
  ReportLocation,
  ReportRequest,
  MyHiddenTargetsResponse,
  MyReportHistoryResponse,
} from "../types/report.types";

export const submitReport = (data: ReportRequest) => {
  return api.post<void>("/reports", data);
};

export const getMyHiddenTargets = (location: ReportLocation) => {
  return api.get<MyHiddenTargetsResponse>("/reports/me/hidden-targets", {
    params: { location },
  });
};

export const getMyReportHistory = (page = 0, size = 5) => {
  return api.get<MyReportHistoryResponse>("/reports/me", {
    params: { page, size },
  });
};
