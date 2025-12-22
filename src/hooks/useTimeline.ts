import { useEffect, useMemo, useState } from "react";

/* part1.js localStorage key (절대 변경 ❌) */
const LS_TIMELINE_DATA = "tripmoa_timeline_data";

export interface TimelineNode {
  time: string;
  title: string;
  desc: string;
}

type TimelineStore = Record<string, TimelineNode[]>;

const getStore = (): TimelineStore => {
  const raw = localStorage.getItem(LS_TIMELINE_DATA);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as TimelineStore;
  } catch {
    return {};
  }
};

const setStore = (store: TimelineStore) => {
  localStorage.setItem(LS_TIMELINE_DATA, JSON.stringify(store));
};

export const useTimeline = (dayKey: string) => {
  const [store, setStoreState] = useState<TimelineStore>({});
  const nodes = useMemo<TimelineNode[]>(() => {
    if (!dayKey) return [];
    const dayNodes = store[dayKey];
    if (dayNodes && dayNodes.length > 0) return dayNodes;
    return [
      {
        time: "10:00 AM",
        title: "여행 시작",
        desc: "일정을 추가해보세요",
      },
    ];
  }, [dayKey, store]);

  /* 초기 로드 */
  useEffect(() => {
    setStoreState(getStore());
  }, []);

  /* day 변경 시 store 최신화 (원본의 renderTimeline 트리거 대응) */
  useEffect(() => {
    // store를 읽어 nodes가 day별로 바뀌도록만 보장
    setStoreState(getStore());
  }, [dayKey]);

  const saveNodes = (next: TimelineNode[]) => {
    const nextStore = { ...getStore(), [dayKey]: next };
    setStore(nextStore);
    setStoreState(nextStore);
  };

  const addNode = () => {
    const next = [
      ...nodes,
      {
        time: "00:00 PM",
        title: "새로운 일정",
        desc: "메모 입력",
      },
    ];
    saveNodes(next);
  };

  const updateNode = (
    index: number,
    key: keyof TimelineNode,
    value: string
  ) => {
    const next = nodes.map((n, i) =>
      i === index ? { ...n, [key]: value } : n
    );
    saveNodes(next);
  };

  return {
    nodes,
    addNode,
    updateNode,
  };
};
