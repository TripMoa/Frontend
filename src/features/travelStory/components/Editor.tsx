import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useImageUpload } from "../hooks/useImageUpload";
import "../styles/travelStory.css";
import "../styles/WritePage.css";

export interface EditorHandle {
  getContent: () => string;
  getCoverImage: () => string | null;
}

interface EditorProps {
  editingStory?: any;
  currentDraft?: any;
}

// 이벤트를 붙인 슬라이더 목록 (HTML에 저장되지 않음)
const boundSliders = new WeakSet<Element>();

// 사진 칸을 본문 맨 위에 고정 (여러 개면 하나로 합침)
const keepSliderOnTop = (editor: HTMLDivElement) => {
  const sliders = Array.from(editor.querySelectorAll(".image-slider-wrapper")) as HTMLElement[];
  if (sliders.length === 0) return;
  const main = sliders[0];

  if (sliders.length > 1) {
    const container = main.querySelector(".slider-images-container");
    sliders.slice(1).forEach((other) => {
      other.querySelectorAll(".slider-images-container img").forEach((img) => {
        (img as HTMLElement).style.display = "none";
        container?.appendChild(img);
      });
      other.remove();
    });
  }

  // 2장 이상인데 이전/다음 버튼이 없으면 생성
  const imageCount = main.querySelectorAll(".slider-images-container img").length;
  if (imageCount > 1 && !main.querySelector(".slider-prev-btn")) {
    ["slider-prev-btn", "slider-next-btn"].forEach((cls, i) => {
      const btn = document.createElement("button");
      btn.className = cls;
      btn.innerHTML = i === 0 ? "‹" : "›";
      btn.setAttribute("contenteditable", "false");
      main.appendChild(btn);
    });
  }

  // 사진 칸은 편집 불가 영역으로
  main.setAttribute("contenteditable", "false");

  if (editor.firstChild !== main) editor.insertBefore(main, editor.firstChild);
  if (!main.nextSibling) editor.appendChild(document.createElement("br"));
};

// 키보드로 지워진 사진 칸 복구 (사진 삭제는 삭제 버튼으로만)
const restoreSliderIfRemoved = (editor: HTMLDivElement, slider: HTMLElement | null) => {
  if (!slider || editor.contains(slider)) return;
  editor.insertBefore(slider, editor.firstChild);
  if (!slider.nextSibling) editor.appendChild(document.createElement("br"));

  // 커서는 사진 칸 아래 줄로
  const next = slider.nextSibling;
  const sel = window.getSelection();
  if (next && sel) {
    const range = document.createRange();
    if (next.nodeType === Node.TEXT_NODE || next.nodeName === "BR") {
      range.setStartBefore(next);
    } else {
      range.setStart(next, 0);
    }
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
};

// 사진 드래그로 보일 위치 조정 (object-position에 저장)
const clampPercent = (v: number) => Math.min(100, Math.max(0, v));

const readObjectPosition = (img: HTMLImageElement): [number, number] => {
  // 옮긴 적 없으면 기본값 (50% 0%)
  const value = img.style.objectPosition || getComputedStyle(img).objectPosition || "50% 0%";
  const nums = value.match(/-?\d+(\.\d+)?(?=%)/g);
  if (nums && nums.length >= 2) return [parseFloat(nums[0]), parseFloat(nums[1])];
  return [50, 0];
};

const startImagePositionDrag = (img: HTMLImageElement, startClientX: number, startClientY: number) => {
  const box = img.parentElement as HTMLElement | null;
  if (!box || !img.naturalWidth || !img.naturalHeight) return false;

  // 칸 밖으로 넘치는 크기 (이만큼만 이동 가능)
  const boxW = box.clientWidth;
  const boxH = box.clientHeight;
  const scale = Math.max(boxW / img.naturalWidth, boxH / img.naturalHeight);
  const overflowX = img.naturalWidth * scale - boxW;
  const overflowY = img.naturalHeight * scale - boxH;
  if (overflowX < 1 && overflowY < 1) return false; // 칸과 비율이 같아 옮길 게 없음

  const [startX, startY] = readObjectPosition(img);
  img.classList.add("is-dragging");

  const onMove = (ev: PointerEvent) => {
    const dx = ev.clientX - startClientX;
    const dy = ev.clientY - startClientY;
    // 끄는 방향으로 사진 이동
    const nextX = overflowX >= 1 ? clampPercent(startX - (dx / overflowX) * 100) : startX;
    const nextY = overflowY >= 1 ? clampPercent(startY - (dy / overflowY) * 100) : startY;
    img.style.objectPosition = `${nextX.toFixed(1)}% ${nextY.toFixed(1)}%`;
  };
  const onUp = () => {
    img.classList.remove("is-dragging");
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  return true;
};

const Editor = forwardRef<EditorHandle, EditorProps>(({
  editingStory,
  currentDraft,
}, ref) => {
  const [selectedCoverImage, setSelectedCoverImage] = useState<string | null>(
    editingStory?.imageUrl || null,
  );
  const editorRef = useRef<HTMLDivElement>(null);
  // 지우기 직전의 사진 칸 (복구용)
  const sliderBeforeEditRef = useRef<HTMLElement | null>(null);
  const { upload } = useImageUpload();

  // 슬라이더 이벤트에서 최신 커버 값을 읽기 위한 ref
  const selectedCoverRef = useRef<string | null>(selectedCoverImage);
  useEffect(() => {
    selectedCoverRef.current = selectedCoverImage;
  }, [selectedCoverImage]);

  // 글자·사진이 없으면 안내문 표시 (data-empty)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const update = () => {
      const isEmpty = !editor.textContent?.trim() && !editor.querySelector("img");
      editor.dataset.empty = isEmpty ? "true" : "false";
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(editor, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  // 부모에서 getContent(), getCoverImage() 호출 가능하도록 노출
  useImperativeHandle(ref, () => ({
    getContent: () => editorRef.current?.innerHTML || "",
    getCoverImage: () => selectedCoverImage,
  }));

  // 상대 경로 이미지 URL을 절대 경로로 변환
  const normalizeImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${import.meta.env.VITE_API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  // 수정/임시저장 모드 진입 시 에디터 내용 초기화
  useEffect(() => {
    if (editorRef.current && (editingStory || currentDraft)) {
      // 임시저장 내용 우선
      editorRef.current.innerHTML =
        currentDraft?.description || editingStory?.description || "";
      // 이전 버전에서 저장된 data-bound 속성 제거
      editorRef.current.querySelectorAll("[data-bound]").forEach((el) => el.removeAttribute("data-bound"));
      // 1번째 사진부터 보이게
      editorRef.current.querySelectorAll(".slider-images-container").forEach((container) => {
        container.querySelectorAll("img").forEach((img, idx) => {
          (img as HTMLElement).style.display = idx === 0 ? "block" : "none";
        });
      });

      // 임시저장 불러올 때 커버 복원 (없으면 첫 사진)
      if (currentDraft) {
        const firstImg = editorRef.current.querySelector(".slider-images-container img") as HTMLImageElement | null;
        const firstSrc = firstImg ? firstImg.getAttribute("data-image-src") || firstImg.getAttribute("src") : null;
        setSelectedCoverImage(currentDraft.imageUrl || (firstSrc ? normalizeImageUrl(firstSrc) : null));
      }
    }
  }, [editingStory?.id, currentDraft?.id]);

  // 임시저장 시 커버도 함께 저장되도록 전달
  useEffect(() => {
    (window as any).selectedCoverImageForPublish = selectedCoverImage;
  }, [selectedCoverImage]);

  // 수정/임시저장 모드 슬라이더 초기화 (이벤트는 슬라이더당 한 번만)
  useEffect(() => {
    // 수정 화면 또는 임시저장 불러오기일 때만
    if (!((editingStory && editingStory.description != null) || currentDraft)) return;

    const timer = setTimeout(() => {
      if (editorRef.current) keepSliderOnTop(editorRef.current);
      const sliders = document.querySelectorAll(".image-slider-wrapper");
      sliders.forEach((slider) => {
        const sliderEl = slider as HTMLElement;
        if (boundSliders.has(sliderEl)) return;

        const images = slider.querySelectorAll("img");
        images.forEach((img) => {
          const src = img.getAttribute("src");
          if (src && !src.startsWith("http")) {
            img.setAttribute("src", normalizeImageUrl(src));
          }
        });

        const imagesContainer = slider.querySelector(".slider-images-container");
        if (!imagesContainer) return;

        const getImages = () =>
          Array.from(imagesContainer.querySelectorAll("img")) as HTMLImageElement[];
        const getCurrentIndex = () => {
          const idx = getImages().findIndex((img) => img.style.display === "block");
          return idx < 0 ? 0 : idx;
        };
        const getSrc = (img: HTMLImageElement) => img.getAttribute("data-image-src") || img.src;

        const allImages = getImages();
        if (allImages.length === 0) return;
        boundSliders.add(sliderEl);

        allImages.forEach((img, idx) => { img.style.display = idx === 0 ? "block" : "none"; });

        const indicator = slider.querySelector(".slider-indicator");
        const coverBtn = slider.querySelector(".slider-cover-btn") as HTMLElement | null;
        const buttonContainer = slider.querySelector(".slider-button-container") as HTMLElement | null;
        const deleteButtonContainer = slider.querySelector(".slider-delete-container") as HTMLElement | null;

        const updateIndicator = () => {
          if (indicator) indicator.textContent = `${getCurrentIndex() + 1}/${getImages().length}`;
        };
        updateIndicator();

        const updateCoverButton = () => {
          if (!coverBtn) return;
          const current = getImages()[getCurrentIndex()];
          if (current && getSrc(current) === selectedCoverRef.current) {
            coverBtn.style.background = "#FFD93D";
            coverBtn.style.color = "#000";
            if (buttonContainer) buttonContainer.style.opacity = "1";
          } else {
            coverBtn.style.background = "#000";
            coverBtn.style.color = "#fff";
          }
        };

        const showImage = (nextIndex: number) => {
          const imgs = getImages();
          if (imgs.length === 0) return;
          const target = (nextIndex + imgs.length) % imgs.length;
          imgs.forEach((img, idx) => { img.style.display = idx === target ? "block" : "none"; });
          updateIndicator();
          updateCoverButton();
        };

        slider.querySelector(".slider-prev-btn")?.addEventListener("click", (e) => {
          e.preventDefault(); e.stopPropagation();
          showImage(getCurrentIndex() - 1);
        });

        slider.querySelector(".slider-next-btn")?.addEventListener("click", (e) => {
          e.preventDefault(); e.stopPropagation();
          showImage(getCurrentIndex() + 1);
        });

        coverBtn?.addEventListener("click", (e) => {
          e.preventDefault(); e.stopPropagation();
          document.querySelectorAll(".slider-cover-btn").forEach((btn) => {
            (btn as HTMLElement).style.background = "#000";
            (btn as HTMLElement).style.color = "#fff";
            const container = (btn as HTMLElement).parentElement;
            if (container) container.style.opacity = "0";
          });
          const current = getImages()[getCurrentIndex()];
          if (!current) return;
          setSelectedCoverImage(getSrc(current));
          coverBtn.style.background = "#FFD93D";
          coverBtn.style.color = "#000";
          if (buttonContainer) buttonContainer.style.opacity = "1";
        });

        slider.querySelector(".slider-delete-btn")?.addEventListener("click", (e) => {
          e.preventDefault(); e.stopPropagation();
          const imgs = getImages();
          const currentIndex = getCurrentIndex();
          const current = imgs[currentIndex];
          if (!current) return;
          if (selectedCoverRef.current === getSrc(current)) setSelectedCoverImage(null);

          if (imgs.length === 1) {
            slider.remove();
            return;
          }
          current.remove();
          const remaining = getImages();
          showImage(Math.min(currentIndex, remaining.length - 1));
          if (remaining.length === 1) {
            const pBtn = slider.querySelector(".slider-prev-btn") as HTMLElement | null;
            const nBtn = slider.querySelector(".slider-next-btn") as HTMLElement | null;
            if (pBtn) pBtn.style.display = "none";
            if (nBtn) nBtn.style.display = "none";
          }
        });

        slider.addEventListener("mouseenter", () => {
          if (coverBtn && coverBtn.style.background !== "rgb(255, 217, 61)") {
            if (buttonContainer) buttonContainer.style.opacity = "1";
          }
          if (deleteButtonContainer) deleteButtonContainer.style.opacity = "1";
        });
        slider.addEventListener("mouseleave", () => {
          if (coverBtn && coverBtn.style.background !== "rgb(255, 217, 61)") {
            if (buttonContainer) buttonContainer.style.opacity = "0";
          }
          if (deleteButtonContainer) deleteButtonContainer.style.opacity = "0";
        });

        updateCoverButton();
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [editingStory, currentDraft]);

  // 이미지 업로드 및 슬라이더 삽입 - 최대 10장 제한
  const handleImageInsert = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const editor = editorRef.current;
    if (!editor) return;

    const currentImages = editor.querySelectorAll(".slider-images-container img").length;

    if (currentImages >= 10) {
      alert("이미지는 최대 10장까지 업로드할 수 있습니다.");
      return;
    }

    const remainingSlots = 10 - currentImages;
    const fileArray = Array.from(files).slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      alert(`이미지는 최대 10장까지 가능합니다. ${remainingSlots}장만 추가됩니다.`);
    }

    try {
      const imageUrls = await upload(fileArray);
      const normalizedUrls = imageUrls.map((url: string) => normalizeImageUrl(url));

      (window as any).uploadedImagesForPublish = (
        (window as any).uploadedImagesForPublish || []
      ).concat(normalizedUrls);

      // 기존 슬라이더에 이어 붙이기
      const existingSlider = editor.querySelector(".image-slider-wrapper");

      if (existingSlider) {
        const imagesContainer = existingSlider.querySelector(".slider-images-container");
        if (!imagesContainer) return;

        const existingImages = imagesContainer.querySelectorAll("img");
        const startIndex = existingImages.length;

        normalizedUrls.forEach((url: string, index: number) => {
          const img = document.createElement("img");
          img.src = url;
          img.alt = `slide ${startIndex + index + 1}`;
          img.setAttribute("data-image-src", url);
          img.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;display:none;`;
          imagesContainer.appendChild(img);
        });

        const indicator = existingSlider.querySelector(".slider-indicator");
        const allImages = imagesContainer.querySelectorAll("img");
        if (indicator) {
          const currentVisibleIndex = Array.from(allImages).findIndex(
            (img) => (img as HTMLElement).style.display === "block",
          );
          indicator.textContent = `${currentVisibleIndex + 1}/${allImages.length}`;
        }

        // 숨겨진 이전/다음 버튼 다시 표시
        const savedPrev = existingSlider.querySelector(".slider-prev-btn") as HTMLElement | null;
        const savedNext = existingSlider.querySelector(".slider-next-btn") as HTMLElement | null;
        if (allImages.length > 1 && savedPrev && savedNext) {
          savedPrev.style.display = "";
          savedNext.style.display = "";
        }

        if (allImages.length > 1 && !savedPrev && !savedNext) {
          const getCurrentIndex = () => {
            const images = imagesContainer.querySelectorAll("img");
            return Array.from(images).findIndex((img) => (img as HTMLElement).style.display === "block");
          };

          const prevBtn = document.createElement("button");
          prevBtn.className = "slider-prev-btn";
          prevBtn.innerHTML = "‹";
          prevBtn.setAttribute("contenteditable", "false");
          prevBtn.addEventListener("mouseenter", () => { prevBtn.style.background = "rgba(255,255,255,0.5)"; });
          prevBtn.addEventListener("mouseleave", () => { prevBtn.style.background = "rgba(255,255,255,0.25)"; });
          prevBtn.addEventListener("click", (evt) => {
            evt.preventDefault(); evt.stopPropagation();
            const images = imagesContainer.querySelectorAll("img");
            let currentIdx = getCurrentIndex();
            (images[currentIdx] as HTMLElement).style.display = "none";
            currentIdx = (currentIdx - 1 + images.length) % images.length;
            (images[currentIdx] as HTMLElement).style.display = "block";
            const ind = existingSlider.querySelector(".slider-indicator") as HTMLElement;
            if (ind) ind.textContent = `${currentIdx + 1}/${images.length}`;
            const coverBtn = existingSlider.querySelector(".slider-cover-btn") as HTMLElement;
            const buttonContainer = existingSlider.querySelector(".slider-button-container") as HTMLElement;
            const currentImg = images[currentIdx] as HTMLImageElement;
            const currentSrc = currentImg.getAttribute("data-image-src");
            if (coverBtn && currentSrc === selectedCoverRef.current) {
              coverBtn.style.background = "#FFD93D"; coverBtn.style.color = "#000";
              if (buttonContainer) buttonContainer.style.opacity = "1";
            } else if (coverBtn) {
              coverBtn.style.background = "#000"; coverBtn.style.color = "#fff";
            }
          });
          existingSlider.appendChild(prevBtn);

          const nextBtn = document.createElement("button");
          nextBtn.className = "slider-next-btn";
          nextBtn.innerHTML = "›";
          nextBtn.setAttribute("contenteditable", "false");
          nextBtn.addEventListener("mouseenter", () => { nextBtn.style.background = "rgba(255,255,255,0.5)"; });
          nextBtn.addEventListener("mouseleave", () => { nextBtn.style.background = "rgba(255,255,255,0.25)"; });
          nextBtn.addEventListener("click", (evt) => {
            evt.preventDefault(); evt.stopPropagation();
            const images = imagesContainer.querySelectorAll("img");
            let currentIdx = getCurrentIndex();
            (images[currentIdx] as HTMLElement).style.display = "none";
            currentIdx = (currentIdx + 1) % images.length;
            (images[currentIdx] as HTMLElement).style.display = "block";
            const ind = existingSlider.querySelector(".slider-indicator") as HTMLElement;
            if (ind) ind.textContent = `${currentIdx + 1}/${images.length}`;
            const coverBtn = existingSlider.querySelector(".slider-cover-btn") as HTMLElement;
            const buttonContainer = existingSlider.querySelector(".slider-button-container") as HTMLElement;
            const currentImg = images[currentIdx] as HTMLImageElement;
            const currentSrc = currentImg.getAttribute("data-image-src");
            if (coverBtn && currentSrc === selectedCoverRef.current) {
              coverBtn.style.background = "#FFD93D"; coverBtn.style.color = "#000";
              if (buttonContainer) buttonContainer.style.opacity = "1";
            } else if (coverBtn) {
              coverBtn.style.background = "#000"; coverBtn.style.color = "#fff";
            }
          });
          existingSlider.appendChild(nextBtn);
        }

        const existingCoverBtn = existingSlider.querySelector(".slider-cover-btn");
        const existingButtonContainer = existingSlider.querySelector(".slider-button-container");
        if (existingCoverBtn) {
          const newCoverBtn = existingCoverBtn.cloneNode(true) as HTMLElement;
          existingCoverBtn.parentNode?.replaceChild(newCoverBtn, existingCoverBtn);
          newCoverBtn.addEventListener("click", (evt) => {
            evt.preventDefault(); evt.stopPropagation();
            document.querySelectorAll(".slider-cover-btn").forEach((btn) => {
              (btn as HTMLElement).style.background = "#000"; (btn as HTMLElement).style.color = "#fff";
              const container = (btn as HTMLElement).parentElement;
              if (container) container.style.opacity = "0";
            });
            const getCurrentIndex = () => {
              const images = imagesContainer.querySelectorAll("img");
              return Array.from(images).findIndex((img) => (img as HTMLElement).style.display === "block");
            };
            const currentIdx = getCurrentIndex();
            const images = imagesContainer.querySelectorAll("img");
            const currentImg = images[currentIdx] as HTMLImageElement;
            const currentSrc = currentImg.getAttribute("data-image-src");
            setSelectedCoverImage(currentSrc);
            newCoverBtn.style.background = "#FFD93D"; newCoverBtn.style.color = "#000";
            if (existingButtonContainer) (existingButtonContainer as HTMLElement).style.opacity = "1";
          });
        }
      } else {
        // 새 슬라이더 생성
        const sliderId = `slider-${Date.now()}`;
        const sliderWrapper = document.createElement("div");
        sliderWrapper.className = "image-slider-wrapper";
        sliderWrapper.setAttribute("data-slider-id", sliderId);
        sliderWrapper.setAttribute("contenteditable", "false");

        const imagesContainer = document.createElement("div");
        imagesContainer.className = "slider-images-container";

        normalizedUrls.forEach((url: string, index: number) => {
          const img = document.createElement("img");
          img.src = url;
          img.alt = `slide ${index + 1}`;
          img.setAttribute("data-image-src", url);
          img.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;display:${index === 0 ? "block" : "none"};`;
          imagesContainer.appendChild(img);
        });

        sliderWrapper.appendChild(imagesContainer);

        let currentIndex = 0;

        const buttonContainer = document.createElement("div");
        buttonContainer.className = "slider-button-container";
        buttonContainer.setAttribute("contenteditable", "false");
        buttonContainer.style.cssText = `position:absolute;top:12px;left:12px;display:flex;flex-direction:column;gap:6px;z-index:10;opacity:0;transition:opacity 0.2s;`;

        const coverBtn = document.createElement("button");
        coverBtn.className = "slider-cover-btn";
        coverBtn.textContent = "COVER";
        coverBtn.setAttribute("contenteditable", "false");
        coverBtn.addEventListener("click", (evt) => {
          evt.preventDefault(); evt.stopPropagation();
          document.querySelectorAll(".slider-cover-btn, .image-cover-btn").forEach((btn) => {
            (btn as HTMLElement).style.background = "#000"; (btn as HTMLElement).style.color = "#fff";
            const container = (btn as HTMLElement).parentElement;
            if (container) container.style.opacity = "0";
          });
          const images = imagesContainer.querySelectorAll("img");
          const currentImg = images[currentIndex] as HTMLImageElement;
          const currentSrc = currentImg.getAttribute("data-image-src");
          setSelectedCoverImage(currentSrc);
          coverBtn.style.background = "#FFD93D"; coverBtn.style.color = "#000";
          buttonContainer.style.opacity = "1";
        });
        buttonContainer.appendChild(coverBtn);
        sliderWrapper.appendChild(buttonContainer);

        if (normalizedUrls.length > 1) {
          const prevBtn = document.createElement("button");
          prevBtn.className = "slider-prev-btn";
          prevBtn.innerHTML = "‹";
          prevBtn.setAttribute("contenteditable", "false");
          prevBtn.addEventListener("mouseenter", () => { prevBtn.style.background = "rgba(0,0,0,0.8)"; });
          prevBtn.addEventListener("mouseleave", () => { prevBtn.style.background = "rgba(0,0,0,0.5)"; });
          prevBtn.addEventListener("click", (evt) => {
            evt.preventDefault(); evt.stopPropagation();
            const images = imagesContainer.querySelectorAll("img");
            images[currentIndex].style.display = "none";
            currentIndex = (currentIndex - 1 + images.length) % images.length;
            images[currentIndex].style.display = "block";
            const indicator = sliderWrapper.querySelector(".slider-indicator") as HTMLElement;
            if (indicator) indicator.textContent = `${currentIndex + 1}/${images.length}`;
            const currentImg = images[currentIndex] as HTMLImageElement;
            const currentSrc = currentImg.getAttribute("data-image-src");
            if (currentSrc === selectedCoverRef.current) {
              coverBtn.style.background = "#FFD93D"; coverBtn.style.color = "#000"; buttonContainer.style.opacity = "1";
            } else {
              coverBtn.style.background = "#000"; coverBtn.style.color = "#fff"; buttonContainer.style.opacity = "0";
            }
          });
          sliderWrapper.appendChild(prevBtn);

          const nextBtn = document.createElement("button");
          nextBtn.className = "slider-next-btn";
          nextBtn.innerHTML = "›";
          nextBtn.setAttribute("contenteditable", "false");
          nextBtn.addEventListener("mouseenter", () => { nextBtn.style.background = "rgba(0,0,0,0.8)"; });
          nextBtn.addEventListener("mouseleave", () => { nextBtn.style.background = "rgba(0,0,0,0.5)"; });
          nextBtn.addEventListener("click", (evt) => {
            evt.preventDefault(); evt.stopPropagation();
            const images = imagesContainer.querySelectorAll("img");
            images[currentIndex].style.display = "none";
            currentIndex = (currentIndex + 1) % images.length;
            images[currentIndex].style.display = "block";
            const indicator = sliderWrapper.querySelector(".slider-indicator") as HTMLElement;
            if (indicator) indicator.textContent = `${currentIndex + 1}/${images.length}`;
            const currentImg = images[currentIndex] as HTMLImageElement;
            const currentSrc = currentImg.getAttribute("data-image-src");
            if (currentSrc === selectedCoverRef.current) {
              coverBtn.style.background = "#FFD93D"; coverBtn.style.color = "#000"; buttonContainer.style.opacity = "1";
            } else {
              coverBtn.style.background = "#000"; coverBtn.style.color = "#fff"; buttonContainer.style.opacity = "0";
            }
          });
          sliderWrapper.appendChild(nextBtn);
        }

        const indicator = document.createElement("div");
        indicator.className = "slider-indicator";
        indicator.textContent = `1/${normalizedUrls.length}`;
        sliderWrapper.appendChild(indicator);

        const deleteButtonContainer = document.createElement("div");
        deleteButtonContainer.className = "slider-delete-container";
        deleteButtonContainer.setAttribute("contenteditable", "false");
        deleteButtonContainer.style.cssText = `position:absolute;top:12px;right:12px;z-index:10;opacity:0;transition:opacity 0.2s;`;

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "slider-delete-btn";
        deleteBtn.setAttribute("contenteditable", "false");
        deleteBtn.style.cssText = `width:40px;height:40px;border:none;background:rgba(0,0,0,0.6);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;border-radius:4px;`;
        deleteBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2m3 0v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6h14z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 11v6M14 11v6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        deleteBtn.addEventListener("mouseenter", () => { deleteBtn.style.background = "rgba(220,38,38,0.9)"; });
        deleteBtn.addEventListener("mouseleave", () => { deleteBtn.style.background = "rgba(0,0,0,0.6)"; });
        deleteBtn.addEventListener("click", (evt) => {
          evt.preventDefault(); evt.stopPropagation();
          const images = imagesContainer.querySelectorAll("img");
          if (images.length === 1) {
            const src = (images[0] as HTMLImageElement).getAttribute("data-image-src");
            if (selectedCoverRef.current === src) setSelectedCoverImage(null);
            sliderWrapper.remove();
            return;
          }
          const currentImg = images[currentIndex] as HTMLImageElement;
          const currentSrc = currentImg.getAttribute("data-image-src");
          if (selectedCoverRef.current === currentSrc) setSelectedCoverImage(null);
          currentImg.remove();
          const remainingImages = imagesContainer.querySelectorAll("img");
          if (currentIndex >= remainingImages.length) currentIndex = remainingImages.length - 1;
          remainingImages.forEach((img, idx: number) => {
            (img as HTMLElement).style.display = idx === currentIndex ? "block" : "none";
          });
          const ind = sliderWrapper.querySelector(".slider-indicator") as HTMLElement;
          if (ind) ind.textContent = `${currentIndex + 1}/${remainingImages.length}`;
          if (remainingImages.length === 1) {
            const pBtn = sliderWrapper.querySelector(".slider-prev-btn");
            const nBtn = sliderWrapper.querySelector(".slider-next-btn");
            if (pBtn) (pBtn as HTMLElement).style.display = "none";
            if (nBtn) (nBtn as HTMLElement).style.display = "none";
          }
        });
        deleteButtonContainer.appendChild(deleteBtn);

        sliderWrapper.addEventListener("mouseenter", () => {
          if (coverBtn.style.background !== "rgb(255, 217, 61)") buttonContainer.style.opacity = "1";
          deleteButtonContainer.style.opacity = "1";
        });
        sliderWrapper.addEventListener("mouseleave", () => {
          if (coverBtn.style.background !== "rgb(255, 217, 61)") buttonContainer.style.opacity = "0";
          deleteButtonContainer.style.opacity = "0";
        });

        sliderWrapper.appendChild(deleteButtonContainer);
        // 사진 칸은 본문 맨 위에
        editor.insertBefore(sliderWrapper, editor.firstChild);
        keepSliderOnTop(editor);

        if (!selectedCoverRef.current && normalizedUrls.length > 0) {
          setSelectedCoverImage(normalizedUrls[0]);
          coverBtn.style.background = "#FFD93D"; coverBtn.style.color = "#000";
          buttonContainer.style.opacity = "1";
        }
      }
    } catch (error) {
      alert("이미지 업로드에 실패했습니다.");
    }

    e.target.value = "";
  };

  // execCommand 래퍼
  const execCmd = (command: string, value?: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false, value ?? undefined);
  };


  return (
    <div className="write-editor-section">
      <label className="write-label">CONTENT *</label>

      <div className="write-toolbar">
        {/* 볼드 */}
        <button
          type="button"
          className="toolbar-btn"
          title="볼드"
          onMouseDown={(e) => { e.preventDefault(); execCmd("bold"); }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" stroke="currentColor" strokeWidth="1" fill="none" />
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" stroke="currentColor" strokeWidth="1" fill="none" />
          </svg>
        </button>

        <div className="toolbar-divider" />

        {/* 가운데 정렬 */}
        <button
          type="button"
          className="toolbar-btn"
          title="가운데 정렬"
          onMouseDown={(e) => { e.preventDefault(); execCmd("justifyCenter"); }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z" />
          </svg>
        </button>

        <div className="toolbar-divider" />

        {/* 이미지 삽입 */}
        <label className="toolbar-btn" title="이미지 삽입">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageInsert}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {/* WYSIWYG 에디터 본문 */}
    <div
      ref={editorRef}
      className="blog-editor-wysiwyg"
      contentEditable="true"
      suppressContentEditableWarning={true}
      onKeyDown={(e) => {
        // 지우기·잘라내기 직전 사진 칸 기억
        const isDelete = e.key === "Backspace" || e.key === "Delete";
        const isCut = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x";
        const slider = e.currentTarget.querySelector(".image-slider-wrapper") as HTMLElement | null;
        sliderBeforeEditRef.current = isDelete || isCut ? slider : null;
        if (!(isDelete || isCut) || !slider) return;

        // 사진 칸까지 선택된 채로 지우면 글만 지움
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
        const range = sel.getRangeAt(0);
        if (!range.intersectsNode(slider)) return;
        const textOnly = range.cloneRange();
        textOnly.setStartAfter(slider);
        if (textOnly.collapsed) {
          e.preventDefault(); // 사진 칸만 선택된 경우 무시
          return;
        }
        sel.removeAllRanges();
        sel.addRange(textOnly);
      }}
      onInput={(e) => {
        restoreSliderIfRemoved(e.currentTarget, sliderBeforeEditRef.current);
        sliderBeforeEditRef.current = null;
        keepSliderOnTop(e.currentTarget);
      }}
      onPointerDown={(e) => {
        // 사진 위치 조정 시작
        const target = e.target as HTMLElement;
        if (target.tagName !== "IMG" || !target.closest(".slider-images-container")) return;
        if (startImagePositionDrag(target as HTMLImageElement, e.clientX, e.clientY)) {
          e.preventDefault();
        }
      }}
      onDragStart={(e) => {
        // 브라우저 기본 이미지 드래그 막기
        if ((e.target as HTMLElement).tagName === "IMG") e.preventDefault();
      }}
    />
  </div>
  );
});

Editor.displayName = "Editor";

export default Editor;
