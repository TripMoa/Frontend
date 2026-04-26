import type { ReportLocation } from "../../../types";

export type ReportTargetType = "댓글" | "채팅";

export type ReportTargetInfo = {
  reportedUserId: number;
  location: ReportLocation;
  targetId: number;
  targetAuthor?: string;
  targetContent?: string;
  targetType: ReportTargetType;
};

export type ReportFormValues = {
  reason: string;
  detail: string;
};
