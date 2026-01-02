import { useMemo, useState } from "react";
import { useWorkspaceCore } from "./useWorkspaceCore";
import type { NoticeColor, NoticeItem } from "./useWorkspaceCore";

export interface UseNoticesStore {
  notices: NoticeItem[];
  editId: number | null; // index 대신 id를 관리
  editingNotice: NoticeItem | null;
  allTags: string[];
  togglePin: (id: number) => void;
  deleteTag: (tag: string) => void;
  openAdd: () => void;
  openEdit: (id: number) => void;
  closeNotice: () => void;
  saveNotice: (item: NoticeItem) => void;
  deleteNotice: (id: number) => void;
  defaultColor: NoticeColor;
}

export const useNotices = (): UseNoticesStore => {
  const { noticeGroups, currentNoticeGroup, updateNotices } =
    useWorkspaceCore();

  // ✅ 1. 저장소(Core)에 있는 '원본 순서' 데이터
  const currentGroupNotices = useMemo<NoticeItem[]>(() => {
    const group = noticeGroups.find((g) => g.name === currentNoticeGroup);
    return group ? group.notices : [];
  }, [noticeGroups, currentNoticeGroup]);

  // ✅ 2. 화면 출력용: 고정(Pin)된 메모를 상단으로 정렬
  const notices = useMemo(() => {
    return [...currentGroupNotices].sort(
      (a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)
    );
  }, [currentGroupNotices]);

  // ✅ 3. 수정/삭제 시 인덱스 버그를 막기 위해 id를 상태로 관리
  const [editId, setEditId] = useState<number | null>(null);

  // ✅ 4. 네이버 스타일 태그 로직 (생략되었던 부분 포함)
  const [removedTags, setRemovedTags] = useState<string[]>(() => {
    const saved = localStorage.getItem("tripmoa_removed_tags");
    return saved ? JSON.parse(saved) : [];
  });

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    noticeGroups.forEach((group) => {
      group.notices.forEach((notice) => {
        const t = notice.tag.trim();
        // 삭제되지 않은 태그만 목록에 노출
        if (t && !removedTags.includes(t)) tags.add(t);
      });
    });
    return Array.from(tags);
  }, [noticeGroups, removedTags]);

  const deleteTag = (tag: string) => {
    const next = [...removedTags, tag];
    setRemovedTags(next);
    localStorage.setItem("tripmoa_removed_tags", JSON.stringify(next));
  };

  // ✅ 5. 모달 제어 함수 (ID 기반)
  const openAdd = () => setEditId(-1);
  const openEdit = (id: number) => setEditId(id);
  const closeNotice = () => setEditId(null);

  const editingNotice = useMemo(() => {
    if (editId === null || editId === -1) return null;
    return currentGroupNotices.find((n) => n.id === editId) || null;
  }, [editId, currentGroupNotices]);

  // ✅ 6. 고정 토글: 원본 배열(currentGroupNotices)에서 id로 찾아 상태 변경
  const togglePin = (id: number) => {
    const next = currentGroupNotices.map((n) =>
      n.id === id ? { ...n, isPinned: !n.isPinned } : n
    );
    updateNotices(currentNoticeGroup, next);
  };

  // ✅ 7. 저장 로직: 원본 순서를 유지하며 데이터 갱신
  const saveNotice = (item: NoticeItem) => {
    const isNew = editId === -1;
    const payload = {
      ...item,
      id: isNew ? Date.now() : item.id || (editId as number),
    };

    const next = isNew
      ? [...currentGroupNotices, { ...payload, isPinned: false }] // 새 메모는 하단 추가
      : currentGroupNotices.map((n) =>
          n.id === editId ? { ...n, ...payload } : n
        ); // 기존 메모 수정

    updateNotices(currentNoticeGroup, next);
    setEditId(null);
  };

  // ✅ 8. 삭제 로직: id로 필터링
  const deleteNotice = (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const next = currentGroupNotices.filter((n) => n.id !== id);
    updateNotices(currentNoticeGroup, next);
  };

  return {
    notices,
    editId,
    editingNotice,
    allTags,
    togglePin,
    deleteTag,
    openAdd,
    openEdit,
    closeNotice,
    saveNotice,
    deleteNotice,
    defaultColor: "white",
  };
};
