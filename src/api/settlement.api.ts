// src/api/settlement.api.ts

import { api } from "./api";
import type {
  SettlementSettingResponse,
  SettlementSummaryResponse,
  SettlementUpdateAllRequest,
} from "../types/settlement.types";

/**
 * 정산 설정 조회
 */
export const getSettlementSetting = (tripId: number) => {
  return api.get<SettlementSettingResponse>(
    `/trips/${tripId}/settlement-setting`,
  );
};

/**
 * 설정 일괄 저장 (설정 적용 버튼 클릭 시)
 */
export const updateSettlementSettings = (
  tripId: number,
  data: SettlementUpdateAllRequest,
) => {
  return api.put<SettlementSettingResponse>(
    `/trips/${tripId}/settlement-setting`,
    data,
  );
};

/**
 * 설정 금액 미리보기 (미리보기 버튼 클릭 시)
 */
export const getSettlementPreview = (
  tripId: number,
  data: SettlementUpdateAllRequest,
) => {
  return api.post<SettlementSummaryResponse>(
    `/trips/${tripId}/settlement-setting/preview`,
    data,
  );
};

/**
 * 현재 설정 기준 정산 요약 조회
 */
export const getSettlementSummary = (tripId: number) => {
  return api.get<SettlementSummaryResponse>(
    `/trips/${tripId}/settlement-setting/summary`,
  );
};
