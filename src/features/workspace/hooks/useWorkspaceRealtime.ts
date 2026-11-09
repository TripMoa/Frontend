// src/features/workspace/hooks/useWorkspaceRealtime.ts
//
// 여행 실시간 알림을 받아 일정·저장된 장소 화면을 서버 기준으로 맞추고, 무엇이 바뀌었는지 토스트 한 줄을 만든다.
// - 알림이 연달아 와도(AI 재생성 등) 150ms 안의 것을 한 번에 묶어 필요한 만큼만 다시 불러온다.
// - 드래그 같은 포인터 조작 중에는 화면을 바꾸지 않고, 손을 뗀 뒤에 반영한다 (최대 5초까지만 미룬다).
//   내가 입력하던 값(메모·머무는 시간 등)은 서버 데이터와 따로 들고 있어서 새로 불러와도 지워지지 않는다.

import { useCallback, useEffect, useRef, useState } from "react";
import { getScheduleGenerationStatus } from "../../../api/schedule.api";
import { useTripRealtime, type RealtimeStatus } from "./useTripRealtime";
import { describeChange, effectOf, type GenerationLock, type TripChangeMessage } from "./tripChange";

const COALESCE_MS = 150;
const MAX_DEFER_MS = 5000;
const TOAST_MS = 3500;
// AI 생성이 시작됐다는 알림을 받고 이 시간이 지나도 끝 알림이 없으면(알림을 놓쳤을 수 있다) 서버에 지금 상태를 물어 맞춘다.
// 서버의 AI 호출 제한(60초)보다 길게 잡는다. 아직 생성 중이라고 하면 이 간격으로 다시 확인한다.
const GENERATION_CHECK_MS = 90_000;
const GENERATION_RECHECK_MS = 30_000;

interface Options {
  tripId: number | null;
  /** 일정을 다시 불러온다. 빈 배열이면 전체 */
  syncSchedules: (scheduleIds: number[]) => Promise<void>;
  /** 저장된 장소를 다시 불러온다 */
  syncPlaces: () => Promise<void>;
  /** 일차 id → "DAY 2" */
  dayKeyOfSchedule: (scheduleId: number) => string | null;
}

export function useWorkspaceRealtime({ tripId, syncSchedules, syncPlaces, dayKeyOfSchedule }: Options): {
  status: RealtimeStatus;
  notice: string | null;
  /** 다른 멤버(또는 내 다른 탭)가 AI 일정을 만드는 중이면 그 정보, 아니면 null */
  generation: GenerationLock | null;
  /** 다른 멤버의 일정 변경 알림을 받을 때마다 올라가는 번호 — "AI 되돌리기 가능 여부"처럼 일정 상태에 따라 달라지는 값을 다시 확인하는 신호로 쓴다 */
  scheduleRevision: number;
} {
  const [notice, setNotice] = useState<string | null>(null);
  const [scheduleRevision, setScheduleRevision] = useState(0);
  const [generation, setGeneration] = useState<GenerationLock | null>(null);
  const generationActive = useRef(false);
  const generationLockRef = useRef<GenerationLock | null>(null);
  // 생성 시작/끝 알림이 올 때마다 올린다 — 서버에 상태를 물어 둔 사이에 알림이 먼저 도착했다면 그 응답은 낡은 것이라 버린다
  const generationEpoch = useRef(0);
  const generationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 서버에 지금 상태를 묻는 함수 — 타이머 콜백이 자기 자신을 다시 예약할 수 있게 ref 로 들고 있다
  const checkGenerationRef = useRef<() => Promise<void>>(async () => undefined);

  const pending = useRef({ all: false, ids: new Set<number>(), places: false, since: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerDown = useRef(false);

  // 최신 함수를 ref 로 — 아래 콜백들이 안정적이어서 연결이 다시 만들어지지 않는다
  const fns = useRef({ syncSchedules, syncPlaces, dayKeyOfSchedule });
  useEffect(() => {
    fns.current = { syncSchedules, syncPlaces, dayKeyOfSchedule };
  }, [syncSchedules, syncPlaces, dayKeyOfSchedule]);

  // flush 는 자기 자신을 다시 예약해야 해서(드래그 중 미루기) ref 로 들고, 예약은 arm 이 맡는다
  const flushRef = useRef<() => void>(() => undefined);

  const arm = useCallback(() => {
    if (timer.current) return;
    timer.current = setTimeout(() => {
      timer.current = null;
      flushRef.current();
    }, COALESCE_MS);
  }, []);

  useEffect(() => {
    flushRef.current = () => {
      const p = pending.current;
      if (!p.all && !p.places && p.ids.size === 0) return;

      // 드래그 중이면 손을 뗄 때까지 미룬다 (너무 오래 걸리면 그냥 반영)
      if (pointerDown.current && Date.now() - p.since < MAX_DEFER_MS) {
        arm();
        return;
      }

      const { all, ids, places } = p;
      pending.current = { all: false, ids: new Set<number>(), places: false, since: 0 };
      if (places) void fns.current.syncPlaces();
      if (all) void fns.current.syncSchedules([]);
      else if (ids.size > 0) void fns.current.syncSchedules([...ids]);
    };
  }, [arm]);

  const queue = useCallback((change: { all?: boolean; ids?: number[]; places?: boolean }) => {
    const p = pending.current;
    if (!p.all && !p.places && p.ids.size === 0) p.since = Date.now();
    if (change.all) p.all = true;
    if (change.places) p.places = true;
    change.ids?.forEach((id) => p.ids.add(id));
    arm();
  }, [arm]);

  // 생성 중 상태를 바꾼다 (null 이면 해제). 켜면 일정 시간 뒤 서버에 상태를 물어 확인하는 타이머를 건다.
  const applyGeneration = useCallback((next: GenerationLock | null, checkInMs = GENERATION_CHECK_MS) => {
    if (generationTimer.current) {
      clearTimeout(generationTimer.current);
      generationTimer.current = null;
    }
    generationActive.current = next !== null;
    generationLockRef.current = next;
    setGeneration(next);
    if (next) {
      generationTimer.current = setTimeout(() => {
        generationTimer.current = null;
        void checkGenerationRef.current();
      }, checkInMs);
    }
  }, []);

  useEffect(() => {
    checkGenerationRef.current = async () => {
      if (!tripId) return;
      const epoch = generationEpoch.current;
      try {
        const { data } = await getScheduleGenerationStatus(tripId);
        if (epoch !== generationEpoch.current) return;   // 응답을 기다리는 사이 시작/끝 알림이 먼저 왔다 — 낡은 응답이다
        if (data.generating) {
          applyGeneration({ actorNickname: data.actorNickname }, GENERATION_RECHECK_MS);
        } else {
          const wasActive = generationActive.current;
          applyGeneration(null);
          // 끝났다는 알림을 놓쳤을 수 있다 — 그 사이 일정이 새로 만들어졌을 테니 전체를 맞춘다
          if (wasActive) queue({ all: true });
        }
      } catch {
        // 상태를 알 수 없으면 표시는 그대로 두되(서버가 어차피 편집을 거절한다), 잠시 뒤 다시 확인한다 —
        // 안 그러면 끝 알림도 놓친 채로 연결만 붙어 있을 때 배너가 계속 남는다
        if (epoch === generationEpoch.current && generationLockRef.current) {
          applyGeneration(generationLockRef.current, GENERATION_RECHECK_MS);
        }
      }
    };
  }, [tripId, applyGeneration, queue]);

  const onMessage = useCallback((m: TripChangeMessage) => {
    if (m.action === "GENERATE_START") {
      generationEpoch.current += 1;
      applyGeneration({ actorNickname: m.actorNickname });
    } else if (m.action === "SCHEDULE_GENERATED" || m.action === "GENERATE_FAILED") {
      generationEpoch.current += 1;
      applyGeneration(null);
    }

    const effect = effectOf(m);
    if (effect.places || effect.allSchedules || effect.scheduleIds.length > 0) {
      queue({ all: effect.allSchedules, ids: effect.scheduleIds, places: effect.places });
    }
    if (effect.allSchedules || effect.scheduleIds.length > 0) setScheduleRevision((n) => n + 1);

    const text = describeChange(m, fns.current.dayKeyOfSchedule);
    if (text) {
      setNotice(text);
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
      noticeTimer.current = setTimeout(() => setNotice(null), TOAST_MS);
    }
  }, [queue, applyGeneration]);

  // 연결이 (다시) 붙었거나 오래 숨어 있던 탭이 돌아왔다 — 놓친 변경이 있을 수 있으니 전부 맞춘다
  const onResync = useCallback(() => {
    queue({ all: true, places: true });
    setScheduleRevision((n) => n + 1);
    void checkGenerationRef.current();
  }, [queue]);

  const { status } = useTripRealtime({ tripId, onMessage, onResync });

  // 포인터 조작 중인지 추적 (드래그 중 화면 갈아엎기 방지)
  useEffect(() => {
    const down = () => { pointerDown.current = true; };
    const up = () => { pointerDown.current = false; };
    window.addEventListener("pointerdown", down, true);
    window.addEventListener("pointerup", up, true);
    window.addEventListener("pointercancel", up, true);
    window.addEventListener("blur", up);
    return () => {
      window.removeEventListener("pointerdown", down, true);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", up, true);
      window.removeEventListener("blur", up);
    };
  }, []);

  // 화면을 열 때 지금 생성 중인지 한 번 확인한다 (실시간 연결이 붙기 전에 시작된 생성도 놓치지 않도록)
  useEffect(() => {
    void checkGenerationRef.current();
  }, [tripId]);

  // 화면을 떠날 때 남은 타이머 정리
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    if (generationTimer.current) clearTimeout(generationTimer.current);
  }, []);

  return { status, notice, generation, scheduleRevision };
}
