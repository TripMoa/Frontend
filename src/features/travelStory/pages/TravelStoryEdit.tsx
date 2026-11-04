import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTravelStory } from "../hooks";
import WritePage from "./WritePage";
import CustomAlert from "../components/modals/CustomAlert";
import DraftModal from "../components/modals/DraftModal";

function TravelStoryEdit() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const hook = useTravelStory();

  // 임시저장 모달 hover 상태
  const [hoveredDraftId, setHoveredDraftId] = useState<number | null>(null);
  const [deleteHoverId, setDeleteHoverId] = useState<number | null>(null);

  useEffect(() => {
    if (storyId) {
      hook.handleEdit({ id: Number(storyId) });
    }
  }, [storyId]);

  return (
    <div className="travel-story-app">
      {hook.editingStory && (
        <WritePage
          key={hook.editingStory?.id || 'new'}
          type={hook.writeType}
          goBack={() => navigate("/travelstory/mystories")}
          onPublish={hook.handlePublish}
          onSaveDraft={hook.handleSaveDraft}
          onOpenDraftModal={() => hook.setShowDraftModal(true)}
          editingStory={hook.editingStory}
          currentDraft={hook.currentDraft}
          drafts={hook.drafts}
        />
      )}

      {/* 임시저장 목록 모달 */}
      <DraftModal
        show={hook.showDraftModal}
        drafts={hook.drafts}
        onClose={() => hook.setShowDraftModal(false)}
        onSelectDraft={(draft) => {
          // 수정 중인 글에 임시저장 내용 불러오기
          hook.setCurrentDraft(draft);
          hook.setCurrentDraftId(draft.id);
          hook.setShowDraftModal(false);
        }}
        onDeleteDraft={hook.deleteDraft}
        hoveredDraftId={hoveredDraftId}
        setHoveredDraftId={setHoveredDraftId}
        deleteHoverId={deleteHoverId}
        setDeleteHoverId={setDeleteHoverId}
      />

      {/* 수정 완료/실패 알림 - 확인 누르면 내 여행기로 이동 */}
      <CustomAlert
        show={hook.showAlert}
        message={hook.alertMessage}
        onClose={hook.closeAlert}
      />
    </div>
  );
}

export default TravelStoryEdit;
