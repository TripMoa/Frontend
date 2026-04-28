// src/features/workspace/hooks/useNotices.ts
import { useEffect, useMemo, useState } from "react";
import { useTripContext } from "./useTripContext";
import {
  createNoticeItem,
  deleteNoticeItem,
  deleteNoticeTag,
  getNoticeItem,
  getNoticeItems,
  getNoticeTags,
  pinNoticeItem,
  unpinNoticeItem,
  updateNoticeItem,
} from "../../../api/notice.api";
import type {
  NoticeColor as ApiNoticeColor,
  NoticeItemCreateRequest,
  NoticeItemResponse,
  NoticeItemUpdateRequest,
  NoticeTagResponse,
} from "../../../types/notice.types";
import { useWorkspaceCore } from "./useWorkspaceCore";

export type NoticeUiColor = "white" | "yellow" | "blue" | "green";

export interface NoticeItem {
  id: number;
  noticeGroupId: number;
  color: NoticeUiColor;
  tag: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdByUserId: number;
  updatedByUserId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UseNoticesStore {
  notices: NoticeItem[];
  editId: number | null;
  editingNotice: NoticeItem | null;
  allTags: string[];
  isLoading: boolean;
  togglePin: (id: number) => Promise<void>;
  deleteTag: (tag: string) => Promise<void>;
  openAdd: () => void;
  openEdit: (id: number) => Promise<void>;
  closeNotice: () => void;
  saveNotice: (
    item: Pick<NoticeItem, "color" | "tag" | "title" | "content">,
  ) => Promise<void>;
  deleteNotice: (id: number) => Promise<void>;
  defaultColor: NoticeUiColor;
  reloadNotices: () => Promise<void>;
  reloadTags: () => Promise<void>;
}

const toUiColor = (color: ApiNoticeColor): NoticeUiColor => {
  switch (color) {
    case "WHITE":
      return "white";
    case "YELLOW":
      return "yellow";
    case "BLUE":
      return "blue";
    case "GREEN":
      return "green";
    default:
      return "white";
  }
};

const toApiColor = (color: NoticeUiColor): ApiNoticeColor => {
  switch (color) {
    case "white":
      return "WHITE";
    case "yellow":
      return "YELLOW";
    case "blue":
      return "BLUE";
    case "green":
      return "GREEN";
    default:
      return "WHITE";
  }
};

const mapNoticeItem = (item: NoticeItemResponse): NoticeItem => ({
  id: item.noticeItemId,
  noticeGroupId: item.noticeGroupId,
  color: toUiColor(item.color),
  tag: item.tag ?? "",
  title: item.title,
  content: item.content,
  isPinned: item.isPinned,
  createdByUserId: item.createdByUserId,
  updatedByUserId: item.updatedByUserId,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

export const useNotices = (): UseNoticesStore => {
  const { tripId } = useTripContext();

  const { currentNoticeGroupId, reloadNoticeGroups } = useWorkspaceCore();

  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [tags, setTags] = useState<NoticeTagResponse[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [editingNotice, setEditingNotice] = useState<NoticeItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const allTags = useMemo(() => tags.map((tag) => tag.name), [tags]);

  const reloadTags = async () => {
    if (!Number.isFinite(tripId) || tripId <= 0) {
      setTags([]);
      return;
    }

    try {
      const response = await getNoticeTags(tripId);
      setTags(response.data ?? []);
    } catch (error) {
      console.error("공지 태그 조회 실패:", error);
      setTags([]);
    }
  };

  const reloadNotices = async () => {
    if (
      !Number.isFinite(tripId) ||
      tripId <= 0 ||
      currentNoticeGroupId == null
    ) {
      setNotices([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await getNoticeItems(tripId, currentNoticeGroupId);
      const mapped = (response.data ?? []).map(mapNoticeItem);

      const sorted = [...mapped].sort(
        (a, b) => Number(b.isPinned) - Number(a.isPinned),
      );

      setNotices(sorted);
    } catch (error) {
      console.error("공지 아이템 조회 실패:", error);
      setNotices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void reloadTags();
  }, [tripId]);

  useEffect(() => {
    setEditId(null);
    setEditingNotice(null);
    void reloadNotices();
  }, [tripId, currentNoticeGroupId]);

  const openAdd = () => {
    setEditId(-1);
    setEditingNotice(null);
  };

  const openEdit = async (id: number) => {
    if (!Number.isFinite(tripId) || tripId <= 0) return;

    setEditId(id);

    const localTarget = notices.find((notice) => notice.id === id);
    if (localTarget) {
      setEditingNotice(localTarget);
    }

    try {
      const response = await getNoticeItem(tripId, id);
      setEditingNotice(mapNoticeItem(response.data));
    } catch (error) {
      console.error("공지 아이템 상세 조회 실패:", error);
    }
  };

  const closeNotice = () => {
    setEditId(null);
    setEditingNotice(null);
  };

  const saveNotice = async (
    item: Pick<NoticeItem, "color" | "tag" | "title" | "content">,
  ) => {
    if (
      !Number.isFinite(tripId) ||
      tripId <= 0 ||
      currentNoticeGroupId == null
    ) {
      return;
    }

    const payloadBase = {
      noticeGroupId: currentNoticeGroupId,
      color: toApiColor(item.color),
      tag: item.tag.trim() || undefined,
      title: item.title.trim(),
      content: item.content.trim(),
    };

    try {
      if (editId === -1) {
        const request: NoticeItemCreateRequest = payloadBase;
        await createNoticeItem(tripId, request);
      } else if (editId != null) {
        const request: NoticeItemUpdateRequest = payloadBase;
        await updateNoticeItem(tripId, editId, request);
      }

      await Promise.all([reloadNotices(), reloadTags(), reloadNoticeGroups()]);
      closeNotice();
    } catch (error) {
      console.error("공지 저장 실패:", error);
      alert("공지 저장에 실패했습니다.");
    }
  };

  const deleteNotice = async (id: number) => {
    if (!Number.isFinite(tripId) || tripId <= 0) return;
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteNoticeItem(tripId, id);
      await Promise.all([reloadNotices(), reloadTags(), reloadNoticeGroups()]);
    } catch (error) {
      console.error("공지 삭제 실패:", error);
      alert("공지 삭제에 실패했습니다.");
    }
  };

  const togglePin = async (id: number) => {
    if (!Number.isFinite(tripId) || tripId <= 0) return;

    const target = notices.find((notice) => notice.id === id);
    if (!target) return;

    try {
      if (target.isPinned) {
        await unpinNoticeItem(tripId, id);
      } else {
        await pinNoticeItem(tripId, id);
      }

      await reloadNotices();
    } catch (error) {
      console.error("공지 고정 상태 변경 실패:", error);
      alert("공지 고정 상태 변경에 실패했습니다.");
    }
  };

  const deleteTag = async (tag: string) => {
    if (!Number.isFinite(tripId) || tripId <= 0) return;

    const target = tags.find((item) => item.name === tag);
    if (!target) return;

    if (!confirm(`'${tag}' 태그를 삭제하시겠습니까?`)) return;

    try {
      await deleteNoticeTag(tripId, target.tagId);
      await reloadTags();
    } catch (error) {
      console.error("공지 태그 삭제 실패:", error);
      alert("공지 태그 삭제에 실패했습니다.");
    }
  };

  return {
    notices,
    editId,
    editingNotice,
    allTags,
    isLoading,
    togglePin,
    deleteTag,
    openAdd,
    openEdit,
    closeNotice,
    saveNotice,
    deleteNotice,
    defaultColor: "white",
    reloadNotices,
    reloadTags,
  };
};
