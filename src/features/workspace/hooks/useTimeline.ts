// src/features/workspace/hooks/useTimeline.ts
import { useEffect, useState, useCallback } from "react";
import { STORAGE_KEYS, STORAGE_SCHEMA_VERSION } from "../hooks/schedule.constants";

interface PlaceInfo {
  name: string;
  address?: string;
  category?: string;
  description?: string;
  memo?: string;
  imageUrl?: string;
  rating?: number;
}

export interface TimelineNode {
  time: string;
  title: string;
  desc: string;
  placeInfo?: PlaceInfo;
}

// ─── localStorage 안전 헬퍼 ──────────────────────────────────

function safeGetStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`[useTimeline] localStorage.getItem("${key}") 실패:`, e);
    return null;
  }
}

function safeSetStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    // QuotaExceededError 등
    console.error(`[useTimeline] localStorage.setItem("${key}") 실패:`, e);
    return false;
  }
}

function safeParseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn("[useTimeline] JSON 파싱 실패:", e);
    return fallback;
  }
}

// ─── 스키마 마이그레이션 ─────────────────────────────────────
// 버전이 다를 경우 기존 데이터를 안전하게 초기화하고 버전을 갱신합니다.

function runMigrationIfNeeded(): void {
  const savedVersion = safeParseJSON<number>(
    safeGetStorage(STORAGE_KEYS.SCHEMA_VERSION),
    0
  );

  if (savedVersion < STORAGE_SCHEMA_VERSION) {
    console.info(
      `[useTimeline] 스키마 마이그레이션: v${savedVersion} → v${STORAGE_SCHEMA_VERSION}`
    );
    // v1 이하: 타임라인/날짜 데이터 구조 변경 가능성 — 기존 데이터 초기화
    if (savedVersion < 2) {
      // 기존 타임라인 데이터는 유지하되 구조가 맞는지 검증
      const raw = safeGetStorage(STORAGE_KEYS.TIMELINE);
      const data = safeParseJSON<Record<string, unknown>>(raw, {});
      const isValid =
        typeof data === "object" &&
        !Array.isArray(data) &&
        Object.values(data).every((v) => Array.isArray(v));

      if (!isValid) {
        console.warn("[useTimeline] 기존 타임라인 데이터 구조 불일치 — 초기화");
        safeSetStorage(STORAGE_KEYS.TIMELINE, "{}");
        safeSetStorage(STORAGE_KEYS.DATE_LOGS, "[]");
      }
    }
    safeSetStorage(
      STORAGE_KEYS.SCHEMA_VERSION,
      JSON.stringify(STORAGE_SCHEMA_VERSION)
    );
  }
}

// ─── 훅 본체 ────────────────────────────────────────────────

export const useTimeline = (currentDay: string) => {
  const [nodes, setNodes] = useState<TimelineNode[]>([]);
  const [storageError, setStorageError] = useState<string | null>(null);

  // 앱 첫 마운트 시 마이그레이션 실행
  useEffect(() => {
    runMigrationIfNeeded();
  }, []);

  /* =========================
     1️⃣ DAY 변경 시 저장된 일정 불러오기
  ========================= */
  useEffect(() => {
    if (!currentDay || currentDay === "DAY ALL") {
      setNodes([]);
      return;
    }

    const raw = safeGetStorage(STORAGE_KEYS.TIMELINE);
    const data = safeParseJSON<Record<string, TimelineNode[]>>(raw, {});
    setNodes(data[currentDay] ?? []);
  }, [currentDay]);

  /* =========================
     2️⃣ nodes 변경 시 자동 저장
  ========================= */
  useEffect(() => {
    if (!currentDay || currentDay === "DAY ALL") return;

    const raw = safeGetStorage(STORAGE_KEYS.TIMELINE);
    const data = safeParseJSON<Record<string, TimelineNode[]>>(raw, {});
    data[currentDay] = nodes;

    const ok = safeSetStorage(STORAGE_KEYS.TIMELINE, JSON.stringify(data));
    if (!ok) {
      setStorageError(
        "저장 공간이 부족합니다. 일정이 저장되지 않을 수 있습니다."
      );
    } else {
      setStorageError(null);
    }
  }, [nodes, currentDay]);

  /* =========================
     3️⃣ 노드 추가
  ========================= */
  const addNode = useCallback(() => {
    setNodes((prev) => [...prev, { time: "00:00", title: "NEW", desc: "" }]);
  }, []);

  /* =========================
     4️⃣ 노드 수정
  ========================= */
  const updateNode = useCallback(
    (idx: number, field: string, value: string) => {
      setNodes((prev) =>
        prev.map((n, i) => (i === idx ? { ...n, [field]: value } : n))
      );
    },
    []
  );

  /* =========================
     5️⃣ 노드 삭제
  ========================= */
  const deleteNode = useCallback((idx: number) => {
    setNodes((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  /* =========================
     6️⃣ 노드 순서 변경 (드래그앤드롭 결과 반영)
  ========================= */
  const reorderNodes = useCallback((fromIdx: number, toIdx: number) => {
    setNodes((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }, []);

  /* =========================
     7️⃣ 노드를 다른 날로 이동
  ========================= */
  const moveNodeToDay = useCallback(
    (idx: number, targetDay: string) => {
      const node = nodes[idx];
      if (!node) return;

      const nextNodes = nodes.filter((_, i) => i !== idx);
      setNodes(nextNodes);

      const raw = safeGetStorage(STORAGE_KEYS.TIMELINE);
      const data = safeParseJSON<Record<string, TimelineNode[]>>(raw, {});
      data[currentDay] = nextNodes;
      data[targetDay] = [...(data[targetDay] ?? []), node];

      const ok = safeSetStorage(STORAGE_KEYS.TIMELINE, JSON.stringify(data));
      if (!ok) {
        setStorageError(
          "저장 공간이 부족합니다. 일정 이동이 저장되지 않을 수 있습니다."
        );
      }
    },
    [nodes, currentDay]
  );

  /* =========================
     8️⃣ 외부 데이터로 타임라인 교체 (AI 생성 결과 반영)
        페이지 새로고침 없이 상태 직접 업데이트
  ========================= */
  const loadFromExternal = useCallback(
    (allDaysData: Record<string, TimelineNode[]>) => {
      const raw = safeGetStorage(STORAGE_KEYS.TIMELINE);
      const existing = safeParseJSON<Record<string, TimelineNode[]>>(raw, {});
      const merged = { ...existing, ...allDaysData };

      const ok = safeSetStorage(
        STORAGE_KEYS.TIMELINE,
        JSON.stringify(merged)
      );
      if (!ok) {
        setStorageError(
          "저장 공간이 부족합니다. 일정이 저장되지 않을 수 있습니다."
        );
        return;
      }
      setStorageError(null);

      if (
        currentDay &&
        currentDay !== "DAY ALL" &&
        allDaysData[currentDay]
      ) {
        setNodes(allDaysData[currentDay]);
      }
    },
    [currentDay]
  );

  return {
    nodes,
    storageError,   // 컴포넌트에서 에러 배너 표시용
    addNode,
    updateNode,
    deleteNode,
    reorderNodes,
    moveNodeToDay,
    loadFromExternal,
  };
};