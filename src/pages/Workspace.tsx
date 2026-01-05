import { useState, useEffect } from "react";
import "../styles/workspace/layout.css";
import {
  WorkspaceCoreProvider,
  useWorkspaceCore,
} from "../hooks/useWorkspaceCore";

import WorkspaceLayout from "../components/workspace/WorkspaceLayout";
import WorkspaceSidebar from "../components/workspace/WorkspaceSidebar";
import WorkspaceCenter from "../components/workspace/WorkspaceCenter";
import WorkspaceRight from "../components/workspace/WorkspaceRight";
import { useNotices } from "../hooks/useNotices";

/* =========================
   Provider 내부 실제 UI
========================= */
const WorkspaceContent: React.FC = () => {
  const { activeView, currentDay } = useWorkspaceCore();
  const [rightOpen, setRightOpen] = useState(true);

  // 2열로 써야 하는 화면
  // timeline은 DAY ALL일 때만 2열, DAY 1/DAY 2 등은 rightOpen 상태에 따라
  const isTwoColumn =
    !rightOpen ||
    (activeView === "timeline" && currentDay === "DAY ALL") ||  // ✅ DAY ALL만 무조건 2열
    activeView === "expenses" ||
    activeView === "voucher" ||
    activeView === "notice";

  const noticeStore = useNotices();

  return (
    <>
      <WorkspaceLayout>
        <WorkspaceSidebar />

        {/* 🔥 핵심: 2열 화면일 때 center가 오른쪽 칸까지 먹음 */}
        <div
          style={
            isTwoColumn
              ? { gridColumn: "2 / -1" } // col2 ~ 마지막
              : undefined
          }
        >
          <WorkspaceCenter
            noticeStore={noticeStore}
            rightOpen={rightOpen}
            setRightOpen={setRightOpen}
          />
        </div>

        {/* 3열 화면에서만 Right 렌더 */}
        {!isTwoColumn && rightOpen && <WorkspaceRight />}
      </WorkspaceLayout>
    </>
  );
};

/* =========================
   Workspace Page
========================= */
const Workspace: React.FC = () => {
  useEffect(() => {
    document.documentElement.classList.add("ws-hide-scrollbar");

    return () => {
      document.documentElement.classList.remove("ws-hide-scrollbar");
    };
  }, []);

  return (
    <WorkspaceCoreProvider>
      <main>
        <WorkspaceContent />
      </main>
    </WorkspaceCoreProvider>
  );
};

export default Workspace;