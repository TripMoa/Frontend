// pages/user/UserSettings.tsx

import React, { useState } from 'react';
import { Shield, Camera, X, AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '../hooks/useUserSetting';
import { 
  GENDERS, 
  MBTI_TYPES,
  TRAVEL_STYLES,
  MODAL_MESSAGES 
} from '../components/user/User.constant';
import styles from '../styles/user/UserSetting.module.css';

export default function UserSettings() {
  const navigate = useNavigate();
  
  const {
    profile,
    hasChanges,
    isSaving,
    isFormValid,
    fileInputRef,
    age,
    updateProfile,
    saveProfile,
    handlePhotoChange,
    triggerPhotoUpload,
    toggleTravelStyle,
    verify,
    deleteAccount,
  } = useUserProfile();

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 홈으로 이동
  const handleGoHome = () => {
    navigate('/');
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

  return (
    <div className={styles.page}>
      <div className={styles.ticket}>
        {/* Header */}
        <div className={styles.header}>
          <button 
            className={styles.homeButton}
            onClick={handleGoHome}
            title="홈으로"
          >
            <Home size={20} />
          </button>
          
          <div className={styles.headerContent}>
            <h1 className={styles.title}>MY PAGE</h1>
            <p className={styles.subtitle}>프로필 및 계정 설정</p>
            {profile.isVerified && (
              <div className={styles.verifiedBadge}>
                <Shield size={14} />
                <span>인증 완료</span>
              </div>
            )}
          </div>
        </div>

        {/* Profile Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>프로필 정보</h2>

          {/* Profile Photo */}
          <div className={styles.profileRow}>
            <div 
              className={styles.avatar}
              onClick={triggerPhotoUpload}
              style={{
                background: profile.photo ? 'transparent' : profile.avatarColor
              }}
            >
              {profile.photo ? (
                <img src={profile.photo} alt="Profile" />
              ) : (
                <span className={styles.avatarEmoji}>{profile.avatarEmoji}</span>
              )}
              <div className={styles.avatarOverlay}>
                <Camera size={20} />
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />
            
            <div className={styles.avatarInfo}>
              <button 
                className={styles.secondaryButton}
                style={{ marginTop: '20px' }}
                onClick={triggerPhotoUpload}
              >
                사진 업로드
              </button>
              <p className={styles.avatarDesc}>
                프로필 사진을 업로드하지 않으면 랜덤 아바타가 표시됩니다
              </p>
            </div>
          </div>

          {/* Basic Info */}
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>
                닉네임<span className={styles.required}>*</span>
              </label>
              <input 
                className={styles.input} 
                placeholder="닉네임 입력"
                value={profile.nickname}
                onChange={(e) => updateProfile({ nickname: e.target.value })}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                이름<span className={styles.required}>*</span>
              </label>
              <input 
                className={styles.input} 
                placeholder="이름 입력"
                value={profile.name}
                onChange={(e) => updateProfile({ name: e.target.value })}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                생년월일<span className={styles.required}>*</span>
              </label>
              <input 
                className={styles.input}
                type="date"
                value={profile.birthDate}
                onChange={(e) => updateProfile({ birthDate: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
              />
              {age > 0 && (
                <span className={styles.ageDisplay}>만 {age}세</span>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                성별<span className={styles.required}>*</span>
              </label>
              <select 
                className={styles.input}
                value={profile.gender}
                onChange={(e) => updateProfile({ gender: e.target.value })}
              >
                <option value="">성별 선택</option>
                {GENDERS.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>MBTI</label>
              <select 
                className={styles.input}
                value={profile.mbti}
                onChange={(e) => updateProfile({ mbti: e.target.value })}
              >
                <option value="">MBTI 선택</option>
                {MBTI_TYPES.map((mbti) => (
                  <option key={mbti} value={mbti}>
                    {mbti}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Travel Styles */}
          <div className={styles.travelStyleSection}>
            <label className={styles.label}>여행 스타일</label>
            <p className={styles.desc}>관심있는 여행 스타일을 선택해주세요 (복수 선택 가능)</p>
            <div className={styles.travelStyleGrid}>
              {TRAVEL_STYLES.map((style) => (
                <button
                  key={style}
                  className={`${styles.travelStyleBtn} ${
                    profile.travelStyles?.includes(style) ? styles.active : ''
                  }`}
                  onClick={() => toggleTravelStyle(style)}
                  type="button"
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          {hasChanges && (
            <button 
              className={`${styles.saveButton} ${isSaving ? styles.saving : ''}`}
              onClick={handleSave}
              disabled={!isFormValid || isSaving}
            >
              {isSaving ? '저장 중...' : '변경사항 저장'}
            </button>
          )}
        </section>

        {/* Verification Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>본인 인증</h2>
          <p className={styles.desc}>
            {profile.isVerified 
              ? '✅ 본인 인증이 완료되었습니다.'
              : '커뮤니티 이용을 위해 본인 인증이 필요합니다.'
            }
          </p>
          <button 
            className={styles.primaryButton}
            onClick={() => setShowVerifyModal(true)}
            disabled={profile.isVerified || !isFormValid}
          >
            {profile.isVerified ? '인증 완료' : '본인 인증하기'}
          </button>
        </section>

        {/* Account Section */}
        <section className={`${styles.section} ${styles.danger}`}>
          <h2 className={styles.sectionTitle}>계정</h2>
          <p className={styles.desc}>
            계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.
          </p>
          <button 
            className={styles.dangerButton}
            onClick={() => setShowDeleteModal(true)}
          >
            계정 탈퇴
          </button>
        </section>
      </div>

      {/* Verify Modal */}
      {showVerifyModal && (
        <div className={styles.modalOverlay} onClick={() => setShowVerifyModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
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
              {MODAL_MESSAGES.VERIFY.DESCRIPTION.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < MODAL_MESSAGES.VERIFY.DESCRIPTION.split('\n').length - 1 && <br />}
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
              <button 
                className={styles.modalConfirmBtn}
                onClick={handleVerify}
              >
                {MODAL_MESSAGES.VERIFY.BUTTON}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
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
              {MODAL_MESSAGES.DELETE.DESCRIPTION.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {i === 1 ? <strong>{line}</strong> : line}
                  {i < MODAL_MESSAGES.DELETE.DESCRIPTION.split('\n').length - 1 && <br />}
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