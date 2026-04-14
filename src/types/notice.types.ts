// src/types/notice.types.ts

// ===================
// Enum / Literal Types
// ===================

export type NoticeColor = "WHITE" | "YELLOW" | "BLUE" | "GREEN";

// ===================
// Group Request DTO
// ===================

export type NoticeGroupCreateRequest = {
  name: string;
  sortOrder?: number;
};

export type NoticeGroupRenameRequest = {
  name: string;
};

// ===================
// Group Response DTO
// ===================

export type NoticeGroupResponse = {
  groupId: number;
  tripId: number;
  name: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

// ===================
// Item Request DTO
// ===================

export type NoticeItemCreateRequest = {
  noticeGroupId: number;
  color: NoticeColor;
  tag?: string;
  title: string;
  content: string;
};

export type NoticeItemUpdateRequest = {
  noticeGroupId: number;
  color: NoticeColor;
  tag?: string;
  title: string;
  content: string;
};

// ===================
// Item Response DTO
// ===================

export type NoticeItemResponse = {
  noticeItemId: number;
  noticeGroupId: number;
  createdByUserId: number;
  updatedByUserId: number | null;
  color: NoticeColor;
  tag: string | null;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};

// ===================
// Tag Response DTO
// ===================

export type NoticeTagResponse = {
  tagId: number;
  tripId: number;
  name: string;
  createdAt: string;
};
