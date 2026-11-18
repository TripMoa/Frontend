import { useEffect } from "react";

const LINK_ID = "tm-font-gaegu";
const HREF = "https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&display=swap";

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
