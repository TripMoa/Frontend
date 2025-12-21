import type { ReactNode } from "react";
import "../../styles/workspace/layout.css";

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
