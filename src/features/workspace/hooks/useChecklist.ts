// src\features\workspace\hooks\useChecklist.ts
import { useState } from "react";

export interface ChecklistItem {
  id: number;
  text: string;
  checked: boolean;
}

export const useChecklist = () => {
  const [items, setItems] = useState<ChecklistItem[]>([
    { id: Date.now(), text: "여권 및 바우처 출력", checked: false },
  ]);

  const addItem = (text: string) => {
    if (!text.trim()) return;
    setItems((prev) => [...prev, { id: Date.now(), text, checked: false }]);
  };

  const toggleItem = (id: number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it))
    );
  };

  const updateText = (id: number, text: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, text } : it)));
  };

  const deleteItem = (id: number) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  return {
    items,
    addItem,
    toggleItem,
    updateText,
    deleteItem,
  };
};
