// src/features/user/components/MyInfoTab.tsx

import React, { useState } from "react";
import type { UserProfile } from "../hooks/useUserSetting";

import styles from "../styles/UserSetting.module.css";
import { Camera } from "lucide-react";

type MyInfoTabProps = {
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
  isEmailValid: boolean;
  isBirthValid: boolean;
  MBTI_TYPES: string[];
  regenerateAvatar: () => void;
  triggerPhotoUpload: () => void;
  toggleTravelStyle: (style: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  travelStyleOptions: string[];
};

export default function MyInfoTab({
  profile,
  updateProfile,
  isEmailValid,
  isBirthValid,
  MBTI_TYPES,
  regenerateAvatar,
  triggerPhotoUpload,
  toggleTravelStyle,
  fileInputRef,
  handlePhotoChange,
  travelStyleOptions,
}: MyInfoTabProps) {
  // 추천 목록 표시 여부 상태
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 입력값 필터링 (영어만 허용 및 대문자 변환)
  const handleMBTIChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^A-Za-z]/g, "").toUpperCase();
    updateProfile({ mbti: value });
    setShowSuggestions(true);
  };

  const filteredMBTI = MBTI_TYPES.filter((type) =>
    type.startsWith(profile.mbti || ""),
  );

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>프로필 정보</h2>

      <div className={styles.profileRow}>
        <div
          className={styles.avatar}
          onClick={regenerateAvatar}
          title="클릭 시 랜덤 아바타 변경"
          style={{
            background:
              profile.profileType === "CUSTOM"
                ? "transparent"
                : profile.avatarColor || "#e5e7eb",
          }}
        >
          {profile.profileType === "CUSTOM" && profile.profileImage ? (
            <img src={profile.profileImage} alt="Profile" />
          ) : (
            <span className={styles.avatarEmoji}>{profile.avatarEmoji}</span>
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
            type="button"
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
            onChange={(e) => updateProfile({ nickname: e.target.value })}
          />
          {!profile.nickname && (
            <span className={styles.errorText}>
              닉네임은 필수 입력 사항입니다.
            </span>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>이름</label>
          <input
            className={`${styles.input} ${
              profile.nameLocked ? styles.inputLocked : ""
            }`}
            value={profile.name || ""}
            readOnly={profile.nameLocked}
            onChange={(e) => updateProfile({ name: e.target.value })}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>알림 수신 이메일</label>
          <input
            className={`${styles.input} ${
              profile.notificationEmail && !isEmailValid
                ? styles.inputError
                : ""
            }`}
            placeholder="example@email.com"
            value={profile.notificationEmail || ""}
            onChange={(e) =>
              updateProfile({ notificationEmail: e.target.value })
            }
          />
          {profile.notificationEmail && !isEmailValid && (
            <span className={styles.errorText}>
              올바른 이메일 형식을 입력해주세요.
            </span>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>성별</label>
          <input
            className={`${styles.input} ${
              profile.genderLocked ? styles.inputLocked : ""
            }`}
            value={profile.gender || ""}
            readOnly={profile.genderLocked}
            placeholder="예 : 남 / 여"
            onChange={(e) => updateProfile({ gender: e.target.value })}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            생년월일<span className={styles.required}>*</span>
          </label>
          <input
            type="date"
            className={`${styles.input} ${
              profile.birthLocked
                ? styles.inputLocked
                : profile.birthDate && !isBirthValid
                  ? styles.inputError
                  : !profile.birthDate
                    ? styles.inputRequired
                    : ""
            }`}
            value={profile.birthDate || ""}
            min="1900-01-01"
            max={new Date().toISOString().split("T")[0]}
            readOnly={profile.birthLocked}
            onChange={(e) => updateProfile({ birthDate: e.target.value })}
          />

          {/* 안내 분리 */}
          {!profile.birthDate && (
            <span className={styles.requiredText}>
              생년월일은 필수 입력 사항입니다.
            </span>
          )}
          {profile.birthDate && !isBirthValid && (
            <span className={styles.errorText}>
              올바른 날짜를 입력해주세요.
            </span>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>MBTI</label>
          <div className={styles.autocompleteWrapper}>
            <input
              className={`${styles.input} ${
                profile.mbti &&
                !MBTI_TYPES.includes(profile.mbti) &&
                profile.mbti.length === 4
                  ? styles.inputError
                  : ""
              }`}
              style={{ width: "100%" }}
              value={profile.mbti || ""}
              onChange={handleMBTIChange}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="예: ENFP"
              maxLength={4}
            />

            {showSuggestions && filteredMBTI.length > 0 && profile.mbti && (
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

          {profile.mbti &&
            !MBTI_TYPES.includes(profile.mbti) &&
            profile.mbti.length === 4 && (
              <span className={styles.errorText}>
                유효하지 않은 MBTI 유형입니다.
              </span>
            )}
        </div>
      </div>

      <div className={styles.travelStyleSection}>
        <label className={styles.label}>여행 스타일</label>
        <p className={styles.desc}>
          관심있는 여행 스타일을 선택해주세요 (복수 선택 가능)
        </p>
        <div className={styles.travelStyleGrid}>
          {(travelStyleOptions ?? []).map((style, index) => (
            <button
              key={`${style}-${index}`}
              className={`${styles.travelStyleBtn} ${
                profile.travelStyles?.includes(style) ? styles.active : ""
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
  );
}
