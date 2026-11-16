// 문서 추가·수정 — 디자인 기준(시안 vch): 좁은 모달 · 종류 · 제목/설명 · 연결할 일정 · 파일 · [취소][저장]
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import WsConfirm from "../layout/WsConfirm";
import { apiMessage } from "../../hooks/apiError";

import type {
  VoucherCreateRequest,
  VoucherResponse,
  VoucherType,
} from "../../../../types/voucher.types";
import type { ScheduleItemOption } from "../../../../types/scheduleItemOption.types";

interface Props {
  onClose: () => void;
  onSave: (
    request: VoucherCreateRequest,
    file?: File,
  ) => Promise<VoucherResponse> | void;
  initialData?: VoucherResponse | null;
  isEditMode?: boolean;
  scheduleItemOptions?: ScheduleItemOption[];
  initialScheduleItemId?: number | null;
}

const VoucherModal: React.FC<Props> = ({
  onClose,
  onSave,
  initialData = null,
  isEditMode = false,
  scheduleItemOptions = [],
  initialScheduleItemId = null,
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [type, setType] = useState<VoucherType>(initialData?.type ?? "AIR");
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [desc, setDesc] = useState(initialData?.description ?? "");
  const [scheduleItemId, setScheduleItemId] = useState<number | null>(
    initialData?.scheduleItemId ?? initialScheduleItemId ?? null,
  );
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const groupedByDay = scheduleItemOptions.reduce<Record<string, ScheduleItemOption[]>>((acc, opt) => {
    (acc[opt.day] ??= []).push(opt);
    return acc;
  }, {});

  const [submitted, setSubmitted] = useState(false);
  const [noticePrompt, setNoticePrompt] = useState({ open: false, headline: "", description: "" });

  const titleError = submitted && !title.trim();
  const fileError = submitted && !isEditMode && !file;

  const showNotice = (headline: string, description = "") => setNoticePrompt({ open: true, headline, description });
  const closeNoticePrompt = () => setNoticePrompt((prev) => ({ ...prev, open: false }));

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      showNotice("파일 용량 초과", "첨부 파일은 10MB 이하만 업로드 가능합니다.");
      return;
    }

    setSubmitted(false);
    setFile(selectedFile);
  };

  const save = async () => {
    setSubmitted(true);

    if (!title.trim()) return;
    if (!isEditMode && !file) return;

    const request: VoucherCreateRequest = {
      type,
      title: title.trim(),
      description: desc.trim() || undefined,
      scheduleItemId,
    };

    try {
      setSaving(true);
      await onSave(request, file ?? undefined);
      onClose();
    } catch (error) {
      showNotice(isEditMode ? "문서 수정 실패" : "문서 등록 실패", apiMessage(error, "문서 저장에 실패했습니다."));
    } finally {
      setSaving(false);
    }
  };

  const star = <span className="ws-req" aria-hidden="true">*</span>;

  return (
    <>
      <div className="tm-overlay">
        <div
          className="tm-modal tm-modal--narrow"
          role="dialog"
          aria-modal="true"
          aria-label={isEditMode ? "문서 수정" : "문서 추가"}
        >
          <div className="tm-modal__head">
            <h3 className="tm-modal__title">{isEditMode ? "문서 수정" : "문서 추가"}</h3>
            <button type="button" className="tm-btn tm-btn--sm" onClick={onClose}>닫기</button>
          </div>

          <div className="tm-modal__body">
            <div className="ws-fld">
              <label className="ws-when__l" htmlFor="ws-v-k">종류 {star}</label>
              <select
                id="ws-v-k"
                className="tm-select"
                value={type}
                onChange={(e) => setType(e.target.value as VoucherType)}
              >
                <option value="AIR">항공권</option>
                <option value="HTL">숙소</option>
                <option value="TKT">티켓</option>
                <option value="ETC">기타</option>
              </select>
            </div>

            <div className="ws-when ws-when--2 ws-expm__row">
              <div className="ws-when__cell">
                <label className="ws-when__l" htmlFor="ws-v-t">제목 {star}</label>
                <input
                  id="ws-v-t"
                  className={`tm-input ws-when__in${titleError ? " tm-input--error" : ""}`}
                  type="text"
                  placeholder={titleError ? "제목을 입력해주세요." : "예: 오사카행 항공권"}
                  value={titleError ? "" : title}
                  onChange={(e) => {
                    setSubmitted(false);
                    setTitle(e.target.value);
                  }}
                />
              </div>
              <div className="ws-when__cell">
                <label className="ws-when__l" htmlFor="ws-v-d">설명</label>
                <input
                  id="ws-v-d"
                  className="tm-input ws-when__in"
                  type="text"
                  placeholder="예: 7C1302 / 10:00 AM"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>
            </div>

            {scheduleItemOptions.length > 0 && (
              <div className="ws-fld">
                <label className="ws-when__l" htmlFor="ws-v-l">연결할 일정</label>
                <select
                  id="ws-v-l"
                  className="tm-select"
                  value={scheduleItemId ?? ""}
                  onChange={(e) => setScheduleItemId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">연결 안 함</option>
                  {Object.entries(groupedByDay).map(([day, items]) => (
                    <optgroup key={day} label={day}>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.time} · {item.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}

            <div className="ws-fld">
              <span className="ws-when__l">파일 {isEditMode ? null : star}</span>
              <input ref={fileRef} type="file" className="ws-sr" tabIndex={-1} aria-hidden="true" onChange={handleFile} />
              <div className="tm-row tm-gap-2">
                <button type="button" className="tm-btn tm-btn--sm" onClick={() => fileRef.current?.click()}>
                  파일 선택
                </button>
                <span className="tm-hint">
                  {file
                    ? file.name
                    : initialData?.fileName
                    ? `현재 파일: ${initialData.fileName}`
                    : "선택된 파일 없음 · 10MB 이하"}
                </span>
              </div>
              {fileError && <div className="tm-field__error">파일을 첨부해주세요.</div>}
            </div>
          </div>

          <div className="tm-modal__foot">
            <button type="button" className="tm-btn" onClick={onClose}>취소</button>
            <button type="button" className="tm-btn tm-btn--primary" onClick={save} disabled={saving}>
              {saving ? "저장 중..." : isEditMode ? "수정 저장" : "저장"}
            </button>
          </div>
        </div>
      </div>

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

export default VoucherModal;
