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

const Editor = forwardRef<EditorHandle, EditorProps>(({
  editingStory,
  currentDraft,
}, ref) => {
  const [selectedCoverImage, setSelectedCoverImage] = useState<string | null>(
    editingStory?.imageUrl || null,
  );
  const editorRef = useRef<HTMLDivElement>(null);
  const { upload } = useImageUpload();

  // 부모에서 getContent(), getCoverImage() 호출 가능하도록 노출
  useImperativeHandle(ref, () => ({
    getContent: () => editorRef.current?.innerHTML || "",
    getCoverImage: () => selectedCoverImage,
  }));

  // 상대 경로 이미지 URL을 절대 경로로 변환
  const normalizeImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `http://localhost:8080${url.startsWith("/") ? "" : "/"}${url}`;
  };

  // 수정/임시저장 모드 진입 시 에디터 내용 초기화
  useEffect(() => {
    if (editorRef.current && (editingStory || currentDraft)) {
      editorRef.current.innerHTML =
        editingStory?.description || currentDraft?.description || "";
    }
  }, [editingStory?.id, currentDraft?.id]);

  // 수정/임시저장 모드 슬라이더 초기화 - 이미지 URL 정규화 및 이전/다음/커버/삭제 이벤트 바인딩
  useEffect(() => {
    if ((editingStory && editingStory.tags) || currentDraft) {
      setTimeout(() => {
        const sliders = document.querySelectorAll(".image-slider-wrapper");
        sliders.forEach((slider) => {
          const images = slider.querySelectorAll("img");
          images.forEach((img) => {
            const src = img.getAttribute("src");
            if (src && !src.startsWith("http")) {
              img.setAttribute("src", normalizeImageUrl(src));
            }
          });

          const imagesContainer = slider.querySelector(".slider-images-container");
          const prevBtn = slider.querySelector(".slider-prev-btn");
          const nextBtn = slider.querySelector(".slider-next-btn");
          const indicator = slider.querySelector(".slider-indicator");
          const coverBtn = slider.querySelector(".slider-cover-btn");
          const deleteBtn = slider.querySelector(".slider-delete-btn");
          const buttonContainer = slider.querySelector(".slider-button-container");
          const deleteButtonContainer = slider.querySelector(".slider-delete-container");

          if (!imagesContainer) return;

          const allImages = Array.from(imagesContainer.querySelectorAll("img"));
          if (allImages.length === 0) return;

          let currentIndex = 0;

          allImages.forEach((img) => { (img as HTMLElement).style.display = "none"; });
          (allImages[0] as HTMLElement).style.display = "block";

          if (indicator) indicator.textContent = `1/${allImages.length}`;

          const updateCoverButton = () => {
            const currentImg = allImages[currentIndex] as HTMLImageElement;
            const currentSrc = currentImg.getAttribute("data-image-src") || currentImg.src;
            if (coverBtn) {
              if (currentSrc === selectedCoverImage) {
                (coverBtn as HTMLElement).style.background = "#FFD93D";
                (coverBtn as HTMLElement).style.color = "#000";
                if (buttonContainer) (buttonContainer as HTMLElement).style.opacity = "1";
              } else {
                (coverBtn as HTMLElement).style.background = "#000";
                (coverBtn as HTMLElement).style.color = "#fff";
              }
            }
          };

          if (prevBtn) {
            const handlePrev = (e: Event) => {
              e.preventDefault(); e.stopPropagation();
              (allImages[currentIndex] as HTMLElement).style.display = "none";
              currentIndex = (currentIndex - 1 + allImages.length) % allImages.length;
              (allImages[currentIndex] as HTMLElement).style.display = "block";
              if (indicator) indicator.textContent = `${currentIndex + 1}/${allImages.length}`;
              updateCoverButton();
            };
            prevBtn.removeEventListener("click", handlePrev as EventListener);
            prevBtn.addEventListener("click", handlePrev as EventListener);
          }

          if (nextBtn) {
            const handleNext = (e: Event) => {
              e.preventDefault(); e.stopPropagation();
              (allImages[currentIndex] as HTMLElement).style.display = "none";
              currentIndex = (currentIndex + 1) % allImages.length;
              (allImages[currentIndex] as HTMLElement).style.display = "block";
              if (indicator) indicator.textContent = `${currentIndex + 1}/${allImages.length}`;
              updateCoverButton();
            };
            nextBtn.removeEventListener("click", handleNext as EventListener);
            nextBtn.addEventListener("click", handleNext as EventListener);
          }

          if (coverBtn) {
            const handleCover = (e: Event) => {
              e.preventDefault(); e.stopPropagation();
              document.querySelectorAll(".slider-cover-btn").forEach((btn) => {
                (btn as HTMLElement).style.background = "#000";
                (btn as HTMLElement).style.color = "#fff";
                const container = (btn as HTMLElement).parentElement;
                if (container) (container as HTMLElement).style.opacity = "0";
              });
              const currentImg = allImages[currentIndex] as HTMLImageElement;
              const currentSrc = currentImg.getAttribute("data-image-src") || currentImg.src;
              setSelectedCoverImage(currentSrc);
              (coverBtn as HTMLElement).style.background = "#FFD93D";
              (coverBtn as HTMLElement).style.color = "#000";
              if (buttonContainer) (buttonContainer as HTMLElement).style.opacity = "1";
            };
            coverBtn.removeEventListener("click", handleCover as EventListener);
            coverBtn.addEventListener("click", handleCover as EventListener);
          }

          if (deleteBtn) {
            const handleDelete = (e: Event) => {
              e.preventDefault(); e.stopPropagation();
              if (allImages.length === 1) {
                const src = (allImages[0] as HTMLImageElement).getAttribute("data-image-src") || (allImages[0] as HTMLImageElement).src;
                if (selectedCoverImage === src) setSelectedCoverImage(null);
                slider.remove();
                return;
              }
              const currentImg = allImages[currentIndex] as HTMLImageElement;
              const currentSrc = currentImg.getAttribute("data-image-src") || currentImg.src;
              if (selectedCoverImage === currentSrc) setSelectedCoverImage(null);
              currentImg.remove();
              const remainingImages = imagesContainer.querySelectorAll("img");
              if (currentIndex >= remainingImages.length) currentIndex = remainingImages.length - 1;
              remainingImages.forEach((img, idx) => {
                (img as HTMLElement).style.display = idx === currentIndex ? "block" : "none";
              });
              if (indicator) indicator.textContent = `${currentIndex + 1}/${remainingImages.length}`;
              if (remainingImages.length === 1) {
                if (prevBtn) (prevBtn as HTMLElement).style.display = "none";
                if (nextBtn) (nextBtn as HTMLElement).style.display = "none";
              }
            };
            deleteBtn.removeEventListener("click", handleDelete as EventListener);
            deleteBtn.addEventListener("click", handleDelete as EventListener);
          }

          slider.addEventListener("mouseenter", () => {
            if (coverBtn && (coverBtn as HTMLElement).style.background !== "rgb(255, 217, 61)") {
              if (buttonContainer) (buttonContainer as HTMLElement).style.opacity = "1";
            }
            if (deleteButtonContainer) (deleteButtonContainer as HTMLElement).style.opacity = "1";
          });
          slider.addEventListener("mouseleave", () => {
            if (coverBtn && (coverBtn as HTMLElement).style.background !== "rgb(255, 217, 61)") {
              if (buttonContainer) (buttonContainer as HTMLElement).style.opacity = "0";
            }
            if (deleteButtonContainer) (deleteButtonContainer as HTMLElement).style.opacity = "0";
          });

          updateCoverButton();
        });
      }, 100);
    }
  }, [editingStory, currentDraft, selectedCoverImage]);

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

      const existingSlider = editor.querySelector(".image-slider-wrapper:last-of-type");

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

        if (existingImages.length === 1 && allImages.length > 1) {
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
            if (coverBtn && currentSrc === selectedCoverImage) {
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
            if (coverBtn && currentSrc === selectedCoverImage) {
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
            if (currentSrc === selectedCoverImage) {
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
            if (currentSrc === selectedCoverImage) {
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
            if (selectedCoverImage === src) setSelectedCoverImage(null);
            sliderWrapper.remove();
            return;
          }
          const currentImg = images[currentIndex] as HTMLImageElement;
          const currentSrc = currentImg.getAttribute("data-image-src");
          if (selectedCoverImage === currentSrc) setSelectedCoverImage(null);
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
        editor.appendChild(sliderWrapper);
        editor.appendChild(document.createElement("br"));

        if (!selectedCoverImage && normalizedUrls.length > 0) {
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
    />
  </div>
  );
});

Editor.displayName = "Editor";

export default Editor;