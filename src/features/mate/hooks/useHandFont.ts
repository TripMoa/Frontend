// hooks/useHandFont.ts
// P2 시안의 손글씨 글꼴(Gaegu)을 동행 화면에서만 불러온다.
// 공용 index.html을 건드리지 않으려고 화면에 들어올 때 <link>를 한 번만 붙인다.
// (공용 기준에 손글씨 글꼴이 들어가면 이 훅을 지우고 index.html로 옮긴다)
import { useEffect } from "react";

const LINK_ID = "mate-font-gaegu";
const HREF = "https://fonts.googleapis.com/css2?family=Gaegu:wght@700&display=swap";

export function useHandFont() {
  useEffect(() => {
    if (document.getElementById(LINK_ID)) return;
    const link = document.createElement("link");
    link.id = LINK_ID;
    link.rel = "stylesheet";
    link.href = HREF;
    document.head.appendChild(link);
  }, []);
}
