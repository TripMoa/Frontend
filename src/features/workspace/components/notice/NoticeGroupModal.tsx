// src/features/workspace/components/notice/NoticeGroupModal.tsx
//
// "공지 그룹 관리" 창 — 시안(ntag): 좁은 모달 · 안내 한 줄 · 그룹 줄 목록(이름 수정/삭제 링크) · [닫기]
// 예전에는 브라우저 prompt·confirm·alert 로 하던 그룹 추가·이름 수정·삭제를 창 안에서 한다. 소유주만 연다.
import React, { useState } from "react";
import { useWorkspaceCore } from "../../hooks/useWorkspaceCore";
import WsConfirm from "../layout/WsConfirm";

interface Props {
  onClose: () => void;
}

const NoticeGroupModal: React.FC<Props> = ({ onClose }) => {
  const { noticeGroups, createNoticeGroupNamed, renameNoticeGroupNamed, deleteNoticeGroupById } =
    useWorkspaceCore();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ groupId: number; name: string } | null>(null);

  const handleAdd = async () => {
    if (busy || !newName.trim()) return;
    setBusy(true);
    setMessage(null);
    const err = await createNoticeGroupNamed(newName);
    setBusy(false);
    if (err) setMessage(err);
    else setNewName("");
  };

  const handleRename = async (groupId: number) => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    const err = await renameNoticeGroupNamed(groupId, editName);
    setBusy(false);
    if (err) {
      setMessage(err);
      return;
    }
    setEditingId(null);
    setEditName("");
  };

  const handleDelete = async () => {
    if (!deleteTarget || busy) return;
    setBusy(true);
    setMessage(null);
    const err = await deleteNoticeGroupById(deleteTarget.groupId);
    setBusy(false);
    setDeleteTarget(null);
    if (err) setMessage(err);
  };

  return (
    <>
      <div className="tm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div
          className="tm-modal tm-modal--narrow"
          role="dialog"
          aria-modal="true"
          aria-label="공지 그룹 관리"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="tm-modal__head">
            <h3 className="tm-modal__title">공지 그룹 관리</h3>
            <button type="button" className="tm-btn tm-btn--sm" onClick={onClose}>닫기</button>
          </div>

          <div className="tm-modal__body">
            <p className="ws-aidesc ws-ng__desc">기본 그룹은 이름을 바꾸거나 지울 수 없어요.</p>

            <div className="tm-input-group">
              <input
                className="tm-input tm-grow"
                aria-label="새 그룹 이름"
                placeholder="새 그룹 이름"
                value={newName}
                maxLength={20}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleAdd();
                }}
                disabled={busy}
              />
              <button
                type="button"
                className="tm-btn tm-btn--sm tm-btn--primary"
                onClick={() => void handleAdd()}
                disabled={busy || !newName.trim()}
              >
                그룹 추가
              </button>
            </div>

            {message && (
              <p className="tm-hint ws-mem__msg" role="alert" style={{ color: "var(--tm-red-strong)" }}>
                {message}
              </p>
            )}

            <div className="ws-sett ws-sett--tight ws-ng__list">
              {noticeGroups.map((g) => (
                <div key={g.groupId} className="ws-airow ws-airow--pool">
                  {editingId === g.groupId ? (
                    <div className="tm-input-group">
                      <input
                        className="tm-input tm-grow"
                        aria-label="그룹 이름"
                        value={editName}
                        maxLength={20}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void handleRename(g.groupId);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        disabled={busy}
                      />
                      <button
                        type="button"
                        className="tm-btn tm-btn--sm tm-btn--primary"
                        onClick={() => void handleRename(g.groupId)}
                        disabled={busy}
                      >
                        저장
                      </button>
                      <button type="button" className="tm-btn tm-btn--sm" onClick={() => setEditingId(null)}>
                        취소
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="tm-ellipsis">
                        <b>{g.name}</b>
                        {g.isDefault && <span className="tm-hint"> · 기본</span>}
                      </span>
                      {!g.isDefault && (
                        <span className="tm-row tm-gap-2">
                          <button
                            type="button"
                            className="tm-btn tm-btn--link tm-btn--sm ws-ulink"
                            onClick={() => {
                              setEditingId(g.groupId);
                              setEditName(g.name);
                              setMessage(null);
                            }}
                          >
                            이름 수정
                          </button>
                          <button
                            type="button"
                            className="tm-btn tm-btn--link tm-btn--sm ws-ulink ws-ulink--danger"
                            onClick={() => setDeleteTarget({ groupId: g.groupId, name: g.name })}
                          >
                            삭제
                          </button>
                        </span>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="tm-modal__foot">
            <button type="button" className="tm-btn" onClick={onClose}>닫기</button>
          </div>
        </div>
      </div>

      <WsConfirm
        open={!!deleteTarget}
        title="공지 그룹 삭제"
        headline="공지 그룹을 삭제할까요?"
        description={deleteTarget ? `‘${deleteTarget.name}’ 그룹을 삭제해요. 삭제한 그룹은 다시 복구할 수 없어요.` : ""}
        cancelText="취소"
        confirmText="삭제"
        danger
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
};

export default NoticeGroupModal;
