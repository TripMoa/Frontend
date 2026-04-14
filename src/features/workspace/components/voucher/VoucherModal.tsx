import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import "../../styles/voucherModal.css";
import BaseModal from "../../../../shared/components/BaseModal";

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

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      alert("파일 크기가 너무 큽니다. (10MB 이하)");
      return;
    }

    setFile(selectedFile);
  };

  const save = async () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!isEditMode && !file) {
      alert("파일을 첨부해주세요.");
      return;
    }

    const request: VoucherCreateRequest = {
      type,
      title: title.trim(),
      description: desc.trim() || undefined,
    };

    try {
      setSaving(true);
      await onSave(request, file ?? undefined);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
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

          <div className="vm-file-row">
            <button
              type="button"
              className="vm-file-trigger"
              onClick={() => fileRef.current?.click()}
            >
              파일 선택
            </button>

            <div className="vm-file-display">
              {file
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
            type="text"
            placeholder="예: 오사카행 항공권"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
  );
};

export default VoucherModal;
