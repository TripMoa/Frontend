// src/types/sanction.types.ts

export type SanctionStatus = "NORMAL" | "WARNING" | "SUSPENDED";

export type MySanctionStatusResponse = {
  level: number;
  totalReports: number;
  status: SanctionStatus;
  showWarningPopup: boolean;
  warningMessage: string | null;
};
