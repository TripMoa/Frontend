// src/features/user/components/AccountSettingsTab.tsx

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { UserProfile } from "../hooks/useUserSetting";
import styles from "../styles/UserSetting.module.css";

type AccountSettingsTabProps = {
  profile: UserProfile;
  onOpenVerifyModal: () => void;
  onOpenBirthDateModal: () => void;
  onOpenDeleteModal: () => void;
};

const SOCIAL_MAP = {
  KAKAO: { class: styles.kakao, label: "K", name: "카카오 계정" },
  GOOGLE: { class: styles.google, label: "G", name: "구글 계정" },
  NAVER: { class: styles.naver, label: "N", name: "네이버 계정" },
} as const;

type SocialKey = keyof typeof SOCIAL_MAP;

// 소셜 정보가 없을 때 보여줄 기본값
const UNKNOWN_SOCIAL = { class: "", label: "?", name: "알 수 없는 계정" };

function SocialItem({
  providerKey,
  detail,
  connected,
}: {
  providerKey: string;
  detail: string;
  connected: boolean;
}) {
  const social = SOCIAL_MAP[providerKey as SocialKey] ?? UNKNOWN_SOCIAL;

  return (
    <div className={styles.socialItem}>
      <div className={styles.socialInfo}>
        <span className={`${styles.socialIcon} ${social.class}`}>
          {social.label}
        </span>
        <div className={styles.socialText}>
          <p className={styles.socialName}>{social.name}</p>
          <p className={styles.socialDetail}>{detail}</p>
        </div>
      </div>
      <span
        className={`${styles.connectionBadge} ${
          !connected ? styles.notConnected : ""
        }`}
      >
        {connected ? "연결됨" : "연결 안 됨"}
      </span>
    </div>
  );
}

export default function AccountSettingsTab({
  profile,
  onOpenVerifyModal,
  onOpenBirthDateModal,
  onOpenDeleteModal,
}: AccountSettingsTabProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSections, setOpenSections] = useState({ social: false });

  const toggleSection = (section: "social") => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleOpenVerificationFlow = () => {
    if (!profile.birthDate) {
      onOpenBirthDateModal();
      return;
    }

    onOpenVerifyModal();
  };

  // linkedProviders가 없는 경우도 안전하게 처리
  const linkedProviders: string[] = profile.linkedProviders ?? [];

  return (
    <div className={styles.settingsWrapper}>
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
            {/* 메인 소셜 계정 */}
            <div className={styles.accountBlock}>
              <div className={styles.socialStatusCard}>
                <h3 className={styles.subTitle}>연동된 계정 정보</h3>
                <SocialItem
                  providerKey={profile.provider ?? ""}
                  detail={profile.email ?? "연결된 이메일 정보가 없습니다."}
                  connected={!!profile.email}
                />
              </div>
            </div>

            {/* 추가 연동 소셜 계정 — 있을 때만 표시 */}
            {linkedProviders.length > 0 && (
              <div className={styles.accountBlock}>
                <div className={styles.socialStatusCard}>
                  <h3 className={styles.subTitle}>추가 연동된 계정</h3>
                  {linkedProviders.map((provider) => (
                    <SocialItem
                      key={provider}
                      providerKey={provider}
                      detail="추가 연동된 계정"
                      connected={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* 공개여부 설정 비활성화*/}
        {/* <div className={styles.accountBlock}>
              <div className={styles.socialStatusCard}>
                <h3 className={styles.subTitle}>공개여부 설정</h3>
                <div className={styles.privacyToggleArea}>
                  {PRIVACY_ITEMS.map((item) => (
                    <div key={item.id} className={styles.toggleRow}>
                      <span>{item.label}</span>
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={Boolean(profile[item.id])}
                          onChange={(e) =>
                            onImmediateToggle(item.id, e.target.checked)
                          }
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div> */}
      </section>

      {/* 알림 설정 비활성화 */}
      {/* <section className={styles.section}>
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
              {NOTIFICATION_ITEMS.map((item) => (
                <div key={item.id} className={styles.settingItem}>
                  <div className={styles.settingText}>
                    <p className={styles.settingLabel}>{item.label}</p>
                    <p className={styles.settingDesc}>{item.desc}</p>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={Boolean(profile[item.id])}
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
      </section> */}

      {/* 서비스 이용 인증 */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>서비스 이용 인증</h2>
        <div className={styles.adultVerifyBox}>
          {profile.ageVerificationStatus === "UNDERAGE" ? (
            <>
              <p className={styles.verifyTitle}>🚫 만 19세 이상 이용 안내</p>
              <p className={styles.verifyDesc}>
                입력하신 생년월일 기준으로 현재 서비스 이용이 제한됩니다.
              </p>
              <p className={styles.legalWarning}>
                트립모아는 안전한 동행 및 여행 계획 공유를 위해 성인 전용으로
                운영됩니다. 생년월일 정보는 수정할 수 없으므로, 문제가 있다면
                고객센터로 문의해주세요.
              </p>
              <button className={styles.primaryButton} disabled type="button">
                이용 제한
              </button>
            </>
          ) : (
            <>
              <p className={styles.verifyTitle}>🔞 만 19세 이상 이용 안내</p>
              <p className={styles.verifyDesc}>
                트립모아는 안전한 동행 및 여행 계획 공유를 위해{" "}
                <strong>성인 전용</strong>으로 운영됩니다.
              </p>
              <p className={styles.legalWarning}>
                * 허위 정보 입력 시 서비스 이용 제한 및 책임은 사용자 본인에게
                있습니다.
              </p>
              <button
                className={styles.primaryButton}
                onClick={handleOpenVerificationFlow}
                disabled={profile.ageVerificationStatus === "VERIFIED"}
                type="button"
              >
                {profile.ageVerificationStatus === "VERIFIED"
                  ? "인증 완료"
                  : "성인 인증하기"}
              </button>
            </>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>고객 지원</h2>
        <div className={styles.supportGrid}>
          <button
            className={styles.supportBtn}
            onClick={() =>
              navigate("/notice", {
                state: {
                  returnTo: "/setting",
                  activeTab: "계정 및 설정",
                  closeTo: location.state?.closeTo ?? "/",
                },
              })
            }
            type="button"
          >
            공지사항
          </button>

          <button
            className={styles.supportBtn}
            onClick={() =>
              navigate("/faq", {
                state: {
                  returnTo: "/setting",
                  activeTab: "계정 및 설정",
                  closeTo: location.state?.closeTo ?? "/",
                },
              })
            }
            type="button"
          >
            FAQ
          </button>

          <button
            className={styles.supportBtnPrimary}
            onClick={() =>
              window.open("http://pf.kakao.com/_wdmjX/chat", "_blank")
            }
            type="button"
          >
            카카오톡 1:1 문의
          </button>
        </div>
      </section>

      <section className={`${styles.section} ${styles.danger}`}>
        <h2 className={styles.sectionTitle}>회원 탈퇴</h2>
        <p className={styles.desc}>
          탈퇴 시 프로필 정보만 삭제되며 여행 데이터는 삭제되지 않습니다.
        </p>
        <button
          className={styles.dangerButton}
          onClick={onOpenDeleteModal}
          type="button"
        >
          회원 탈퇴하기
        </button>
      </section>
    </div>
  );
}
