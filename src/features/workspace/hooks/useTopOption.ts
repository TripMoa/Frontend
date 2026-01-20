//src\features\workspace\hooks\useTopOption.ts
import { useEffect, useRef, useState } from "react";

export const useTopOption = () => {
  const [open, setOpen] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const toggle = () => setOpen((p) => !p);
  const close = () => setOpen(false);

  const openEdit = () => {
    setIsEditOpen(true);
    close();
  };

  const closeEdit = () => setIsEditOpen(false);

  const downloadPDF = () => {
    alert("📄 PDF 다운로드를 시작합니다.");
    close();
  };

  const togglePrivacy = () => {
    setIsPrivate((p) => !p);
    close();
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  return {
    open,
    isPrivate,
    isEditOpen,
    dropdownRef,
    toggle,
    openEdit,
    closeEdit,
    downloadPDF,
    togglePrivacy,
  };
};
