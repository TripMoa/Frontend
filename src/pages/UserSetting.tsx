import React, { useState } from "react";
import { useEffect } from "react";
import {
  Shield,
  Camera,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../hooks/useUserSetting";
import type { UserProfile } from "../hooks/useUserSetting";
import {
  TRAVEL_STYLES,
  MODAL_MESSAGES,
} from "../components/user/User.constant";
import styles from "../styles/user/UserSetting.module.css";

export default function UserSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("내 정보");

  const {
    profile, // 프로필 데이터
    updateProfile, // 업데이트 함수
    hasChanges, // 변경 사항 여부
    isSaving, // 저장 중 상태
    isFormValid, // 유효성 검사
    VALID_MBTI, // 추천 리스트
    saveProfile, // 저장 함수
    regenerateAvatar,
    triggerPhotoUpload,
    toggleTravelStyle,
    verify,
    deleteAccount,
    fileInputRef,
    handlePhotoChange,
  } = useUserProfile();

  // 추천 목록 표시 여부 상태
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 입력값 필터링 (영어만 허용 및 대문자 변환)
  const handleMBTIChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^A-Za-z]/g, "").toUpperCase();
    updateProfile({ mbti: value });
    setShowSuggestions(true);
  };

  const filteredMBTI = VALID_MBTI.filter(
    (type) => profile.mbti && type.startsWith(profile.mbti)
  );

  // 새로고침 경고문
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue =
          "저장하지 않은 변경사항이 있습니다. 정말 나가시겠습니까?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasChanges]);

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 토글 상태
  const [openSections, setOpenSections] = useState({
    social: false, // 소셜 관리 섹션 초기 상태
    notifications: false, // 알림 설정 섹션 초기 상태
  });

  // 섹션 토글 함수
  const toggleSection = (section: "social" | "notifications") => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // 저장 핸들러
  const handleSave = async () => {
    await saveProfile();
    alert(MODAL_MESSAGES.SAVE.SUCCESS);
  };

  // 본인 인증 핸들러
  const handleVerify = async () => {
    await verify();
    setShowVerifyModal(false);
    alert(MODAL_MESSAGES.VERIFY.SUCCESS);
  };

  // 계정 탈퇴 핸들러
  const handleDeleteAccount = () => {
    deleteAccount();
    alert(MODAL_MESSAGES.DELETE.SUCCESS);
    setShowDeleteModal(false);
  };

  // X 버튼 경고문
  const handleClose = () => {
    if (hasChanges) {
      const confirmLeave = window.confirm(
        "수정 중인 변경사항이 있습니다. 저장하지 않고 나가시겠습니까?"
      );
      if (!confirmLeave) return;
    }

    navigate(-1);
  };

  return (
    <div className={styles.page}>
      <div className={styles.ticket}>
        {/* Header */}
        <div className={styles.header}>
          {/* 왼쪽 : 인증 완료 */}
          {profile.isVerified && (
            <div className={styles.verifiedBadge}>
              <Shield size={14} />
              <span>인증 완료</span>
            </div>
          )}
          {/* 오른쪽 : X 버튼 */}
          <button
            className={styles.closeButton}
            onClick={handleClose}
            title="닫기"
          >
            <X size={24} />
          </button>

          <div className={styles.headerContent}>
            <h1 className={styles.title}>MY PAGE</h1>

            {/* 탭 메뉴 구성 */}
            <div className={styles.tabContainer}>
              {["내 정보", "계정 및 설정", "신고 관리"].map((tab) => (
                <button
                  key={tab}
                  className={`${styles.tabItem} ${
                    activeTab === tab ? styles.activeTab : ""
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 내 정보 섹션 */}
        {activeTab === "내 정보" && (
          <>
            <section className={styles.section}>
              {/* 프로필 섹션 */}
              <h2 className={styles.sectionTitle}>프로필 정보</h2>

              <div className={styles.profileRow}>
                <div
                  className={styles.avatar}
                  onClick={regenerateAvatar}
                  title="클릭 시 랜덤 아바타 변경"
                  style={{
                    background: profile.photo
                      ? "transparent"
                      : profile.avatarColor,
                  }}
                >
                  {profile.photo ? (
                    <img src={profile.photo} alt="Profile" />
                  ) : (
                    <span className={styles.avatarEmoji}>
                      {profile.avatarEmoji}
                    </span>
                  )}
                  <div className={styles.avatarOverlay}>
                    <Camera size={20} />
                  </div>
                </div>

                <div className={styles.avatarInfo}>
                  <p className={styles.avatarDesc}>
                    동그란 프로필을 클릭하면 랜덤 아바타로 바뀝니다.
                  </p>
                  <button
                    className={styles.secondaryButton}
                    onClick={triggerPhotoUpload}
                  >
                    대표 사진 업로드
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handlePhotoChange}
                  />
                </div>
              </div>

              <div className={styles.grid}>
                {/* 닉네임 섹션 */}
                <div className={styles.field}>
                  <label className={styles.label}>
                    닉네임<span className={styles.required}>*</span>
                  </label>
                  <input
                    className={`${styles.input} ${
                      !profile.nickname ? styles.inputError : ""
                    }`}
                    value={profile.nickname || ""}
                    placeholder="닉네임은 필수 입력 항목입니다."
                    onChange={(e) =>
                      updateProfile({ nickname: e.target.value })
                    }
                  />
                  {/* 데이터가 없거나 지웠을 때만 표시 */}
                  {!profile.nickname && (
                    <span className={styles.errorText}>
                      닉네임은 필수 입력 사항입니다.
                    </span>
                  )}
                </div>

                {/* 이름: 소셜 데이터 기반 잠금 */}
                <div className={styles.field}>
                  <label className={styles.label}>이름</label>
                  <input
                    className={`${styles.input} ${styles.inputLocked}`}
                    value={profile.name}
                    readOnly
                  />
                </div>

                {/* 알림 수신 이메일 */}
                <div className={styles.field}>
                  <label className={styles.label}>알림 수신 이메일</label>
                  <input
                    className={styles.input}
                    placeholder="example@email.com"
                    value={profile.notificationEmail}
                    onChange={(e) =>
                      updateProfile({ notificationEmail: e.target.value })
                    }
                  />
                </div>

                {/* 성별: 잠금 */}
                <div className={styles.field}>
                  <label className={styles.label}>성별</label>
                  <input
                    className={`${styles.input} ${styles.inputLocked}`}
                    value={profile.gender}
                    readOnly
                  />
                </div>

                {/* 생년월일: 잠금 */}
                <div className={styles.field}>
                  <label className={styles.label}>생년월일</label>
                  <input
                    className={`${styles.input} ${styles.inputLocked}`}
                    type="date"
                    value={profile.birthDate}
                    readOnly
                  />
                </div>

                {/* MBTI: 수정 가능 */}
                <div className={styles.field}>
                  <label className={styles.label}>MBTI</label>
                  <div className={styles.autocompleteWrapper}>
                    <input
                      className={`${styles.input} ${
                        profile.mbti &&
                        !VALID_MBTI.includes(profile.mbti) &&
                        profile.mbti.length === 4
                          ? styles.inputError
                          : ""
                      }`}
                      style={{ width: "100%" }}
                      value={profile.mbti || ""}
                      onChange={handleMBTIChange}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() =>
                        setTimeout(() => setShowSuggestions(false), 200)
                      }
                      placeholder="예: ENFP"
                      maxLength={4}
                    />

                    {showSuggestions &&
                      filteredMBTI.length > 0 &&
                      profile.mbti && (
                        <ul className={styles.suggestionList}>
                          {filteredMBTI.map((type) => (
                            <li
                              key={type}
                              className={styles.suggestionItem}
                              onMouseDown={() => updateProfile({ mbti: type })}
                            >
                              <span className={styles.clockIcon}>👉</span>
                              {type}
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>

                  {/* 잘못된 MBTI 입력 시 경고 */}
                  {profile.mbti &&
                    !VALID_MBTI.includes(profile.mbti) &&
                    profile.mbti.length === 4 && (
                      <span className={styles.errorText}>
                        유효하지 않은 MBTI 유형입니다.
                      </span>
                    )}
                </div>
              </div>

              {/* 여행 스타일 */}
              <div className={styles.travelStyleSection}>
                <label className={styles.label}>여행 스타일</label>
                <p className={styles.desc}>
                  관심있는 여행 스타일을 선택해주세요 (복수 선택 가능)
                </p>
                <div className={styles.travelStyleGrid}>
                  {TRAVEL_STYLES.map((style) => (
                    <button
                      key={style}
                      className={`${styles.travelStyleBtn} ${
                        profile.travelStyles?.includes(style)
                          ? styles.active
                          : ""
                      }`}
                      onClick={() => toggleTravelStyle(style)}
                      type="button"
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* 계정 및 설정 섹션 */}
        {activeTab === "계정 및 설정" && (
          <div className={styles.settingsWrapper}>
            {/* 계정 관리 (아코디언) */}
            <section className={styles.section}>
              <div
                className={styles.accordionHeader}
                onClick={() => toggleSection("social")}
              >
                <h2 className={styles.sectionTitle}>계정 관리</h2>
                {openSections.social ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>

              {openSections.social && (
                <div className={styles.accordionContent}>
                  <div className={styles.socialStatusCard}>
                    <div className={styles.socialItem}>
                      <div className={styles.socialInfo}>
                        <span
                          className={`${styles.socialIcon} ${styles.kakao}`}
                        >
                          K
                        </span>
                        <div className={styles.socialText}>
                          <p className={styles.socialName}>카카오 계정</p>
                          <p className={styles.socialDetail}>
                            {profile.email
                              ? profile.email
                              : "연결된 이메일 정보가 없습니다."}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`${styles.connectionBadge} ${
                          !profile.email ? styles.notConnected : ""
                        }`}
                      >
                        {profile.email ? "연결됨" : "연결 안 됨"}
                      </span>
                    </div>
                    {/* 개인정보 설정 부분 */}
                    <div className={styles.privacyToggleArea}>
                      {[
                        { id: "isPrivateName", label: "이름 공개여부" },
                        { id: "isPrivateAge", label: "나이 공개여부" },
                        { id: "isPrivateGender", label: "성별 공개여부" },
                      ].map((item) => (
                        <div key={item.id} className={styles.toggleRow}>
                          <span>{item.label}</span>
                          <label className={styles.switch}>
                            <input
                              type="checkbox"
                              checked={profile[item.id as keyof UserProfile]}
                              onChange={(e) =>
                                updateProfile({ [item.id]: e.target.checked })
                              }
                            />
                            <span className={styles.slider}></span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* 알림 설정 (아코디언) */}
            <section className={styles.section}>
              <div
                className={styles.accordionHeader}
                onClick={() => toggleSection("notifications")}
              >
                <h2 className={styles.sectionTitle}>알림 설정</h2>
                {openSections.notifications ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>

              {openSections.notifications && (
                <div className={styles.accordionContent}>
                  <div className={styles.settingList}>
                    {[
                      {
                        id: "tripAlert",
                        label: "여행 일정 및 초대 알림",
                        desc: "새로운 팀원 초대 및 일정 변경 알림",
                      },
                      {
                        id: "marketingAgreed",
                        label: "마케팅 정보 수신 동의",
                        desc: "이벤트 및 혜택 정보 안내",
                      },
                      {
                        id: "emailAgreed",
                        label: "이메일 수신 동의",
                        desc: "주요 공지 및 업데이트 리포트",
                      },
                    ].map((item) => (
                      <div key={item.id} className={styles.settingItem}>
                        <div className={styles.settingText}>
                          <p className={styles.settingLabel}>{item.label}</p>
                          <p className={styles.settingDesc}>{item.desc}</p>
                        </div>
                        <label className={styles.switch}>
                          <input
                            type="checkbox"
                            checked={profile[item.id]}
                            onChange={(e) =>
                              updateProfile({ [item.id]: e.target.checked })
                            }
                          />
                          <span className={styles.slider}></span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* 본인 인증 및 서비스 이용 확인 */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>서비스 이용 인증</h2>
              <div className={styles.adultVerifyBox}>
                <p className={styles.verifyTitle}>🔞 만 19세 이상 이용 안내</p>
                <p className={styles.verifyDesc}>
                  트립모아는 안전한 동행 및 여행 계획 공유를 위해{" "}
                  <strong>성인 전용</strong>으로 운영됩니다.
                </p>
                <div className={styles.confirmCheckboxArea}>
                  <label className={styles.checkboxContainer}>
                    <input
                      type="checkbox"
                      checked={profile.isAdultConfirmed}
                      disabled={profile.isAdultConfirmed}
                      onChange={(e) =>
                        updateProfile({ isAdultConfirmed: e.target.checked })
                      }
                    />
                    <span className={styles.checkmark}></span>
                    <span className={styles.checkboxLabel}>
                      본인은 만 19세 이상임을 확인합니다.
                    </span>
                  </label>
                </div>
                <p className={styles.legalWarning}>
                  * 허위 정보 입력 시 서비스 이용 제한 및 법적 책임은 사용자
                  본인에게 있습니다.
                </p>
              </div>

              <p className={styles.desc} style={{ marginTop: 20 }}>
                {profile.isVerified
                  ? "✅ 본인 인증이 완료되었습니다."
                  : "커뮤니티 이용을 위해 본인 인증이 필요합니다."}
              </p>
              <button
                className={styles.primaryButton}
                onClick={() => setShowVerifyModal(true)}
                disabled={profile.isVerified || !isFormValid}
              >
                {profile.isVerified ? "인증 완료" : "본인 인증하기"}
              </button>
            </section>

            {/* 고객 지원 섹션 */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>고객 지원</h2>
              <div className={styles.supportGrid}>
                {/* 아직 페이지가 없으므로 알림창으로 대체합니다 */}
                <button
                  className={styles.supportBtn}
                  onClick={() => alert("공지사항 기능은 현재 준비 중입니다.")}
                >
                  공지사항
                </button>
                <button
                  className={styles.supportBtn}
                  onClick={() => alert("FAQ 기능은 현재 준비 중입니다.")}
                >
                  FAQ
                </button>
                <button
                  className={styles.supportBtnPrimary}
                  onClick={() =>
                    window.open("http://pf.kakao.com/_내채널ID/chat", "_blank")
                  }
                >
                  카카오톡 1:1 문의
                </button>
              </div>
            </section>

            {/* 회원 탈퇴 */}
            <section className={`${styles.section} ${styles.danger}`}>
              <h2 className={styles.sectionTitle}>회원 탈퇴</h2>
              <p className={styles.desc}>
                탈퇴 시 모든 여행 데이터와 프로필 정보가 영구적으로 파기됩니다.
              </p>
              <button
                className={styles.dangerButton}
                onClick={() => setShowDeleteModal(true)}
              >
                회원 탈퇴하기
              </button>
            </section>
          </div>
        )}

        {/* 신고 관리 섹션  */}
        {activeTab === "신고 관리" && (
          <>
            {/* 나의 신고 현황 */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>나의 신고 현황</h2>
              <div className={styles.reportSummary}>
                <div className={styles.statusBox}>
                  <span className={styles.statusLabel}>현재 제재 단계</span>
                  <span className={styles.statusValue}>1단계 (주의)</span>
                </div>
                <div className={styles.statusBox}>
                  <span className={styles.statusLabel}>누적 신고 횟수</span>
                  <span className={styles.statusValue}>2회</span>
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
                  <tr>
                    <td>댓글</td>
                    <td>욕설 및 비방</td>
                    <td>2026.01.05</td>
                  </tr>
                  <tr>
                    <td>채팅</td>
                    <td>도배</td>
                    <td>2025.12.30</td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* 제재 단계 안내 및 강조 문구 */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>신고 및 제재 안내</h2>
              <div className={styles.guideCard}>
                <ul className={styles.guideList}>
                  <li>
                    <strong>1단계:</strong> 신고자 본인 화면에서 메시지 숨김
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

                {/* 사용자 강조 문구 */}
                <div className={styles.importantNote}>
                  <p className={styles.noteTitle}>
                    ⚠️ 여행 계획(Trip) 관련 중요 공지
                  </p>
                  <p className={styles.noteText}>
                    여행 계획 내에서 신고가 누적될 경우,{" "}
                    <strong>해당 계획에서 즉시 강제 퇴출</strong>당합니다.
                    작성하신 내용은 팀원들을 위해 <strong>'작성자 미상'</strong>
                    으로 유지되며, 퇴출 사실은 팀원들에게 즉시 통보됩니다.
                  </p>
                </div>
              </div>
            </section>

            {/* 이의 제기 버튼 */}
            <section className={styles.section}>
              <button
                className={styles.secondaryButton}
                style={{ width: "100%" }}
                onClick={() =>
                  window.open("http://pf.kakao.com/_내채널ID/chat", "_blank")
                }
              >
                신고 관련 이의 제기하기
              </button>
            </section>
          </>
        )}

        {/* 저장 버튼 */}
        {hasChanges && (
          <button
            className={`${styles.saveButton} ${isSaving ? styles.saving : ""}`}
            onClick={handleSave}
            disabled={!isFormValid || isSaving}
          >
            {isSaving ? "저장 중..." : "변경사항 저장"}
          </button>
        )}
      </div>

      {/* 본인 인증 Model */}
      {showVerifyModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowVerifyModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.modalCloseBtn}
              onClick={() => setShowVerifyModal(false)}
            >
              <X size={20} />
            </button>
            <div className={styles.modalIcon}>
              <Shield size={48} />
            </div>
            <h2 className={styles.modalTitle}>{MODAL_MESSAGES.VERIFY.TITLE}</h2>
            <p className={styles.modalText}>
              {MODAL_MESSAGES.VERIFY.DESCRIPTION.split("\n").map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i <
                    MODAL_MESSAGES.VERIFY.DESCRIPTION.split("\n").length -
                      1 && <br />}
                </React.Fragment>
              ))}
            </p>
            <div className={styles.modalButtons}>
              <button
                className={styles.modalCancelBtn}
                onClick={() => setShowVerifyModal(false)}
              >
                취소
              </button>
              <button className={styles.modalConfirmBtn} onClick={handleVerify}>
                {MODAL_MESSAGES.VERIFY.BUTTON}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 탈퇴 Model */}
      {showDeleteModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.modalCloseBtn}
              onClick={() => setShowDeleteModal(false)}
            >
              <X size={20} />
            </button>
            <div className={`${styles.modalIcon} ${styles.danger}`}>
              <AlertTriangle size={48} />
            </div>
            <h2 className={styles.modalTitle}>{MODAL_MESSAGES.DELETE.TITLE}</h2>
            <p className={styles.modalText}>
              {MODAL_MESSAGES.DELETE.DESCRIPTION.split("\n").map((line, i) => (
                <React.Fragment key={i}>
                  {i === 1 ? <strong>{line}</strong> : line}
                  {i <
                    MODAL_MESSAGES.DELETE.DESCRIPTION.split("\n").length -
                      1 && <br />}
                </React.Fragment>
              ))}
            </p>
            <div className={styles.modalButtons}>
              <button
                className={styles.modalCancelBtn}
                onClick={() => setShowDeleteModal(false)}
              >
                취소
              </button>
              <button
                className={styles.modalDangerBtn}
                onClick={handleDeleteAccount}
              >
                {MODAL_MESSAGES.DELETE.BUTTON}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
