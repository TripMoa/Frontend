// src/features/workspace/hooks/useScheduleUndo.ts
//
// "AI 재생성 되돌리기"가 가능한지 서버에 묻고, 되돌리기를 실행한다.
// 서버가 판단한다 — 재생성 직후와 일정이 한 글자도 다르지 않을 때만 available 이다.

import { useCallback, useEffect, useRef, useState } from "react";
import { getScheduleUndoStatus, undoScheduleGeneration, type ScheduleUndoStatus } from "../../../api/schedule.api";

export function useScheduleUndo(tripId: number | null, refreshKey: unknown) {
  const [status, setStatus] = useState<ScheduleUndoStatus | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);
  // 낡은 응답이 새 응답을 덮지 않게
  const seq = useRef(0);

  const refresh = useCallback(async () => {
    if (!tripId) return;
    const mine = ++seq.current;
    try {
      const { data } = await getScheduleUndoStatus(tripId);
      if (mine === seq.current) setStatus(data);
    } catch {
      // 상태를 못 읽으면 버튼을 숨긴다 (서버가 어차피 되돌리기 가능 여부를 다시 확인한다)
      if (mine === seq.current) setStatus(null);
    }
  }, [tripId]);

  // 화면을 열 때, 그리고 refreshKey(생성 중 여부 등)가 바뀔 때 다시 확인한다
  useEffect(() => {
    void refresh();
  }, [refresh, refreshKey]);

  /** 되돌리기 실행. 성공하면 true, 실패하면 사용자에게 보여줄 메시지를 담아 던진다 */
  const undo = useCallback(async () => {
    if (!tripId) return;
    setIsUndoing(true);
    try {
      await undoScheduleGeneration(tripId);
      seq.current += 1;
      setStatus(null);
    } catch (e) {
      void refresh();
      const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      throw new Error(message ?? "되돌리지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsUndoing(false);
    }
  }, [tripId, refresh]);

  return { status, isUndoing, refresh, undo };
}
