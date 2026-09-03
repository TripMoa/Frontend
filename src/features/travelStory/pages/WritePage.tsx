import FreeWritePage from "./FreeWritePage";
import ReviewWritePage from "./ReviewWritePage";

// type prop에 따라 FreeWritePage 또는 ReviewWritePage로 분기하는 라우터
function WritePage(props: any) {
  const { type = "FREE" } = props;

  if (type === "FREE") {
    return <FreeWritePage {...props} />;
  }

  return <ReviewWritePage {...props} />;
}

export default WritePage;