import "../styles/VerifiedData.css";

interface VerifiedDataProps {
  onWriteClick?: () => void;
  onMyStoriesClick?: () => void;
}

// 여행 스토리 페이지 상단 헤더 - 글쓰기 및 내 스토리 이동 버튼 포함
function VerifiedData({
  onWriteClick,
  onMyStoriesClick,
}: VerifiedDataProps) {
  return (
    <section className="verified-data">
      <div className="verified-data-left">
        <h1>VERIFIED DATA</h1>
        <p>검증된 여행 사진 로그를 확인하십시오.</p>
      </div>

      <div className="verified-data-right">
        <button
          className="verified-btn outline"
          onClick={onMyStoriesClick}
        >
          MY STORIES
        </button>
        <button
          className="verified-btn filled"
          onClick={onWriteClick}
        >
          WRITE
        </button>
      </div>
    </section>
  );
}

export default VerifiedData;