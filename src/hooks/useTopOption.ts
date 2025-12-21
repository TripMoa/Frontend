import { useEffect, useRef, useState } from "react";

export const useTopOption = () => {
  const [open, setOpen] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const toggle = () => {
    setOpen((p) => !p);
  };

  const close = () => {
    setOpen(false);
  };

  const rename = () => {
    const name = prompt("여행 이름을 입력하세요:");
    if (name) {
      const el = document.getElementById("ws-title-text");
      if (el) el.textContent = name;
    }
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
    dropdownRef,
    toggle,
    rename,
    togglePrivacy,
  };
};
