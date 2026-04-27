// src/features/user/pages/NoticePage.tsx

import { Bell, ChevronLeft, Megaphone } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "../styles/UserSetting.module.css";

export default function NoticePage() {
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
            <h1 className={styles.title}>공지사항</h1>
            <p className={styles.desc} style={{ marginTop: "8px" }}>
              TripMoa의 서비스 소식과 운영 안내를 확인할 수 있는 공간입니다.
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
              <Bell size={28} />
            </div>

            <h2
              style={{
                textAlign: "center",
                fontSize: "20px",
                fontWeight: 700,
                marginBottom: "10px",
              }}
            >
              공지사항 페이지 준비 중
            </h2>

            <p
              style={{
                textAlign: "center",
                color: "#6b7280",
                lineHeight: 1.6,
                marginBottom: "20px",
              }}
            >
              현재 TripMoa 공지사항 기능을 정리하고 있습니다.
              <br />
              서비스 업데이트, 점검 일정, 주요 변경사항을
              <br />
              이곳에서 가장 먼저 안내드릴 예정입니다.
            </p>

            <div
              style={{
                display: "grid",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  background: "#f9fafb",
                }}
              >
                <Megaphone size={18} />
                <span>서비스 점검 및 업데이트 안내 제공 예정</span>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  background: "#f9fafb",
                }}
              >
                <Bell size={18} />
                <span>주요 기능 변경 및 운영 정책 공지 예정</span>
              </div>
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
