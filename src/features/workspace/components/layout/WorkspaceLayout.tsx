//src\features\workspace\components\layout\WorkspaceLayout.tsx

import type { ReactNode } from "react";
import "../../styles/layout.css";

interface Props {
  children: ReactNode;
  className?: string;
}

const WorkspaceLayout: React.FC<Props> = ({ children, className = "" }) => {
  return (
    <div id="workspace-ui" className={`ws-container active ${className}`}>
      {children}
    </div>
  );
};

export default WorkspaceLayout;
