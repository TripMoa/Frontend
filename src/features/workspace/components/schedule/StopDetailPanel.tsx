// src/features/workspace/components/schedule/StopDetailPanel.tsx
//
// "정거장 상세" — 일차 목록 자리에 열리는 패널. 장소 소개가 아니라 "이 일정 칸에 대해 알아야 할 것과 할 수 있는 것"을 모은다.
//   언제(시각·머무는 시간·고정·경고) / 가는 길(앞뒤 구간, 실제 경로) / 예약과 비용 / 멤버 공용 메모 / 조작(장소 바꾸기·이동·삭제 → ⋯ 메뉴)
// 지도는 옆에 그대로 보이고, 선택한 장소가 지도 중심에 온다(DayDetailView가 처리).
// 모양은 디자인 기준 v3 workspace 의 "정거장 상세".

import React, { useState } from "react";
import type { DayInfo, TimelineNode } from "../../hooks/useTimeline";
import type { VoucherResponse } from "../../../../types/voucher.types";
import type { ExpenseItem } from "../../hooks/expense.ui.types";
import { CATEGORY_COLOR } from "../../hooks/schedule.constants";
import PlanControls from "./PlanControls";

const MAX_MEMO = 1000;

interface Props {
  node: TimelineNode;
  idx: number;
  total: number;
  dayTitle: string;
  dayInfo?: DayInfo;
  isEditing: boolean;
  prev?: TimelineNode;
  next?: TimelineNode;
  otherDays: string[];
  vouchers: VoucherResponse[];
  expenses: ExpenseItem[];
  /** 앞뒤 구간의 실시간 경로를 조회할 수 있는지 / 조회 (fromIdx → fromIdx+1) */
  canTransit: (fromIdx: number) => boolean;
  onTransit: (fromIdx: number) => void;
  onBack: () => void;
  onNav: (delta: number) => void;
  onStay: (minutes: number) => Promise<boolean>;
  onPin: (time: string | null) => Promise<boolean>;
  onTime: (value: string) => void;
  onMemo: (memo: string) => Promise<boolean>;
  onReplace: () => void;
  onMove: (targetDay: string) => void;
  onDelete: () => void;
  onAddVoucher?: () => void;
  onAddExpense?: () => void;
}

const Section: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="tm-subsec ws-sec">
    <h4>{label}</h4>
    {children}
  </div>
);

const StopDetailPanel: React.FC<Props> = ({
  node, idx, total, dayTitle, dayInfo, isEditing, prev, next, otherDays, vouchers, expenses,
  canTransit, onTransit, onBack, onNav, onStay, onPin, onTime, onMemo, onReplace, onMove, onDelete,
  onAddVoucher, onAddExpense,
}) => {
  const autoOn = !!dayInfo?.autoCompute;
  const cat = node.placeInfo?.category ?? "";
  const color = CATEGORY_COLOR[cat] || "var(--tm-line-strong)";
  const isFixed = cat === "교통" || cat === "숙소";
  const canEdit = isEditing && !isFixed;
  const address = node.placeInfo?.address || node.desc || "";
  const warnings = autoOn ? node.warnings ?? [] : [];
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);

  // 메모 — 입력 중인 값(draft)만 들고 있다가 포커스를 벗어나면 저장한다. 저장이 끝나면 서버 값을 그대로 보여준다.
  const [draft, setDraft] = useState<string | null>(null);
  const [memoState, setMemoState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const memoValue = draft ?? node.memo ?? "";

  const saveMemo = async () => {
    if (draft == null || draft === (node.memo ?? "")) {
      setDraft(null);
      return;
    }
    setMemoState("saving");
    const ok = await onMemo(draft);
    setMemoState(ok ? "saved" : "failed");
    if (ok) setDraft(null); // 실패하면 쓰던 글을 남겨서 다시 저장할 수 있게 한다
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 복사 권한이 없으면 조용히 넘어간다 */
    }
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setMoveOpen(false);
  };

  const totalCost = expenses.reduce((sum, e) => sum + (e.cost ?? 0), 0);
  const travelRow = (label: string, minutes: number | undefined, fromIdx: number) => (
    <div className="tm-kv">
      <span className="tm-ellipsis">{label}</span>
      <span className="ws-kv__r">
        <b>
          {minutes != null && minutes > 0 ? `${dayInfo?.transportMode ?? ""} 약 ${minutes}분 ` : ""}
          {minutes != null && minutes > 0 && <span className="tm-hint">(추정)</span>}
        </b>
        {canTransit(fromIdx) && (
          <button type="button" className="tm-btn tm-btn--sm" onClick={() => onTransit(fromIdx)}>
            실제 경로
          </button>
        )}
      </span>
    </div>
  );

  return (
    <div className="ws-stop">
      {/* 상단: 목록으로 · 이전/다음 장소 */}
      <div className="tm-row ws-stop__top">
        <button type="button" className="tm-btn tm-btn--sm ws-back" onClick={onBack}>
          ← 목록
          <span className="ws-sr"> ({dayTitle})</span>
        </button>
        <span className="tm-grow" />
        <div className="ws-pager">
          <button type="button" disabled={idx === 0} onClick={() => onNav(-1)} aria-label="이전 장소">‹</button>
          <span aria-live="polite">{idx + 1} / {total}</span>
          <button type="button" disabled={idx >= total - 1} onClick={() => onNav(1)} aria-label="다음 장소">›</button>
        </div>
      </div>

      {/* 이름·주소 */}
      <div className="ws-stop__head">
        <div className="tm-row ws-stop__titlerow">
          <h3 className="ws-stop__title tm-grow">{node.title}</h3>
          {canEdit && (
            <div className="ws-menuwrap">
              <button
                type="button"
                className="ws-more"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="이 장소 동작 더 보기"
                title="장소 바꾸기 · 옮기기 · 빼기"
                onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="5" cy="12" r="1.8" />
                  <circle cx="12" cy="12" r="1.8" />
                  <circle cx="19" cy="12" r="1.8" />
                </svg>
              </button>
              {menuOpen && (
                <>
                  <div className="tm-dropdown__menu ws-menu" role="menu">
                    <button
                      type="button"
                      role="menuitem"
                      className="tm-dropdown__item"
                      onClick={() => { closeMenu(); onReplace(); }}
                    >
                      장소 바꾸기
                    </button>
                    {otherDays.length > 0 && (
                      <>
                        <button
                          type="button"
                          role="menuitem"
                          className="tm-dropdown__item"
                          aria-expanded={moveOpen}
                          onClick={() => setMoveOpen((v) => !v)}
                        >
                          다른 날로 옮기기
                        </button>
                        {moveOpen && otherDays.map((d) => (
                          <button
                            key={d}
                            type="button"
                            role="menuitem"
                            className="tm-dropdown__item ws-menu__sub"
                            onClick={() => { closeMenu(); onMove(d); }}
                          >
                            {d}
                          </button>
                        ))}
                      </>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      className="tm-dropdown__item tm-dropdown__item--danger"
                      onClick={() => {
                        closeMenu();
                        if (window.confirm(`‘${node.title}’을(를) 일정에서 뺄까요?`)) onDelete();
                      }}
                    >
                      일정에서 빼기…
                    </button>
                  </div>
                  <div className="tm-backdrop" onClick={closeMenu} />
                </>
              )}
            </div>
          )}
        </div>
        <div className="tm-row tm-row--wrap tm-gap-2 ws-stop__meta">
          {cat ? (
            <span className="tm-tag tm-cat" style={{ ["--tm-cat" as string]: color }}>{cat}</span>
          ) : (
            <span className="tm-hint">장소</span>
          )}
          {address && <span className="tm-hint">{address}</span>}
          {address && (
            <button
              type="button"
              className="ws-copy"
              onClick={() => void copyAddress()}
              aria-label="주소 복사"
              title={copied ? "복사했어요" : "주소 복사"}
            >
              {copied ? (
                <span>복사됨</span>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="8" y="8" width="12" height="12" />
                  <path d="M4 16V4h12" />
                </svg>
              )}
            </button>
          )}
          <a
            className="ws-link"
            href={`https://map.naver.com/p/search/${encodeURIComponent(node.title)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            네이버 지도에서 검색
          </a>
        </div>
      </div>

      {/* 언제 */}
      <div className="tm-subsec ws-sec" role="group" aria-label="언제">
        {autoOn ? (
          <PlanControls
            stayMinutes={node.stayMinutes}
            startTime={node.time}
            endTime={node.endTime}
            pinnedTime={node.pinnedTime}
            readOnly={!canEdit}
            onStay={onStay}
            onPin={onPin}
          />
        ) : canEdit ? (
          <div className="tm-field">
            <label className="tm-label" htmlFor="ws-stop-time">시작 시각</label>
            <input
              id="ws-stop-time"
              className="tm-input ws-clock"
              type="text"
              value={node.time}
              onChange={(e) => onTime(e.target.value)}
              placeholder="HH:MM"
            />
            <p className="tm-field__hint">이 날은 시각을 직접 적어요</p>
          </div>
        ) : (
          <div className="ws-when">
            <div className="ws-when__cell">
              <span className="ws-when__l">시작</span>
              <b className="ws-when__v">{node.time}</b>
            </div>
            <p className="tm-hint ws-when__note">이 날은 시각을 직접 적는 날이에요</p>
          </div>
        )}

        {warnings.map((w, i) => (
          <div key={i} className="tm-notice tm-notice--warn tm-mt-3">{w.message}</div>
        ))}
      </div>

      {/* 가는 길 */}
      {(prev || next) && (
        <Section label="가는 길">
          {prev && travelRow(`‘${prev.title}’에서 오는 길`, prev.travelMinutes, idx - 1)}
          {next && travelRow(`‘${next.title}’(으)로 가는 길`, node.travelMinutes, idx)}
        </Section>
      )}

      {/* 예약과 비용 */}
      {(onAddVoucher || onAddExpense) && (
        <Section label="예약과 비용">
          {vouchers.length === 0 && expenses.length === 0 ? (
            <div className="tm-row tm-gap-2">
              <span className="tm-hint tm-grow">연결된 바우처·지출이 없어요</span>
              {onAddVoucher && <button type="button" className="tm-btn tm-btn--sm" onClick={onAddVoucher}>+ 바우처</button>}
              {onAddExpense && <button type="button" className="tm-btn tm-btn--sm" onClick={onAddExpense}>+ 지출</button>}
            </div>
          ) : (
            <>
              {vouchers.map((v) => (
                <div key={v.voucherId} className="tm-kv">
                  <span>{v.title}</span>
                  <span className="tm-hint">바우처</span>
                </div>
              ))}
              {expenses.map((e) => (
                <div key={e.id} className="tm-kv">
                  <span>{e.title || e.storeName}</span>
                  <b>{e.cost.toLocaleString()}원</b>
                </div>
              ))}
              {expenses.length > 1 && (
                <div className="tm-kv tm-kv--total">
                  <span>합계</span>
                  <b>{totalCost.toLocaleString()}원</b>
                </div>
              )}
              <div className="tm-row tm-gap-2 tm-mt-2">
                {onAddVoucher && <button type="button" className="tm-btn tm-btn--sm" onClick={onAddVoucher}>+ 바우처 추가</button>}
                {onAddExpense && <button type="button" className="tm-btn tm-btn--sm" onClick={onAddExpense}>+ 지출 추가</button>}
              </div>
            </>
          )}
        </Section>
      )}

      {/* 메모 */}
      <div className="tm-subsec ws-sec">
        <h4>
          메모<span className="ws-auto-note">멤버 모두에게 보여요</span>
        </h4>
        <textarea
          className="tm-textarea ws-memo"
          aria-label="메모"
          value={memoValue}
          onChange={(e) => { setDraft(e.target.value.slice(0, MAX_MEMO)); setMemoState("idle"); }}
          onBlur={() => void saveMemo()}
          placeholder="예약번호, 먹을 메뉴, 챙길 것을 적어 두세요"
          rows={2}
        />
        <div className="tm-row ws-memo__foot">
          <span className={`tm-hint tm-grow${memoState === "failed" ? " ws-err" : ""}`} aria-live="polite">
            {memoState === "saving" && "저장 중…"}
            {memoState === "saved" && "저장했어요"}
            {memoState === "failed" && "저장하지 못했어요. 다시 눌러 저장해 보세요"}
            {memoState === "idle" && draft != null && "입력을 마치면 저장돼요"}
          </span>
          <span className="tm-hint">{memoValue.length} / {MAX_MEMO}</span>
        </div>
      </div>

      {isEditing && isFixed && (
        <p className="tm-hint">{cat === "숙소" ? "숙소" : "출발지"}는 순서·장소를 바꾸거나 옮길 수 없어요.</p>
      )}
    </div>
  );
};

export default StopDetailPanel;
