// src/features/user/pages/FaqPage.tsx

import { ChevronLeft, CircleHelp, MessageCircleQuestion } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "../styles/UserSetting.module.css";

const FAQ_PREVIEW = [
  {
    question: "성인 인증은 어떻게 진행하나요?",
    answer: "생년월일 등록 후 계정 및 설정 탭에서 인증을 진행할 수 있습니다.",
  },
  {
    question: "회원 탈퇴 시 여행 데이터도 함께 삭제되나요?",
    answer:
      "현재는 프로필 정보만 삭제되며, 일부 여행 데이터는 별도로 보관될 수 있습니다.",
  },
  {
    question: "문의는 어디로 하면 되나요?",
    answer:
      "카카오톡 1:1 문의를 통해 문의 내용을 남겨주시면 순차적으로 답변드립니다.",
  },
];

export default function FaqPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    navigate(location.state?.returnTo ?? "/setting", {
      replace: true,
      state: {
        activeTab: location.state?.activeTab ?? "계정 및 설정",
        closeTo: location.state?.closeTo ?? "/",
      },
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.ticket}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleBack}
            title="뒤로가기"
          >
            <ChevronLeft size={24} />
          </button>

          <div className={styles.headerContent}>
            <h1 className={styles.title}>FAQ</h1>
            <p className={styles.desc} style={{ marginTop: "8px" }}>
              자주 묻는 질문을 한곳에서 빠르게 확인할 수 있도록 준비 중입니다.
            </p>
          </div>
        </div>

        <section className={styles.section}>
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "24px",
              background: "#fff",
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                background: "#f4f7fb",
              }}
            >
              <CircleHelp size={28} />
            </div>

            <h2
              style={{
                textAlign: "center",
                fontSize: "20px",
                fontWeight: 700,
                marginBottom: "10px",
              }}
            >
              FAQ 페이지 준비 중
            </h2>

            <p
              style={{
                textAlign: "center",
                color: "#6b7280",
                lineHeight: 1.6,
                marginBottom: "20px",
              }}
            >
              계정, 인증, 문의, 이용 방법과 관련한 자주 묻는 질문을
              <br />
              보기 쉽게 정리해 제공할 예정입니다.
            </p>

            <div style={{ display: "grid", gap: "12px", marginBottom: "20px" }}>
              {FAQ_PREVIEW.map((item) => (
                <div
                  key={item.question}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    background: "#f9fafb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                      fontWeight: 700,
                      marginBottom: "8px",
                    }}
                  >
                    <MessageCircleQuestion size={18} />
                    <span>{item.question}</span>
                  </div>
                  <p style={{ color: "#6b7280", lineHeight: 1.6 }}>
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleBack}
              >
                계정 및 설정으로 돌아가기
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
