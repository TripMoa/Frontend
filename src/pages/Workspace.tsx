import "../styles/workspace/layout.css";
import {
  WorkspaceCoreProvider,
  useWorkspaceCore,
} from "../hooks/useWorkspaceCore";

import WorkspaceLayout from "../components/workspace/WorkspaceLayout";
import WorkspaceSidebar from "../components/workspace/WorkspaceSidebar";
import WorkspaceCenter from "../components/workspace/WorkspaceCenter";
import WorkspaceRight from "../components/workspace/WorkspaceRight";
import WorkspaceModals from "../components/workspace/WorkspaceModals";
import { useNotices } from "../hooks/useNotices";

/* =========================
   Provider 내부 실제 UI
========================= */
const WorkspaceContent: React.FC = () => {
  const { activeView } = useWorkspaceCore();

  // 2열로 써야 하는 화면
  const isTwoColumn =
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
          <WorkspaceCenter noticeStore={noticeStore} />
        </div>

        {/* 3열 화면에서만 Right 렌더 */}
        {!isTwoColumn && <WorkspaceRight />}
      </WorkspaceLayout>

      <WorkspaceModals noticeStore={noticeStore} />
    </>
  );
};

/* =========================
   Workspace Page
========================= */
const Workspace: React.FC = () => {
  return (
    <WorkspaceCoreProvider>
      <main>
        <WorkspaceContent />
      </main>
    </WorkspaceCoreProvider>
  );
};

export default Workspace;
