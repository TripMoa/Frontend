import { useState, useEffect, useRef, useCallback } from "react";
import ConfirmModal from "../components/modals/ConfirmModal";
import Editor from "../components/Editor";
import type { EditorHandle } from "../components/Editor";
import { getTravelStyles } from "../../../api/auth.api";
import type { TravelStyleOption } from "../../../types/auth.types";
import "../styles/travelStory.css";
import "../styles/WritePage.css";

interface WritePageProps {
  goBack: () => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  onOpenDraftModal: () => void;
  editingStory?: any;
  currentDraft?: any;
  drafts: any[];
  type?: "FREE" | "REVIEW";
}

function FreeWritePage({
  goBack,
  onPublish,
  onSaveDraft,
  onOpenDraftModal,
  editingStory,
  currentDraft,
  drafts,
}: WritePageProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [travelStyles, setTravelStyles] = useState<TravelStyleOption[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  const editorRef = useRef<EditorHandle>(null);

  // 나가기 경고 표시 여부 판단
  const hasContent = useCallback(() => {
    if (editingStory || currentDraft) return true;
    const titleInput = document.querySelector(".title-input") as HTMLInputElement;
    const title = titleInput?.value.trim();
    const content = editorRef.current?.getContent()?.trim();
    return !!(title || (content && content !== ""));
  }, [editingStory, currentDraft]);

  // 태그 목록 로드
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await getTravelStyles();
        setTravelStyles(response.data);
      } catch {
        setTravelStyles([
          { id: 1, name: "힐링여행" }, { id: 2, name: "액티비티" },
          { id: 3, name: "맛집탐방" }, { id: 4, name: "문화탐방" },
          { id: 5, name: "쇼핑" }, { id: 6, name: "자연" },
          { id: 7, name: "사진" }, { id: 8, name: "야경" },
          { id: 9, name: "로컬체험" }, { id: 10, name: "카페투어" },
          { id: 11, name: "축제" }, { id: 12, name: "역사탐방" },
          { id: 13, name: "야외활동" }, { id: 14, name: "미식투어" },
          { id: 15, name: "럭셔리" }, { id: 16, name: "배낭여행" },
        ]);
      }
    };
    fetchTags();
  }, []);

  // 브라우저 뒤로가기 감지
  useEffect(() => {
    window.history.pushState({ page: "write" }, "", window.location.href);
    const handlePopState = () => {
      if (hasContent()) {
        window.history.pushState({ page: "write" }, "", window.location.href);
        setShowConfirmModal(true);
      } else {
        goBack();
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [hasContent, goBack]);

  // 수정 모드 진입 시 태그 초기화
  useEffect(() => {
    if (editingStory?.tags && travelStyles.length > 0) {
      const tagNames = editingStory.tags.split(",").map((t: string) => t.trim());
      const tagIds = travelStyles.filter((t) => tagNames.includes(t.name)).map((t) => t.id);
      setSelectedTags(tagIds);
    }
  }, [travelStyles, editingStory]);

  // 페이지 이탈 시 브라우저 경고
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasContent()) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasContent]);

  // 발행 버튼 클릭
  const handlePublishClick = () => {
    const titleInput = document.querySelector(".title-input") as HTMLInputElement;
    const title = titleInput?.value.trim();
    const content = editorRef.current?.getContent()?.trim();
    const coverImage = editorRef.current?.getCoverImage();

    if (!title) { alert("제목을 입력해주세요."); titleInput?.focus(); return; }
    if (!content || content === "<br>") { alert("내용을 입력해주세요."); return; }

    if (selectedTags.length === 0) {
      alert("태그를 1개 이상 선택해주세요.");
      return;
    }


    const tagNames = selectedTags
      .map((id) => travelStyles.find((t) => t.id === id)?.name)
      .filter((name) => name)
      .join(",");

    (window as any).selectedCoverImageForPublish = coverImage;
    (window as any).publishData = { type: "FREE", title, content, tags: tagNames };

    if (typeof onPublish === "function") {
      onPublish();
    } else {
      alert("발행 기능에 문제가 발생했습니다. 페이지를 새로고침 해주세요.");
    }
  };

  return (
    <div className="detail-page-container">
      <div className="write-page-content">
        <div className="write-header">
          <button
            onClick={(e) => {
              e.preventDefault(); e.stopPropagation();
              if (hasContent()) { setShowConfirmModal(true); } else { goBack(); }
            }}
            className="write-close-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
              style={{ width: "24px", height: "24px", fill: "#000", transition: "fill 0.2s", pointerEvents: "none" }}
            >
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>

          <h1 className="write-header-title">
            {editingStory ? "EDIT STORY" : "WRITE NEW STORY"}
          </h1>

          <div className="write-header-actions">
            <div className="write-draft-btn-wrapper">
              <button onClick={onSaveDraft} className="write-draft-btn">SAVE DRAFT</button>
              <div onClick={onOpenDraftModal} className="write-draft-badge">{drafts.length}</div>
            </div>
            <button onClick={handlePublishClick} className="write-publish-btn">PUBLISH</button>
          </div>
        </div>

        <div className="write-form-container">
          {/* 제목 입력 */}
          <div className="write-title-section">
            <label className="write-label">TITLE *</label>
            <input
              key={`title-${editingStory?.id || "new"}`}
              type="text"
              className="title-input"
              placeholder="여행 제목을 입력하세요."
              defaultValue={editingStory?.title || currentDraft?.title || ""}
              maxLength={15}
            />
          </div>

          {/* 여행 스타일 태그 선택 */}
          <div className="write-tags-section">
            <label className="write-label">TRAVEL STYLE</label>
            <div className="write-tags-container">
              {travelStyles.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className={`style-tag ${selectedTags.includes(tag.id) ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedTags((prev) =>
                      prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                    );
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* 에디터 */}
          <Editor
            ref={editorRef}
            editingStory={editingStory}
            currentDraft={currentDraft}
          />
        </div>

        <ConfirmModal
          show={showConfirmModal}
          title="페이지 나가기"
          message={`지금 나가시겠습니까?\n변경사항이 저장되지 않을 수 있습니다.`}
          confirmText="나가기"
          cancelText="취소"
          onConfirm={() => { setShowConfirmModal(false); goBack(); }}
          onCancel={() => setShowConfirmModal(false)}
        />
      </div>
    </div>
  );
}

export default FreeWritePage;