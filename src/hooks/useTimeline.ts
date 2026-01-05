import { useEffect, useState } from "react";

interface TimelineNode {
  time: string;
  title: string;
  desc: string;
}

const STORAGE_KEY = "tripmoa_timeline_data";

export const useTimeline = (currentDay: string) => {
  const [nodes, setNodes] = useState<TimelineNode[]>([]);

  /* =========================
     1️⃣ DAY 변경 시 저장된 일정 불러오기
  ========================= */
  useEffect(() => {
    if (!currentDay || currentDay === "DAY ALL") {
      setNodes([]);
      return;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setNodes([]);
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      setNodes(parsed[currentDay] || []);
    } catch (e) {
      console.error("timeline load error", e);
      setNodes([]);
    }
  }, [currentDay]);

  /* =========================
     2️⃣ nodes 변경 시 자동 저장
  ========================= */
  useEffect(() => {
    if (!currentDay || currentDay === "DAY ALL") return;

    const saved = localStorage.getItem(STORAGE_KEY);
    const data = saved ? JSON.parse(saved) : {};

    data[currentDay] = nodes;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [nodes, currentDay]);

  /* =========================
     3️⃣ 노드 추가
  ========================= */
  const addNode = () => {
    setNodes((prev) => [
      ...prev,
      { time: "00:00", title: "NEW", desc: "" },
    ]);
  };

  /* =========================
     4️⃣ 노드 수정
  ========================= */
  const updateNode = (idx: number, field: string, value: string) => {
    setNodes((prev) =>
      prev.map((n, i) => (i === idx ? { ...n, [field]: value } : n))
    );
  };

  return {
    nodes,
    addNode,
    updateNode,
  };
};
