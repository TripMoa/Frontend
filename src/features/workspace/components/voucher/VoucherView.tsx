// src/features/workspace/components/voucher/VoucherView.tsx
//
// 바우처(문서) 목록 — 디자인 기준(시안): 윗줄에 "문서 N" + [+ 문서 추가], 아래에 오른쪽 점선 칸이 있는 티켓 카드 목록.
// 카드를 누르면 파일을 새 탭에서 열고, 카드 안 링크로 다운로드 · 삭제(소유주)를 한다.
import { useState } from "react";
import type { VoucherResponse } from "../../../../types/voucher.types";
import { useTripContext } from "../../hooks/useTripContext";
import { apiMessage } from "../../hooks/apiError";
import type { ScheduleItemOption } from "../../../../types/scheduleItemOption.types";
import WsConfirm from "../layout/WsConfirm";

interface Props {
  vouchers: VoucherResponse[];
  onAdd: () => void;
  onDelete: (id: number) => void;
  onDownload: (id: number) => void;
  onPreview: (id: number) => void;
  scheduleItemOptions?: ScheduleItemOption[];
}

const KIND_LABEL: Record<string, string> = { AIR: "항공권", HTL: "숙소", TKT: "티켓", ETC: "기타" };

const formatMeta = (createdAt: string) => {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} 등록`;
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
  scheduleItemOptions = [],
}) => {
  const { isOwner } = useTripContext();

  const scheduleItemLabelById = new Map(scheduleItemOptions.map((opt) => [opt.id, `${opt.day} · ${opt.title}`]));

  const [deletePrompt, setDeletePrompt] = useState({ open: false, voucherId: null as number | null });
  const [noticePrompt, setNoticePrompt] = useState({ open: false, headline: "", description: "" });

  const closeNoticePrompt = () => {
    setNoticePrompt((prev) => ({ ...prev, open: false }));
    setDeletePrompt({ open: false, voucherId: null });
  };

  const requestDeleteVoucher = (voucherId: number) => {
    if (!isOwner) {
      setNoticePrompt({
        open: true,
        headline: "삭제 권한이 없습니다.",
        description: "문서 삭제는 여행 소유주만 할 수 있습니다.",
      });
      return;
    }

    setDeletePrompt({ open: true, voucherId });
  };

  const confirmDeleteVoucher = async () => {
    if (deletePrompt.voucherId == null) return;

    try {
      await onDelete(deletePrompt.voucherId);
      setDeletePrompt({ open: false, voucherId: null });
    } catch (error) {
      setDeletePrompt({ open: false, voucherId: null });
      setNoticePrompt({
        open: true,
        headline: "문서 삭제 실패",
        description: apiMessage(error, "문서 삭제에 실패했습니다."),
      });
    }
  };

  return (
    <>
      <div className="ws-extop ws-vtop">
        <span className="ws-cap">
          문서<b>{vouchers.length}</b>
        </span>
        <div className="ws-exacts">
          <button type="button" className="tm-btn tm-btn--sm tm-btn--primary" onClick={onAdd}>
            + 문서 추가
          </button>
        </div>
      </div>

      {vouchers.length === 0 ? (
        <div className="tm-empty">
          등록된 문서가 없습니다.
          <br />
          <span className="tm-hint">항공권·숙소·티켓을 올려 두면 여행 중에 바로 열어요.</span>
        </div>
      ) : (
        <div className="ws-vgrid">
          {vouchers.map((v) => {
            const link = v.scheduleItemId != null ? scheduleItemLabelById.get(v.scheduleItemId) : undefined;
            const meta = [v.description ?? "-", formatMeta(v.createdAt)].filter(Boolean).join(" · ");
            return (
              <div
                key={v.voucherId}
                className="tm-ticket tm-ticket--right tm-ticket--click"
                role="button"
                tabIndex={0}
                aria-label={`${v.title} 파일 열기`}
                onClick={() => void onPreview(v.voucherId)}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    void onPreview(v.voucherId);
                  }
                }}
              >
                <div className="tm-ticket__main">
                  <div className="tm-ticket__title">{v.title}</div>
                  <div className="tm-ticket__meta">{meta}</div>
                  {link && <div className="tm-hint tm-mt-1">연결 {link}</div>}
                  <div className="tm-row tm-gap-2 tm-mt-2">
                    <button
                      type="button"
                      className="tm-btn tm-btn--link tm-btn--sm ws-ulink"
                      onClick={(e) => {
                        e.stopPropagation();
                        void onDownload(v.voucherId);
                      }}
                    >
                      다운로드
                    </button>
                    {isOwner && (
                      <button
                        type="button"
                        className="tm-btn tm-btn--link tm-btn--sm ws-ulink ws-ulink--danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDeleteVoucher(v.voucherId);
                        }}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
                <div className="tm-ticket__stub">
                  <b>{KIND_LABEL[v.type] ?? v.type}</b>
                  {v.fileType && <span>{v.fileType.toUpperCase()}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <WsConfirm
        open={deletePrompt.open}
        title="문서 삭제"
        headline="문서를 삭제할까요?"
        description="삭제한 문서는 다시 복구할 수 없습니다."
        cancelText="취소"
        confirmText="삭제"
        danger
        onClose={() => setDeletePrompt({ open: false, voucherId: null })}
        onConfirm={() => void confirmDeleteVoucher()}
      />

      <WsConfirm
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
