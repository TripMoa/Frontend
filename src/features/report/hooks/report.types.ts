// report/hooks/report.types.ts
export type ReportLocation = "POST" | "COMMENT" | "CHAT" | "MATE";

export interface ReportRequest {
    reportedUserId: number;
    location: ReportLocation;
    targetId: number;
    reason: string;
    detail?: string;
    contentSnapshot?: string;
    reportedNickname?: string;
}