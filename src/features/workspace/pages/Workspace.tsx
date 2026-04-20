// src\features\workspace\pages\Workspace.tsx

import { useEffect } from "react";
import "../styles/layout.css";
import {
  WorkspaceCoreProvider,
  useWorkspaceCore,
} from "../hooks/useWorkspaceCore";

import WorkspaceLayout from "../components/layout/WorkspaceLayout";
import WorkspaceSidebar from "../components/layout/WorkspaceSidebar";
import WorkspaceCenter from "../components/layout/WorkspaceCenter";
import { useNotices } from "../hooks/useNotices";

/* =========================
   Provider 내부 실제 UI
========================= */
const WorkspaceContent: React.FC = () => {
  const { activeView } = useWorkspaceCore();

  // timeline 포함 모든 뷰가 2열 (오른쪽 사이드바 미사용)
  const isTwoColumn =
    activeView === "timeline" ||
    activeView === "expenses" ||
    activeView === "voucher" ||
    activeView === "notice";

  const noticeStore = useNotices();

  return (
    <>
      <WorkspaceLayout>
        <WorkspaceSidebar />

        {/* 핵심: 2열 화면일 때 center가 오른쪽 칸까지 먹음 */}
        <div
          style={
            isTwoColumn
              ? { gridColumn: "2 / -1" } // col2 ~ 마지막
              : undefined
          }
        >
          <WorkspaceCenter noticeStore={noticeStore} />
        </div>

        {/* WorkspaceRight 미사용 */}
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