// src/features/user/components/AccountSuspendedNotice.tsx

import { useState } from "react";

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
      ? "복사했어요"
      : copyStatus === "error"
        ? `문의 이메일: ${supportEmail}`
        : "이메일 복사하기";

  return (
    <>
      <h1 className="tm-center__title">계정 이용 제한</h1>
      <p className="tm-center__desc">
        신고 정책에 따라 현재 계정 이용이 제한되었습니다.
        <br />
        이의 신청이나 문의가 필요한 경우 아래 이메일로 문의해주세요.
      </p>

      <div className="tm-invite">
        <code>{supportEmail}</code>
      </div>

      <div className="tm-center__actions">
        <button type="button" className="tm-btn" onClick={copyEmail}>
          {copyLabel}
        </button>
        <button type="button" className="tm-btn tm-btn--link" onClick={onBack}>
          로그인으로 돌아가기
        </button>
      </div>
    </>
  );
}
