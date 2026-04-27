// src/features/user/components/modal/VerifyModal.tsx

import React from "react";
import { Shield, X } from "lucide-react";
import { MODAL_MESSAGES } from "../../hooks/User.constant";
import styles from "../../styles/UserSetting.module.css";

type VerifyModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function VerifyModal({
  open,
  onClose,
  onConfirm,
}: VerifyModalProps) {
  if (!open) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalCloseBtn} onClick={onClose}>
          <X size={20} />
        </button>

        <div className={styles.modalIcon}>
          <Shield size={48} />
        </div>

        <h2 className={styles.modalTitle}>{MODAL_MESSAGES.VERIFY.TITLE}</h2>

        <p className={styles.modalText}>
          {MODAL_MESSAGES.VERIFY.DESCRIPTION.split("\n").map((line, i, arr) => (
            <React.Fragment key={i}>
              {i === 2 ? <strong>{line}</strong> : line}
              {i < arr.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>

        <div className={styles.modalButtons}>
          <button className={styles.modalCancelBtn} onClick={onClose}>
            취소
          </button>
          <button className={styles.modalConfirmBtn} onClick={onConfirm}>
            {MODAL_MESSAGES.VERIFY.BUTTON}
          </button>
        </div>
      </div>
    </div>
  );
}
