import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTravelStory } from "../hooks";
import WritePage from "./WritePage";
import * as storyAPI from "../../../api/stories.api";

function TravelStoryEdit() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const hook = useTravelStory();

  useEffect(() => {
    if (storyId) {
      hook.handleEdit({ id: Number(storyId) });
    }
  }, [storyId]);

  return (
    <div className="travel-story-app">
      {hook.currentPage === 'write' && (
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
    </div>
  );
}

export default TravelStoryEdit;