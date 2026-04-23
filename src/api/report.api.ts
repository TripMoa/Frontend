// src/api/report.api.ts
import { api } from "./api";
import type { ReportRequest } from "../features/report/hooks/report.types";

export const submitReport = (data: ReportRequest) => {
    return api.post<void>("/reports", data);
}