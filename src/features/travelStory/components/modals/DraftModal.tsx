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
  if (!show) return null;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetDraftId, setTargetDraftId] = useState<number | null>(null);

  return (
    <>
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}
        onClick={onClose}
      >
        <div 
          style={{ 
            background: '#fff',
            border: '3px solid #000',
            boxShadow: '15px 15px 0px #000',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '70vh',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            background: '#000',
            color: '#fff',
            padding: '15px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '16px',
              fontWeight: 900,
              letterSpacing: '1px',
              margin: 0
            }}>
              {'>> DRAFT LIST'}
            </h2>
            <button 
              onClick={onClose}
              style={{
                background: 'none',
                border: '1px solid #fff',
                color: '#fff',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'Share Tech Mono', monospace",
                letterSpacing: '0.5px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#fff';
              }}
            >
              CLOSE [X]
            </button>
          </div>

          <div style={{ 
            flex: 1, 
            overflowY: 'auto',
            padding: '30px',
            background: '#fff'
          }}>
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
                  padding: '15px',
                  marginBottom: '15px',
                  border: '2px solid #000',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: '#fff',
                  boxShadow: '4px 4px 0px #000'
                }}
              >
                <div onClick={() => onSelectDraft(draft)}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 900,
                    marginBottom: '6px',
                    color: '#000',
                    fontFamily: "'Share Tech Mono', monospace",
                    paddingRight: '40px'
                  }}>
                    {draft.title}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#999',
                    fontFamily: "'Share Tech Mono', monospace",
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
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: '15px',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 6h18M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2m3 0v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6h14z"
                        stroke={deleteHoverId === draft.id ? '#ff4d4d' : '#999'}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10 11v6M14 11v6"
                        stroke={deleteHoverId === draft.id ? '#ff4d4d' : '#999'}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}

            {drafts.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#999',
                fontSize: '13px',
                fontFamily: "'Share Tech Mono', monospace",
                fontWeight: 600
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