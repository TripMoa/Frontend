import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import "../../styles/voucherModal.css";
import BaseModal from "../../../../shared/components/BaseModal";
import { ActionPromptModal } from "../../../../shared/components/ActionPromptModal";

import type {
  VoucherCreateRequest,
  VoucherResponse,
  VoucherType,
} from "../../../../types/voucher.types";

interface Props {
  onClose: () => void;
  onSave: (
    request: VoucherCreateRequest,
    file?: File,
  ) => Promise<VoucherResponse> | void;
  initialData?: VoucherResponse | null;
  isEditMode?: boolean;
}

const VoucherModal: React.FC<Props> = ({
  onClose,
  onSave,
  initialData = null,
  isEditMode = false,
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [type, setType] = useState<VoucherType>(initialData?.type ?? "AIR");
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [desc, setDesc] = useState(initialData?.description ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const [submitted, setSubmitted] = useState(false);

  const [noticePrompt, setNoticePrompt] = useState({
    open: false,
    headline: "",
    description: "",
  });

  const titleError = submitted && !title.trim();
  const fileError = submitted && !isEditMode && !file;

  const showNotice = (headline: string, description = "") => {
    setNoticePrompt({ open: true, headline, description });
  };

  const closeNoticePrompt = () => {
    setNoticePrompt((prev) => ({ ...prev, open: false }));
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      showNotice(
        "파일 용량 초과",
        "첨부 파일은 10MB 이하만 업로드 가능합니다.",
      );
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
    };

    try {
      setSaving(true);
      await onSave(request, file ?? undefined);
      onClose();
    } catch (error: any) {
      showNotice(
        isEditMode ? "문서 수정 실패" : "문서 등록 실패",
        error?.response?.data?.message ??
          error?.message ??
          "문서 저장에 실패했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <BaseModal
        open={true}
        title={isEditMode ? "EDIT DOCUMENT" : "ADD DOCUMENT"}
        onClose={onClose}
        className="vm-modal"
        width="min(560px, 92vw)"
      >
        <div className="vm-body">
          {/* FILE */}
          <div className="vm-field">
            <label>FILE UPLOAD</label>

            <input
              ref={fileRef}
              type="file"
              className="vm-file-hidden"
              onChange={handleFile}
            />

            <div className={`vm-file-row ${fileError ? "is-error" : ""}`}>
              <button
                type="button"
                className="vm-file-trigger"
                onClick={() => fileRef.current?.click()}
              >
                파일 선택
              </button>

              <div className={`vm-file-display ${fileError ? "is-error" : ""}`}>
                {fileError
                  ? "파일을 첨부해주세요."
                  : file
                    ? file.name
                    : initialData?.fileName
                      ? `현재 파일: ${initialData.fileName}`
                      : "선택된 파일 없음"}
              </div>
            </div>
          </div>

          {/* TYPE */}
          <div className="vm-field">
            <label>TYPE</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as VoucherType)}
            >
              <option value="AIR">항공권 (Flight)</option>
              <option value="HTL">숙소 (Hotel)</option>
              <option value="TKT">입장권/티켓</option>
              <option value="ETC">기타</option>
            </select>
          </div>

          {/* TITLE */}
          <div className="vm-field">
            <label>TITLE</label>
            <input
              className={titleError ? "is-error" : ""}
              type="text"
              placeholder={
                titleError ? "제목을 입력해주세요." : "예: 오사카행 항공권"
              }
              value={titleError ? "" : title}
              onChange={(e) => {
                setSubmitted(false);
                setTitle(e.target.value);
              }}
            />
          </div>

          {/* DESC */}
          <div className="vm-field">
            <label>DESCRIPTION</label>
            <input
              type="text"
              placeholder="예: 7C1302 / 10:00 AM"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          {/* SAVE */}
          <button
            type="button"
            className="vm-save"
            onClick={save}
            disabled={saving}
          >
            {saving
              ? "SAVING..."
              : isEditMode
                ? "UPDATE DOCUMENT"
                : "SAVE DOCUMENT"}
          </button>
        </div>
      </BaseModal>

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

export default VoucherModal;
