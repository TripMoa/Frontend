// src/features/workspace/components/voucher/VoucherView.tsx
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

  return (
    <div id="view-voucher" className="content-view active">
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
                    onDelete(v.voucherId);
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
    </div>
  );
};

export default VoucherView;
