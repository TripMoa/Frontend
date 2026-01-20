//src\features\workspace\components\voucher\VoucherView.tsx
import "../../styles/center.css";
import type { VoucherItem } from "../../hooks/useVouchers";

interface Props {
  vouchers: VoucherItem[];
  onAdd: () => void;
  onDelete: (id: number) => void;
  onDownload: (id: number) => void;
  onPreview: (id: number) => void;
}

/**
 * VoucherView
 * - workspace.center.html VOUCHER 영역 1:1 복원
 */
const VoucherView: React.FC<Props> = ({
  vouchers,
  onAdd,
  onDelete,
  onDownload,
  onPreview,
}) => {
  return (
    <div id="view-voucher" className="content-view active">
      {/* TITLE */}
      <h2
        style={{
          fontSize: "24px",
          fontWeight: 800,
          marginBottom: "20px",
        }}
      >
        TRAVEL DOCS
      </h2>

      {/* GRID CONTAINER (⚠️ 매우 중요) */}
      <div className="voucher-grid" id="voucher-list-container">
        {/* ===== DOCUMENT CARDS ===== */}
        {vouchers.map((v) => (
          <div className="v-ticket" key={v.id}>
            <div className="v-stub">
              <i className={`fa-solid ${v.icon}`}></i>
              <span>{v.type}</span>
            </div>

            <div
              className="v-body"
              onClick={() => onPreview(v.id)}
              style={{ cursor: "pointer", flex: 1, padding: "0 15px" }}
              title="클릭하여 미리보기"
            >
              <div className="v-title" style={{ fontWeight: "bold" }}>
                {v.title}
              </div>
              <div
                className="v-desc"
                style={{ fontSize: "12px", color: "#666" }}
              >
                {v.desc}
              </div>
              <div
                className="v-meta"
                style={{ fontSize: "10px", color: "#999", marginTop: "5px" }}
              >
                {v.meta}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {/* 위: 파일/다운로드 */}
              <button
                className="v-btn"
                style={{
                  flex: 1,
                  borderBottom: "1px solid #000", // ✅ 이게 “버튼 사이 선”
                }}
                onClick={() => onDownload(v.id)}
              >
                <i
                  className={`fa-solid ${
                    v.fileType === "pdf" ? "fa-file-pdf" : "fa-image"
                  }`}
                ></i>
                {v.fileType ? ` ${v.fileType.toUpperCase()}` : " FILE"}
              </button>

              {/* 아래: 삭제 */}
              <button
                className="v-btn"
                style={{
                  flex: 1,
                  background: "#fff",
                  color: "#d32f2f",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(v.id);
                }}
              >
                <i className="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        ))}

        {/* ===== UPLOAD CARD (원본 구조 그대로) ===== */}
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
