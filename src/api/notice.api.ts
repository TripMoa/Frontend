// src/api/notice.api.ts

import { api } from "./api";
import type {
  NoticeGroupCreateRequest,
  NoticeGroupRenameRequest,
  NoticeGroupResponse,
  NoticeItemCreateRequest,
  NoticeItemResponse,
  NoticeItemUpdateRequest,
  NoticeTagResponse,
} from "../types/notice.types";

// ===================
// Notice Group API
// ===================

// 공지 그룹 전체 조회
export const getNoticeGroups = (tripId: number) => {
  return api.get<NoticeGroupResponse[]>(`/trips/${tripId}/notice-groups`);
};

// 공지 그룹 상세 조회
export const getNoticeGroup = (tripId: number, groupId: number) => {
  return api.get<NoticeGroupResponse>(
    `/trips/${tripId}/notice-groups/${groupId}`,
  );
};

// 공지 그룹 생성
export const createNoticeGroup = (
  tripId: number,
  request: NoticeGroupCreateRequest,
) => {
  return api.post<NoticeGroupResponse>(
    `/trips/${tripId}/notice-groups`,
    request,
  );
};

// 공지 그룹 이름 수정
export const renameNoticeGroup = (
  tripId: number,
  groupId: number,
  request: NoticeGroupRenameRequest,
) => {
  return api.patch<NoticeGroupResponse>(
    `/trips/${tripId}/notice-groups/${groupId}/name`,
    request,
  );
};

// 공지 그룹 삭제
export const deleteNoticeGroup = (tripId: number, groupId: number) => {
  return api.delete<void>(`/trips/${tripId}/notice-groups/${groupId}`);
};

// ===================
// Notice Item API
// ===================

// 공지 메모 목록 조회
export const getNoticeItems = (tripId: number, groupId: number) => {
  return api.get<NoticeItemResponse[]>(`/trips/${tripId}/notice-items`, {
    params: { groupId },
  });
};

// 공지 메모 상세 조회
export const getNoticeItem = (tripId: number, noticeItemId: number) => {
  return api.get<NoticeItemResponse>(
    `/trips/${tripId}/notice-items/${noticeItemId}`,
  );
};

// 공지 메모 생성
export const createNoticeItem = (
  tripId: number,
  request: NoticeItemCreateRequest,
) => {
  return api.post<NoticeItemResponse>(`/trips/${tripId}/notice-items`, request);
};

// 공지 메모 수정
export const updateNoticeItem = (
  tripId: number,
  noticeItemId: number,
  request: NoticeItemUpdateRequest,
) => {
  return api.patch<NoticeItemResponse>(
    `/trips/${tripId}/notice-items/${noticeItemId}`,
    request,
  );
};

// 공지 메모 삭제
export const deleteNoticeItem = (tripId: number, noticeItemId: number) => {
  return api.delete<void>(`/trips/${tripId}/notice-items/${noticeItemId}`);
};

// 공지 메모 핀 고정
export const pinNoticeItem = (tripId: number, noticeItemId: number) => {
  return api.patch<NoticeItemResponse>(
    `/trips/${tripId}/notice-items/${noticeItemId}/pin`,
  );
};

// 공지 메모 핀 해제
export const unpinNoticeItem = (tripId: number, noticeItemId: number) => {
  return api.patch<NoticeItemResponse>(
    `/trips/${tripId}/notice-items/${noticeItemId}/unpin`,
  );
};

// ===================
// Notice Tag API
// ===================

// 최근 사용 태그 조회
export const getNoticeTags = (tripId: number) => {
  return api.get<NoticeTagResponse[]>(
    `/trips/${tripId}/notice-items/tags/recent`,
  );
};

// 태그 삭제
export const deleteNoticeTag = (tripId: number, tagId: number) => {
  return api.delete<void>(`/trips/${tripId}/notice-items/tags/${tagId}`);
};
