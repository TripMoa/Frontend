import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import { createTrip } from "../../../api/trip.api";
import { useAccessGuard } from "../../../shared/hooks/useAccessGuard";
import { ActionPromptModal } from "../../../shared/components/ActionPromptModal";
import type { TripCreateRequest } from "../../../types/trip.types";
import { useHandFont } from "../hooks/useHandFont";

const FEATURES = [
  { no: "01", title: "같이 그리는 지도", desc: "친구를 초대해 한 지도에서 동시에 일정을 짜요. 친구가 고친 내용이 바로 보여요.", hand: "\"이거 누가 넣었어\" 종결" },
  { no: "02", title: "AI가 짜는 동선", desc: "가고 싶은 곳만 찍으세요. 이동 시간과 거리를 계산해 효율적인 순서로 묶어 드려요.", hand: "우리 다리는 소중하니까" },
  { no: "03", title: "1원까지 나눠요", desc: "쓴 돈만 적으세요. 인원수에 맞춰 누가 누구에게 얼마 보낼지 계산해 드려요.", hand: "총무 은퇴 가능" },
  { no: "04", title: "여행기로 남겨요", desc: "다녀온 여행을 사진과 함께 기록해요. 마음에 드는 여행기는 일정을 통째로 가져와 내 여행에 써요.", hand: "남의 맛집 루트 그대로 복붙" },
  { no: "05", title: "같이 갈 사람 찾아요", desc: "날짜·예산·여행 스타일이 맞는 동행을 찾고, 마음에 드는 글에 신청 한 번이면 끝이에요.", hand: "혼자 가긴 아쉬우니까" },
  { no: "06", title: "승인되면 바로 대화", desc: "동행 신청이 승인되면 1:1 채팅이 열려요. 여행 이야기는 여기서 나누고, 여행이 끝나면 방도 같이 닫혀요.", hand: "번호 교환은 천천히" },
];

const isValidDateFormat = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const normalizeDateInput = (value: string) => {
  const [year = "", month = "", day = ""] = value.split("-");
  return [year.slice(0, 4), month.slice(0, 2), day.slice(0, 2)].filter(Boolean).join("-");
};

export default function Home() {
  useHandFont();
  const navigate = useNavigate();
  const destinationRef = useRef<HTMLInputElement>(null);

  const { requireLogin, showLoginModal, closeLoginModal, moveToLogin } = useAccessGuard();

  const [destination, setDestination] = useState("");
  const [tripStartDate, setTripStartDate] = useState("");
  const [tripEndDate, setTripEndDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDateRangeValid = !tripStartDate || !tripEndDate || tripEndDate >= tripStartDate;
  const destinationMissing = !destination && Boolean(tripStartDate || tripEndDate);
  const errorMessage = formError ?? (tripStartDate && tripEndDate && !isDateRangeValid ? "복귀일은 출발일 이후여야 합니다." : null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!requireLogin()) return;
    if (isSubmitting) return;

    if (!destination.trim()) {
      setFormError("여행지를 입력해주세요.");
      return;
    }
    if (!tripStartDate || !tripEndDate) {
      setFormError("출발일과 복귀일을 입력해주세요.");
      return;
    }
    if (!isValidDateFormat(tripStartDate) || !isValidDateFormat(tripEndDate)) {
      setFormError("날짜는 YYYY-MM-DD 형식으로 입력해주세요.");
      return;
    }
    if (!isDateRangeValid) return;

    const payload: TripCreateRequest = {
      title: destination.trim(),
      tripStartDate,
      tripEndDate,
      memberUserIds: [],
    };

    try {
      setFormError(null);
      setIsSubmitting(true);
      const res = await createTrip(payload);
      navigate(`/workspace/${res.data.tripId}`);
    } catch (e) {
      console.error("여행 생성 실패:", e);
      setFormError("여행 생성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToForm = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    destinationRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="tm-home tm-grid-bg home-page">
      <div className="home-wrap">
        <section className="tm-home-hero">
          <div>
            <span className="tm-home-hero__note tm-hand">단톡방 탈출 프로젝트 ↓</span>
            <h1 className="tm-home-hero__title">
              다음 여행은
              <br />
              <mark>어디로</mark> 가<span className="q">?</span>
            </h1>
            <p className="tm-home-hero__lead">
              여행지랑 날짜만 정하면 여행방이 바로 열려요. 친구를 불러 일정을 같이 짜고, 정산은 알아서 나눠 드릴게요.
            </p>

            <form className="tm-home-form" onSubmit={handleSubmit} noValidate>
              <div className="tm-field">
                <label className="tm-label" htmlFor="home-destination">어디 갈 거야?</label>
                <input
                  ref={destinationRef}
                  id="home-destination"
                  type="text"
                  className={`tm-input ${destinationMissing ? "tm-input--error" : ""}`}
                  placeholder="예: 도쿄, 제주도, 뉴욕..."
                  value={destination}
                  aria-invalid={destinationMissing || undefined}
                  onChange={(e) => {
                    setFormError(null);
                    setDestination(e.target.value);
                  }}
                />
              </div>

              <div className="tm-field">
                <label className="tm-label" htmlFor="home-start">출발</label>
                <input
                  id="home-start"
                  type="date"
                  className="tm-input"
                  value={tripStartDate}
                  min="1900-01-01"
                  max="9999-12-31"
                  onChange={(e) => {
                    setFormError(null);
                    setTripStartDate(normalizeDateInput(e.target.value));
                  }}
                />
              </div>

              <div className="tm-field">
                <label className="tm-label" htmlFor="home-end">복귀</label>
                <input
                  id="home-end"
                  type="date"
                  className="tm-input"
                  value={tripEndDate}
                  min={tripStartDate || "1900-01-01"}
                  max="9999-12-31"
                  onChange={(e) => {
                    setFormError(null);
                    setTripEndDate(normalizeDateInput(e.target.value));
                  }}
                />
              </div>

              <button type="submit" className="tm-btn tm-btn--primary" disabled={isSubmitting}>
                {isSubmitting ? "여행방 만드는 중..." : "여행방 만들기 →"}
              </button>

              {errorMessage && (
                <p className="tm-notice tm-notice--danger home-form-error" role="alert">
                  ⚠ {errorMessage}
                </p>
              )}
            </form>
          </div>

          <div className="tm-home-board" aria-hidden="true">
            <div className="tm-home-piece tm-home-piece--ticket">
              <span className="tm-home-tape" />
              <div className="r1"><span>BOARDING · 3명</span><span>11.12</span></div>
              <b>ICN → KIX</b>
              <div className="dash" />
              <div className="r1"><span>오사카 3박 4일</span><span>SEAT: 아무데나</span></div>
            </div>
            <div className="tm-home-stamp">D-14<br />설렘</div>
            <div className="tm-home-piece tm-home-piece--sticky">민: 오사카성은<br />무조건 가야 함!!</div>
            <div className="tm-home-piece tm-home-piece--polar"><i /><span>타코야키 🐙</span></div>
            <div className="tm-home-piece tm-home-piece--chat"><small>지</small>환전은 누가 해?</div>
          </div>
        </section>

        <section className="tm-home-feat home-feat" aria-label="TRIPMOA 기능">
          {FEATURES.map((f) => (
            <article key={f.no} className="tm-home-feat__item">
              <span className="tm-home-feat__no">{f.no}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <span className="tm-hand">{f.hand}</span>
            </article>
          ))}
        </section>
      </div>

      <section className="tm-home-band">
        <h2>이번엔 <mark>같이</mark> 짜자</h2>
        <button type="button" className="tm-btn" onClick={goToForm}>무료로 시작하기</button>
      </section>

      <ActionPromptModal
        open={showLoginModal}
        title="로그인이 필요합니다"
        headline="로그인 후 이용할 수 있어요"
        description="여행 계획 생성은 로그인한 사용자만 이용할 수 있습니다."
        cancelText="취소"
        confirmText="로그인"
        onClose={closeLoginModal}
        onConfirm={moveToLogin}
      />
    </div>
  );
}
