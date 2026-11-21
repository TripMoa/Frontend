import FreeWritePage from "./FreeWritePage";
import ReviewWritePage from "./ReviewWritePage";


function WritePage(props: any) {
  const { type = "FREE" } = props;

  if (type === "FREE") {
    return <FreeWritePage {...props} />;
  }

  return <ReviewWritePage {...props} />;
}

export default WritePage;