import { useEffect, useMemo, useState } from "react";
import { useWorkspaceCore } from "./useWorkspaceCore";
import type { NoticeColor, NoticeItem, NoticeGroup } from "./useWorkspaceCore";

/* localStorage key (절대 변경 ❌) */
const LS_NOTICE_GROUPS = "tripmoa_notice_groups";

const safeParseGroups = (raw: string | null): NoticeGroup[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as NoticeGroup[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export interface UseNoticesStore {
  notices: NoticeItem[];
  /**
   * - null  : 모달 닫힘
   * - -1    : 새 공지(add) 모드
   * - 0..n  : 수정(edit) 모드
   */
  editIndex: number | null;
  editingNotice: NoticeItem | null;
  openAdd: () => void;
  openEdit: (idx: number) => void;
  closeNotice: () => void;
  saveNotice: (item: NoticeItem) => void;
  deleteNotice: (idx: number) => void;
  defaultColor: NoticeColor;
}

export const useNotices = (): UseNoticesStore => {
  const { noticeGroups, currentNoticeGroup } = useWorkspaceCore();

  const currentGroupNotices = useMemo<NoticeItem[]>(() => {
    const group = noticeGroups.find((g) => g.name === currentNoticeGroup);
    return group ? group.notices : [];
  }, [noticeGroups, currentNoticeGroup]);

  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  useEffect(() => {
    setNotices(currentGroupNotices);
  }, [currentGroupNotices]);

  const writeGroupNoticesToStorage = (nextNotices: NoticeItem[]) => {
    const stored = safeParseGroups(localStorage.getItem(LS_NOTICE_GROUPS));

    const hasGroup = stored.some((g) => g.name === currentNoticeGroup);
    const nextGroups: NoticeGroup[] = hasGroup
      ? stored.map((g) =>
          g.name === currentNoticeGroup ? { ...g, notices: nextNotices } : g
        )
      : [...stored, { name: currentNoticeGroup, notices: nextNotices }];

    localStorage.setItem(LS_NOTICE_GROUPS, JSON.stringify(nextGroups));
  };

  /** 원본 openNoticeModal() 매핑: 새 공지 모달 열기 */
  const openAdd = () => {
    setEditIndex(-1); // ✅ 새 공지 모드
  };

  const openEdit = (idx: number) => {
    setEditIndex(idx);
  };

  const closeNotice = () => {
    setEditIndex(null);
  };

  const editingNotice =
    editIndex === null || editIndex === -1 ? null : notices[editIndex] ?? null;

  const saveNotice = (item: NoticeItem) => {
    const next =
      editIndex === -1
        ? [...notices, item] // ✅ add
        : editIndex === null
        ? [...notices, item] // 방어 코드(혹시라도 null에서 저장 눌렀을 때)
        : notices.map((n, i) => (i === editIndex ? item : n)); // ✅ edit

    setNotices(next);
    writeGroupNoticesToStorage(next);
    setEditIndex(null); // ✅ 저장 후 닫기
  };

  const deleteNotice = (idx: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const next = notices.filter((_, i) => i !== idx);
    setNotices(next);
    writeGroupNoticesToStorage(next);
  };

  // 모달 기본값용(원본처럼 기본 white)
  const defaultColor: NoticeColor = "white";

  return {
    notices,
    editIndex,
    editingNotice,
    openAdd,
    openEdit,
    closeNotice,
    saveNotice,
    deleteNotice,
    defaultColor,
  };
};
