import { useState } from 'react';
import ConfirmModal from './ConfirmModal';

interface DraftModalProps {
  show: boolean;
  drafts: any[];
  onClose: () => void;
  onSelectDraft: (draft: any) => void;
  onDeleteDraft: (id: number) => void;
  hoveredDraftId: number | null;
  setHoveredDraftId: (id: number | null) => void;
  deleteHoverId: number | null;
  setDeleteHoverId: (id: number | null) => void;
}

// 임시저장 목록 모달
function DraftModal({
  show,
  drafts,
  onClose,
  onSelectDraft,
  onDeleteDraft,
  hoveredDraftId,
  setHoveredDraftId,
  deleteHoverId,
  setDeleteHoverId
}: DraftModalProps) {
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetDraftId, setTargetDraftId] = useState<number | null>(null);

  if (!show) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--tm-overlay)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 10000
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: 'var(--tm-paper)',
            border: 'var(--tm-bd-thin)',
            boxShadow: 'var(--tm-shadow-float)',
            width: 'min(560px, 100%)',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'var(--tm-font)',
            color: 'var(--tm-ink)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            background: 'var(--tm-paper)',
            color: 'var(--tm-ink)',
            padding: '14px 20px 10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--tm-gap-2)'
          }}>
            <h2 style={{
              fontFamily: 'var(--tm-font)',
              fontSize: '20px',
              fontWeight: 900,
              lineHeight: 1.3,
              letterSpacing: '-.03em',
              margin: 0
            }}>
              {'>> DRAFT LIST'}
            </h2>
            {/* 닫기 */}
            <button
              onClick={onClose}
              style={{
                background: 'var(--tm-paper)',
                border: 'var(--tm-bd-thin)',
                color: 'var(--tm-ink)',
                height: 'var(--tm-h-btn-sm)',
                padding: '0 12px',
                fontSize: 'var(--tm-fs-sm)',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'var(--tm-font)',
                transition: 'background .12s, color .12s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--tm-ink)';
                e.currentTarget.style.color = 'var(--tm-paper)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--tm-paper)';
                e.currentTarget.style.color = 'var(--tm-ink)';
              }}
            >
              CLOSE [X]
            </button>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '4px 20px 16px',
            background: 'var(--tm-paper)'
          }}>
            {/* 목록 */}
            <div style={{ borderTop: drafts.length > 0 ? 'var(--tm-bd-soft)' : 'none' }}>
              {drafts.map((draft: any) => (
                <div
                  key={draft.id}
                  onMouseEnter={() => setHoveredDraftId(draft.id)}
                  onMouseLeave={() => {
                    setHoveredDraftId(null);
                    setDeleteHoverId(null);
                  }}
                  style={{
                    position: 'relative',
                    padding: '12px 4px',
                    borderBottom: 'var(--tm-bd-soft)',
                    cursor: 'pointer',
                    transition: 'background .12s',
                    background: hoveredDraftId === draft.id ? 'var(--tm-yellow-soft)' : 'var(--tm-paper)'
                  }}
                >
                  <div onClick={() => onSelectDraft(draft)}>
                    <div style={{
                      fontSize: 'var(--tm-fs-md)',
                      fontWeight: 800,
                      lineHeight: 1.4,
                      marginBottom: '2px',
                      color: 'var(--tm-ink)',
                      fontFamily: 'var(--tm-font)',
                      paddingRight: '40px'
                    }}>
                      {draft.title}
                    </div>
                    <div style={{
                      fontSize: 'var(--tm-fs-sm)',
                      color: 'var(--tm-mute)',
                      fontFamily: 'var(--tm-font)',
                      fontWeight: 600
                    }}>
                      {draft.date}
                    </div>
                  </div>

                  {hoveredDraftId === draft.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTargetDraftId(draft.id);
                        setShowDeleteModal(true);
                      }}
                      onMouseEnter={() => setDeleteHoverId(draft.id)}
                      onMouseLeave={() => setDeleteHoverId(null)}
                      aria-label="임시저장 삭제"
                      style={{
                        position: 'absolute',
                        top: '50%',
                        right: '4px',
                        transform: 'translateY(-50%)',
                        width: 'var(--tm-h-btn-sm)',
                        height: 'var(--tm-h-btn-sm)',
                        background: deleteHoverId === draft.id ? 'var(--tm-red)' : 'var(--tm-paper)',
                        border: deleteHoverId === draft.id ? '1.5px solid var(--tm-red)' : '1.5px solid var(--tm-ink)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background .12s'
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3 6h18M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2m3 0v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6h14z"
                          stroke={deleteHoverId === draft.id ? 'var(--tm-paper)' : 'var(--tm-red)'}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10 11v6M14 11v6"
                          stroke={deleteHoverId === draft.id ? 'var(--tm-paper)' : 'var(--tm-red)'}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* 빈 화면 */}
            {drafts.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '46px 20px',
                color: '#777',
                fontSize: 'var(--tm-fs-md)',
                fontFamily: 'var(--tm-font)',
                fontWeight: 700,
                lineHeight: 1.6
              }}>
                임시저장된 글이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        show={showDeleteModal}
        title="임시저장 삭제"
        message={`임시저장 글을 삭제하시겠습니까?\n삭제된 글은 복구되지 못합니다.`}
        confirmText="삭제"
        cancelText="취소"
        onConfirm={() => {
          if (targetDraftId !== null) {
            onDeleteDraft(targetDraftId);
          }
          setShowDeleteModal(false);
          setTargetDraftId(null);
        }}
        onCancel={() => {
          setShowDeleteModal(false);
          setTargetDraftId(null);
        }}
      />
    </>
  );
}

export default DraftModal;
