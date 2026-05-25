// report/hooks/report.types.ts

export type ReportLocation = "COMMENT" | "CHAT" | "STORY";

export type ReportRequest = {
  reportedUserId: number;
  location: ReportLocation;
  targetId: number;
  reason: string;
  detail?: string;
};

export type MyHiddenTargetsResponse = {
  location: ReportLocation;
  targetIds: number[];
};

export type MyReportItemResponse = {
  reportId: number;
  location: ReportLocation;
  targetId: number;
  reason: string;
  detail: string | null;
  reportedNickname: string | null;
  reportedAt: string;
};

export type MyReportHistoryResponse = {
  currentLevel: number;
  currentLevelLabel: string;

  totalPages: number;
  totalReportCount: number;
  reports: MyReportItemResponse[];
};
