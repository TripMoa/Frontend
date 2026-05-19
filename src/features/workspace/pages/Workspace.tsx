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

        <WorkspaceCenter noticeStore={noticeStore} />

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
