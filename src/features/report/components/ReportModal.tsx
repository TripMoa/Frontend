// src/features/report/components/ReportModal.tsx

import { useState } from "react";
import "../styles/ReportModal.css";

interface ReportModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (reason: string, detail: string) => Promise<void> | void;
  targetType?: "댓글" | "채팅";
  targetAuthor?: string;
  targetContent?: string;
}

const REPORT_REASONS = [
  "상업적/홍보성",
  "음란/선정성",
  "불법정보",
  "욕설/인신공격",
  "개인정보노출",
];

function ReportModal({
  show,
  onClose,
  onSubmit,
  targetType = "댓글",
  targetAuthor,
  targetContent,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!show) return null;

  const reset = () => {
    setSelectedReason(null);
    setDetail("");
    setSubmitted(false);
    setError(null);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!selectedReason || loading) return;

    setLoading(true);
    setError(null);

    try {
      await onSubmit(selectedReason, detail.trim());
      setSubmitted(true);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "신고 처리 중 오류가 발생했습니다.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <div className="report-overlay" onClick={handleClose}>
      <div className="report-container" onClick={(e) => e.stopPropagation()}>
        <div className="report-header">
          <span className="report-title">{">>"} 신고하기</span>
          <button className="report-close-btn" onClick={handleClose}>
            CLOSE [X]
          </button>
        </div>

        {submitted ? (
          <div className="report-body">
            <div className="report-done">
              <p>신고가 접수되었습니다.</p>
              <button className="report-btn-submit" onClick={handleClose}>
                확인
              </button>
            </div>
          </div>
        ) : (
          <div className="report-body">
            <p className="report-desc">{targetType} 신고 사유를 선택해주세요</p>

            {(targetAuthor || targetContent) && (
              <div className="report-target-info">
                {targetAuthor && (
                  <div className="report-target-row">
                    <span className="report-target-label">작성자</span>
                    <span className="report-target-value">{targetAuthor}</span>
                  </div>
                )}

                {targetContent && (
                  <div className="report-target-row">
                    <span className="report-target-label">내용</span>
                    <span className="report-target-value">{targetContent}</span>
                  </div>
                )}
              </div>
            )}

            <div className="report-reasons">
              {REPORT_REASONS.map((reason) => (
                <div
                  key={reason}
                  className={`report-reason-item ${
                    selectedReason === reason ? "selected" : ""
                  }`}
                  onClick={() => setSelectedReason(reason)}
                >
                  <div className="report-radio" />
                  <span className="report-reason-label">{reason}</span>
                </div>
              ))}
            </div>

            <label className="report-detail-label">추가 설명 (선택)</label>
            <textarea
              className="report-detail"
              placeholder="신고 내용을 자세히 적어주세요..."
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              maxLength={500}
            />

            {error && <p className="report-error">{error}</p>}

            <div className="report-footer">
              <button
                className="report-btn-cancel"
                onClick={handleClose}
                disabled={loading}
              >
                취소
              </button>
              <button
                className={`report-btn-submit ${
                  !selectedReason || loading ? "disabled" : ""
                }`}
                onClick={handleSubmit}
                disabled={!selectedReason || loading}
              >
                {loading ? "처리 중..." : "신고하기"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportModal;
