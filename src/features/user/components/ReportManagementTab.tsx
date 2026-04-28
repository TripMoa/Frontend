// src/features/user/components/ReportManagementTab.tsx

import { useEffect, useState } from "react";
import { getMyReportHistory } from "../../../api/report.api";
import type { MyReportHistoryResponse } from "../../../types";
import styles from "../styles/UserSetting.module.css";

const locationLabel = {
  COMMENT: "댓글",
  CHAT: "채팅",
} as const;

export default function ReportManagementTab() {
  const [reportHistory, setReportHistory] =
    useState<MyReportHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const loadReportHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await getMyReportHistory(page, 5);
        setReportHistory(res.data);
      } catch (err: any) {
        setError(
          err?.response?.data?.message || "신고 내역을 불러오지 못했습니다.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadReportHistory();
  }, [page]);

  const reports = reportHistory?.reports ?? [];

  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>나의 신고 누적 현황</h2>

        {loading && <p>신고 내역을 불러오는 중...</p>}
        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.reportSummary}>
          <div className={styles.statusBox}>
            <span className={styles.statusLabel}>현재 제재 단계</span>
            <span className={styles.statusValue}>
              {reportHistory ? `${reportHistory.currentLevelLabel}` : "-"}
            </span>
          </div>

          <div className={styles.statusBox}>
            <span className={styles.statusLabel}>누적 신고 횟수</span>
            <span className={styles.statusValue}>
              {reportHistory ? `${reportHistory.totalReportCount}회` : "-"}
            </span>
          </div>
        </div>

        <table className={styles.reportTable}>
          <thead>
            <tr>
              <th>위치</th>
              <th>사유</th>
              <th>날짜</th>
            </tr>
          </thead>

          <tbody>
            {!loading && reports.length === 0 && (
              <tr>
                <td colSpan={3}>신고 내역이 없습니다.</td>
              </tr>
            )}

            {reports.map((report) => (
              <tr key={report.reportId}>
                <td>
                  {locationLabel[
                    report.location as keyof typeof locationLabel
                  ] ?? report.location}
                </td>
                <td>{report.reason}</td>
                <td>
                  {new Date(report.reportedAt).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            marginTop: "16px",
          }}
        >
          <button
            disabled={page === 0}
            onClick={() => setPage((prev) => prev - 1)}
          >
            이전
          </button>

          <span>
            {reportHistory ? `${page + 1} / ${reportHistory.totalPages}` : "-"}
          </span>

          <button
            disabled={!reportHistory || page + 1 >= reportHistory.totalPages}
            onClick={() => setPage((prev) => prev + 1)}
          >
            다음
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>신고 및 제재 안내</h2>
        <div className={styles.guideCard}>
          <ul className={styles.guideList}>
            <li>
              <strong>1단계:</strong> 신고자 화면에서 메시지 숨김
            </li>
            <li>
              <strong>2단계:</strong> 전체 화면에서 "신고된 메시지"로 치환
            </li>
            <li>
              <strong>3단계:</strong> 서비스 로그인 시 경고 팝업 노출
            </li>
            <li>
              <strong>4단계:</strong> 계정 상태 '정지' 처리 및 접속 차단
            </li>
          </ul>

          <div className={styles.importantNote}>
            <p className={styles.noteTitle}>
              ⚠️ 여행 계획(Trip) 관련 중요 공지
            </p>
            <p className={styles.noteText}>
              여행 계획 내에서 신고가 누적될 경우,{" "}
              <strong>해당 계획에서 즉시 강제 퇴출</strong>당합니다. 작성하신
              내용은 팀원들을 위해 <strong>'소유주 양도'</strong>로 유지되며,
              퇴출 사실은 팀원들에게 즉시 통보됩니다.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <button
          type="button"
          className={styles.secondaryButton}
          style={{ width: "100%" }}
          onClick={async () => {
            const email = import.meta.env.VITE_SUPPORT_EMAIL;

            try {
              await navigator.clipboard.writeText(email);
              alert(`문의 이메일이 복사되었습니다.\n${email}`);
            } catch {
              alert(`문의 이메일: ${email}`);
            }
          }}
        >
          신고 관련 이메일 문의하기
        </button>
      </section>
    </>
  );
}
