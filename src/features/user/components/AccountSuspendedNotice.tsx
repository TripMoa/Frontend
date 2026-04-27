// src/features/user/components/AccountSuspendedNotice.tsx

import { useState } from "react";
import styles from "../styles/Login.module.css";

type Props = {
  onBack: () => void;
};

export function AccountSuspendedNotice({ onBack }: Props) {
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL;
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(supportEmail);
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
    } finally {
      // 3초 후 상태 초기화
      setTimeout(() => setCopyStatus("idle"), 3000);
    }
  };

  const copyLabel =
    copyStatus === "success"
      ? "✓ 복사되었습니다"
      : copyStatus === "error"
        ? `문의 이메일: ${supportEmail}`
        : "이메일 복사하기";

  return (
    <div className={styles.suspendedBox}>
      <h2>계정 이용 제한</h2>
      <p>신고 정책에 따라 현재 계정 이용이 제한되었습니다.</p>
      <p>이의 신청이나 문의가 필요한 경우 아래 이메일로 문의해주세요.</p>

      <div className={styles.emailBox}>{supportEmail}</div>

      <button type="button" onClick={copyEmail}>
        {copyLabel}
      </button>

      <button type="button" onClick={onBack}>
        로그인으로 돌아가기
      </button>
    </div>
  );
}
