// src/features/workspace/components/voucher/VoucherView.tsx
import { useState } from "react";
import { ActionPromptModal } from "../../../../shared/components/ActionPromptModal";
import "../../styles/center.css";
import type { VoucherResponse } from "../../../../types/voucher.types";
import { useTripContext } from "../../hooks/useTripContext";

interface Props {
  vouchers: VoucherResponse[];
  onAdd: () => void;
  onDelete: (id: number) => void;
  onDownload: (id: number) => void;
  onPreview: (id: number) => void;
}

const getVoucherIcon = (type: string) => {
  if (type === "AIR") return "fa-plane";
  if (type === "HTL") return "fa-hotel";
  return "fa-ticket";
};

const getFileIcon = (fileType: string) => {
  if (fileType === "PDF") return "fa-file-pdf";
  return "fa-image";
};

const formatMeta = (createdAt: string) => {
  return new Date(createdAt).toLocaleDateString();
};

/**
 * VoucherView
 * - 백엔드 바우처 응답 기준 렌더링
 */
const VoucherView: React.FC<Props> = ({
  vouchers,
  onAdd,
  onDelete,
  onDownload,
  onPreview,
}) => {
  const { isOwner } = useTripContext();

  const [deletePrompt, setDeletePrompt] = useState({
    open: false,
    voucherId: null as number | null,
  });

  const [noticePrompt, setNoticePrompt] = useState({
    open: false,
    headline: "",
    description: "",
  });

  const closeNoticePrompt = () => {
    setNoticePrompt((prev) => ({ ...prev, open: false }));
    setDeletePrompt({ open: false, voucherId: null });
  };

  const getErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.message ?? error?.message ?? fallback;

  const requestDeleteVoucher = (voucherId: number) => {
    if (!isOwner) {
      setNoticePrompt({
        open: true,
        headline: "삭제 권한이 없습니다.",
        description: "문서 삭제는 여행 소유주만 할 수 있습니다.",
      });
      return;
    }

    setDeletePrompt({
      open: true,
      voucherId,
    });
  };

  const confirmDeleteVoucher = async () => {
    if (deletePrompt.voucherId == null) return;

    try {
      await onDelete(deletePrompt.voucherId);
      setDeletePrompt({ open: false, voucherId: null });
    } catch (error: any) {
      setDeletePrompt({ open: false, voucherId: null });
      setNoticePrompt({
        open: true,
        headline: "문서 삭제 실패",
        description: getErrorMessage(error, "문서 삭제에 실패했습니다."),
      });
    }
  };

  return (
    <>
      <h2
        style={{
          fontSize: "24px",
          fontWeight: 800,
          marginBottom: "20px",
        }}
      >
        TRAVEL DOCS
      </h2>

      <div className="voucher-grid" id="voucher-list-container">
        {vouchers.map((v) => (
          <div className="v-ticket" key={v.voucherId}>
            <div className="v-stub">
              <i className={`fa-solid ${getVoucherIcon(v.type)}`}></i>
              <span>{v.type}</span>
            </div>

            <div
              className="v-body"
              onClick={() => onPreview(v.voucherId)}
              style={{ cursor: "pointer", flex: 1, padding: "0 15px" }}
              title="미리보기"
            >
              <div className="v-title" style={{ fontWeight: "bold" }}>
                {v.title}
              </div>
              <div
                className="v-desc"
                style={{ fontSize: "12px", color: "#666" }}
              >
                {v.description ?? "-"}
              </div>
              <div
                className="v-meta"
                style={{ fontSize: "10px", color: "#999", marginTop: "5px" }}
              >
                {formatMeta(v.createdAt)}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <button
                className="v-btn"
                style={{
                  flex: 1,
                  borderBottom: isOwner ? "1px solid #000" : undefined,
                }}
                onClick={() => onDownload(v.voucherId)}
                title="다운로드"
              >
                <i className={`fa-solid ${getFileIcon(v.fileType)}`}></i>
                {v.fileType ? ` ${v.fileType.toUpperCase()}` : " FILE"}
              </button>

              {isOwner && (
                <button
                  className="v-btn"
                  style={{
                    flex: 1,
                    background: "#fff",
                    color: "#d32f2f",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    requestDeleteVoucher(v.voucherId);
                  }}
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="v-ticket upload" onClick={onAdd}>
          <i
            className="fa-solid fa-plus"
            style={{
              fontSize: "24px",
              marginBottom: "10px",
            }}
          ></i>
          <span>UPLOAD NEW DOC</span>
        </div>
      </div>

      <ActionPromptModal
        open={deletePrompt.open}
        title="문서 삭제"
        headline="문서를 삭제할까요?"
        description="삭제한 문서는 다시 복구할 수 없습니다."
        cancelText="취소"
        confirmText="삭제"
        onClose={() => setDeletePrompt({ open: false, voucherId: null })}
        onConfirm={() => void confirmDeleteVoucher()}
      />

      <ActionPromptModal
        open={noticePrompt.open}
        title="안내"
        headline={noticePrompt.headline}
        description={noticePrompt.description}
        hideCancel
        confirmText="확인"
        onClose={closeNoticePrompt}
        onConfirm={closeNoticePrompt}
      />
    </>
  );
};

export default VoucherView;
