import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import "../../styles/workspace/modals.css";

import type { VoucherItem, VoucherType } from "../../hooks/useVouchers";

interface Props {
  onClose: () => void;
  onSave: (item: VoucherItem) => void;
}

const VoucherModal: React.FC<Props> = ({ onClose, onSave }) => {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [type, setType] = useState<VoucherType>("AIR");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"pdf" | "jpg" | "img">("img");

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("파일 크기가 너무 큽니다. (3MB 이하 권장)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileData(reader.result as string);
      setFileType(file.type.includes("pdf") ? "pdf" : "jpg");
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!title) {
      alert("제목을 입력해주세요.");
      return;
    }

    let icon = "fa-ticket";
    if (type === "AIR") icon = "fa-plane";
    if (type === "HTL") icon = "fa-hotel";

    const item: VoucherItem = {
      id: Date.now(),
      type,
      icon,
      title,
      desc,
      meta: new Date().toLocaleDateString(),
      fileData,
      fileType,
    };

    onSave(item);
    onClose();
  };

  return (
    <div
      className="modal-overlay active"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-window"
        style={{ width: "500px" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="mh-title">&gt;&gt; ADD DOCUMENT</span>
          <button className="mh-close" onClick={onClose}>
            CLOSE [X]
          </button>
        </div>

        <div
          className="modal-body"
          style={{ padding: "20px", background: "#fff" }}
        >
          <div className="inp-row">
            <label>FILE UPLOAD</label>
            <input
              ref={fileRef}
              type="file"
              style={{ width: "100%" }}
              onChange={handleFile}
            />
          </div>

          <div className="inp-row" style={{ marginTop: "10px" }}>
            <label>TYPE</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as VoucherType)}
              style={{ width: "100%", padding: "8px" }}
            >
              <option value="AIR">항공권 (Flight)</option>
              <option value="HTL">숙소 (Hotel)</option>
              <option value="TKT">입장권/티켓</option>
              <option value="ETC">기타</option>
            </select>
          </div>

          <div className="inp-row" style={{ marginTop: "10px" }}>
            <label>TITLE</label>
            <input
              type="text"
              placeholder="예: 오사카행 항공권"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="inp-row" style={{ marginTop: "10px" }}>
            <label>DESCRIPTION</label>
            <input
              type="text"
              placeholder="예: 7C1302 / 10:00 AM"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          <button
            className="btn-save-exp"
            style={{ marginTop: "20px", width: "100%" }}
            onClick={save}
          >
            SAVE DOCUMENT
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoucherModal;
