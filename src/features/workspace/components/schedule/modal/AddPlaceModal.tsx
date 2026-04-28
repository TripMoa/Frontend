//src\features\workspace\components\schedule\modal\AddPlaceModal.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import "../../../styles/modals.css";
import { useNaverMap } from "../../../hooks/useNaverMap";
import { searchPlaces } from "../../../../../api/place.api";
import { CATEGORY_COLOR, getCategoryIcon } from "../../../hooks/schedule.constants";

interface Place {
  id: string;
  name: string;
  category: string;
  address: string;
  imageUrl?: string;
  rating?: number;
  description?: string;
  lat?: number;
  lng?: number;
  memo?: string;
}

interface AddPlaceModalProps {
  onClose: () => void;
  onAddPlace: (place: Place) => void;
  existingPlaces: Place[];
}


const CATEGORY_MAP: Record<string, string> = {
  관광지: "관광",
  맛집: "맛집",
  카페: "카페",
  쇼핑: "쇼핑",
  숙소: "숙소",
  출발지: "교통",  // 백엔드 "출발지" → 프론트 "교통"
};

const AddPlaceModal: React.FC<AddPlaceModalProps> = ({
  onClose,
  onAddPlace,
  existingPlaces,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [pendingPlace, setPendingPlace] = useState<Place | null>(null); // 카테고리 확인 대기 중인 장소

  const { mapLoaded, mapKey } = useNaverMap();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  // ── geocoder 서브모듈 추가 로드 (역지오코딩용, 이 모달에서만 필요) ──
  const [geocoderLoaded, setGeocoderLoaded] = useState(false);

  useEffect(() => {
    if (!mapLoaded) return;
    if (window.naver?.maps?.Service) { setGeocoderLoaded(true); return; }

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${mapKey}&submodules=geocoder`;
    script.async = true;
    script.onload = () => setGeocoderLoaded(true);
    document.head.appendChild(script);
  }, [mapLoaded, mapKey]);

  // ── 지도 초기화 ─────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

    const map = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(37.5665, 126.978),
      zoom: 13,
      mapTypeControl: false,
      scaleControl: false,
      logoControl: false,
      mapDataControl: false,
    });

    infoWindowRef.current = new window.naver.maps.InfoWindow({
      anchorSkew: true,
      backgroundColor: "#fff",
      borderColor: "#000",
      borderWidth: 2,
      disableAnchor: false,
      pixelOffset: new window.naver.maps.Point(0, -10),
    });

    // 지도 클릭 → 해당 위치에서 검색
    window.naver.maps.Event.addListener(map, "click", (e: any) => {
      const lat = e.latlng.lat();
      const lng = e.latlng.lng();
      handleMapClick(lat, lng, map);
    });

    mapInstanceRef.current = map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded]);

  // ── 마커 초기화 ─────────────────────────────────────────────
  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    infoWindowRef.current?.close();
  };

  // ── 마커 그리기 ─────────────────────────────────────────────
  const drawMarkers = useCallback((places: Place[], onMarkerClick: (p: Place) => void) => {
    if (!mapInstanceRef.current || !window.naver) return;
    clearMarkers();
    if (!places.length) return;

    const bounds = new window.naver.maps.LatLngBounds();

    places.forEach((place, idx) => {
      if (place.lat == null || place.lng == null) return;

      const pos = new window.naver.maps.LatLng(place.lat, place.lng);
      const color = CATEGORY_COLOR[place.category] || "#333";

      const marker = new window.naver.maps.Marker({
        position: pos,
        map: mapInstanceRef.current,
        icon: {
          content: `
            <div style="
              background:${color};color:#fff;
              border:2px solid #fff;border-radius:50% 50% 50% 0;
              transform:rotate(-45deg);width:28px;height:28px;
              display:flex;align-items:center;justify-content:center;
              box-shadow:0 2px 6px rgba(0,0,0,0.35);cursor:pointer;
              font-size:11px;font-weight:bold;">
              <span style="transform:rotate(45deg)">${idx + 1}</span>
            </div>`,
          anchor: new window.naver.maps.Point(14, 28),
        },
        zIndex: 100,
      });

      window.naver.maps.Event.addListener(marker, "click", () => {
        infoWindowRef.current.setContent(`
          <div style="padding:10px 14px;min-width:160px;font-family:inherit">
            <div style="font-weight:bold;font-size:13px;margin-bottom:4px">${place.name}</div>
            <div style="font-size:11px;color:#666;margin-bottom:6px">${place.address || ""}</div>
            <span style="background:${color};color:#fff;padding:2px 7px;border-radius:3px;font-size:11px;font-weight:bold">${place.category}</span>
          </div>
        `);
        infoWindowRef.current.open(mapInstanceRef.current, marker);
        onMarkerClick(place);
      });

      bounds.extend(pos);
      markersRef.current.push(marker);
    });

    if (markersRef.current.length === 1) {
      mapInstanceRef.current.setCenter(new window.naver.maps.LatLng(places[0].lat!, places[0].lng!));
      mapInstanceRef.current.setZoom(15);
    } else {
      mapInstanceRef.current.fitBounds(bounds, { top: 50, right: 40, bottom: 100, left: 40 });
    }
  }, []);

  // ── 검색 실행 (공통) ────────────────────────────────────────
  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    setErrorMsg(null);
    setSearchResults([]);
    setSelectedPlace(null);

    try {
      const { data } = await searchPlaces(query.trim(), 12);

      if (!data.success || !data.places?.length) {
        setErrorMsg(`'${query}' 검색 결과가 없습니다.`);
        clearMarkers();
        return;
      }

      const mapped: Place[] = data.places.map((p: any, idx: number) => ({
        id: `search_${Date.now()}_${idx}`,
        name: p.name,
        category: CATEGORY_MAP[p.category] ?? p.category ?? "관광",
        address: p.address || "",
        description: p.description || "",
        lat: p.lat,
        lng: p.lng,
        memo: "",
      }));

      setSearchResults(mapped);
      // drawMarkers는 state 업데이트 후 effect에서 실행되면 타이밍 이슈가 있어서
      // 직접 mapped 넘김
      setTimeout(() => {
        drawMarkers(mapped, (p) => setSelectedPlace(p));
      }, 0);
    } catch (e: any) {
      setErrorMsg(e.message || "검색 중 오류가 발생했습니다.");
    } finally {
      setIsSearching(false);
    }
  }, [drawMarkers]);

  const handleSearch = () => doSearch(searchQuery);
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  // ── 지도 클릭 → 임시 핀 + 네이버 SDK reverseGeocode 후 검색 ──
  const handleMapClick = (lat: number, lng: number, map: any) => {
    if (!window.naver) return;

    // 임시 핀
    const tempMarker = new window.naver.maps.Marker({
      position: new window.naver.maps.LatLng(lat, lng),
      map,
      icon: {
        content: `<div style="
          width:16px;height:16px;border-radius:50%;
          background:#000;border:3px solid #fff;
          box-shadow:0 2px 6px rgba(0,0,0,0.5)"></div>`,
        anchor: new window.naver.maps.Point(8, 8),
      },
      zIndex: 200,
    });

    // geocoder 미로드 시 지도 중심 이동만
    if (!window.naver.maps.Service) {
      tempMarker.setMap(null);
      map.setCenter(new window.naver.maps.LatLng(lat, lng));
      return;
    }

    // 네이버 지도 SDK의 reverseGeocode
    window.naver.maps.Service.reverseGeocode(
      {
        coords: new window.naver.maps.LatLng(lat, lng),
        orders: [
          window.naver.maps.Service.OrderType.ADDR,
          window.naver.maps.Service.OrderType.ROAD_ADDR,
        ].join(","),
      },
      (status: any, response: any) => {
        tempMarker.setMap(null);

        if (status !== window.naver.maps.Service.Status.OK) return;

        const result = response.v2?.results?.[0];
        const region = result?.region;
        const area2 = region?.area2?.name || "";
        const area3 = region?.area3?.name || "";

        const query = [area2, area3].filter(Boolean).join(" ");
        if (query) {
          setSearchQuery(query);
          doSearch(query);
        }
      }
    );
  };

  // ── 리스트 아이템 클릭 → 지도 포커스 ───────────────────────
  const handleListClick = (place: Place, idx: number) => {
    setSelectedPlace(place);
    if (!mapInstanceRef.current || !window.naver || place.lat == null) return;

    mapInstanceRef.current.setCenter(new window.naver.maps.LatLng(place.lat, place.lng));
    mapInstanceRef.current.setZoom(16);

    if (markersRef.current[idx]) {
      window.naver.maps.Event.trigger(markersRef.current[idx], "click");
    }
  };

  // ── 장소 추가 (카테고리 확인 스텝) ─────────────────────────
  const handleAdd = (place: Place) => {
    setPendingPlace({ ...place });
  };

  const [addedName, setAddedName] = useState<string | null>(null);

  const handleConfirmAdd = () => {
    if (!pendingPlace) return;
    onAddPlace(pendingPlace);
    setAddedName(pendingPlace.name);
    setPendingPlace(null);
    setTimeout(() => setAddedName(null), 2500);
  };

  const isAdded = (place: Place) => existingPlaces.some((p) => p.id === place.id);

  return (
    <div
      className="modal-overlay active"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal-window"
        style={{
          width: "95%", maxWidth: "1400px", height: "88vh",
          display: "flex", flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── 카테고리 확인 미니 팝업 ── */}
        {pendingPlace && (
          <div
            style={{
              position: "absolute", inset: 0, zIndex: 100,
              background: "rgba(0,0,0,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "inherit",
            }}
            onClick={() => setPendingPlace(null)}
          >
            <div
              style={{
                background: "#fff",
                border: "2px solid #000",
                borderRadius: "10px",
                padding: "28px 28px 24px",
                width: "340px",
                boxShadow: "6px 6px 0px #000",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 장소명 */}
              <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#999", fontFamily: "var(--font-mono)" }}>
                카테고리 확인
              </p>
              <p style={{ margin: "0 0 20px", fontWeight: "bold", fontSize: "16px", color: "#000" }}>
                📍 {pendingPlace.name}
              </p>

              {/* 카테고리 선택 */}
              <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#555" }}>
                이 장소의 카테고리를 선택해주세요.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
                {Object.entries(CATEGORY_COLOR).map(([cat, color]) => {
                  const isSelected = pendingPlace.category === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setPendingPlace({ ...pendingPlace, category: cat })}
                      style={{
                        padding: "7px 16px",
                        borderRadius: "20px",
                        border: `2px solid ${color}`,
                        background: isSelected ? color : "#fff",
                        color: isSelected ? "#fff" : color,
                        fontWeight: "bold",
                        fontSize: "13px",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {getCategoryIcon(cat)} {cat}
                    </button>
                  );
                })}
              </div>

              {/* 버튼 */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setPendingPlace(null)}
                  style={{
                    flex: 1, padding: "11px",
                    background: "#fff", color: "#000",
                    border: "2px solid #000", borderRadius: "6px",
                    fontWeight: "bold", fontSize: "14px", cursor: "pointer",
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmAdd}
                  style={{
                    flex: 2, padding: "11px",
                    background: "#000", color: "#fff",
                    border: "2px solid #000", borderRadius: "6px",
                    fontWeight: "bold", fontSize: "14px", cursor: "pointer",
                  }}
                >
                  + 추가하기
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ── 헤더 ── */}
        <div className="modal-header">
          <span className="mh-title">&gt;&gt; ADD NEW PLACE</span>
          <button className="mh-close" onClick={onClose}>CLOSE [X]</button>
        </div>

        {/* ── 검색바 ── */}
        <div style={{
          padding: "14px 20px", borderBottom: "2px solid #eee",
          background: "#fff", flexShrink: 0,
        }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              placeholder="🔍 장소, 지역을 검색하세요... (예: 오사카 라멘, 도톤보리) · 지도 클릭으로도 검색 가능"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{
                flex: 1, height: "44px", padding: "0 18px",
                border: "2px solid #ddd", borderRadius: "8px", fontSize: "14px",
              }}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              style={{
                width: "90px", height: "44px",
                background: "#000", color: "#fff",
                border: "2px solid #000", borderRadius: "8px",
                fontWeight: "bold", cursor: isSearching ? "not-allowed" : "pointer",
                opacity: isSearching ? 0.7 : 1,
              }}
            >
              {isSearching ? "검색중" : "검색"}
            </button>
          </div>
        </div>

        {/* ── 바디: 왼쪽 리스트 + 오른쪽 지도 ── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* 왼쪽: 결과 리스트 */}
          <div style={{
            width: "370px", flexShrink: 0,
            overflowY: "auto", borderRight: "2px solid #eee",
            background: "#fafafa",
          }}>
            {/* 스티키 헤더 */}
            <div style={{
              padding: "10px 16px",
              fontFamily: "var(--font-mono)", fontWeight: "bold",
              fontSize: "12px", color: "#666",
              borderBottom: "1px solid #eee", background: "#fff",
              position: "sticky", top: 0, zIndex: 1,
            }}>
              검색결과 {searchResults.length}개
              {searchResults.length > 0 && (
                <span style={{ fontWeight: "normal", fontSize: "11px", color: "#aaa", marginLeft: "6px" }}>
                  · 클릭하면 지도 이동
                </span>
              )}
            </div>

            {/* 에러 */}
            {errorMsg && (
              <div style={{ padding: "20px 16px", fontSize: "13px", color: "#e53935" }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {/* 빈 상태 */}
            {!errorMsg && searchResults.length === 0 && !isSearching && (
              <div style={{ padding: "50px 16px", textAlign: "center", color: "#bbb" }}>
                <div style={{ fontSize: "36px", marginBottom: "14px" }}>🗺️</div>
                <p style={{ fontSize: "13px", lineHeight: 1.8, margin: 0 }}>
                  검색어를 입력하거나<br />지도를 클릭해보세요
                </p>
              </div>
            )}

            {/* 장소 카드 */}
            {searchResults.map((place, idx) => {
              const added = isAdded(place);
              const selected = selectedPlace?.id === place.id;
              const color = CATEGORY_COLOR[place.category] || "#333";

              return (
                <div
                  key={place.id}
                  onClick={() => handleListClick(place, idx)}
                  style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid #eee",
                    background: selected ? "#f0f0f0" : "#fff",
                    borderLeft: selected ? "4px solid #000" : "4px solid transparent",
                    cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) e.currentTarget.style.background = "#f8f8f8";
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) e.currentTarget.style.background = "#fff";
                  }}
                >
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    {/* 번호 뱃지 */}
                    <div style={{
                      width: "22px", height: "22px", borderRadius: "50%",
                      background: color, color: "#fff", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "11px", fontWeight: "bold", marginTop: "2px",
                    }}>
                      {idx + 1}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", flexWrap: "wrap", minWidth: 0 }}>
                        <span style={{
                          background: color, color: "#fff",
                          padding: "1px 6px", fontSize: "10px", fontWeight: "bold",
                          borderRadius: "3px",
                        }}>
                          {place.category}
                        </span>
                        <span style={{
                          fontSize: "14px", fontWeight: "bold",
                          flex: 1,
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                          {place.name}
                        </span>
                      </div>

                      {place.address && (
                        <p style={{ fontSize: "11px", color: "#888", margin: "0 0 6px", lineHeight: 1.4 }}>
                          📍 {place.address}
                        </p>
                      )}
                      {place.description && (
                        <p style={{
                          fontSize: "11px", color: "#aaa", margin: "0 0 8px",
                          lineHeight: 1.4,
                          overflow: "hidden", textOverflow: "ellipsis",
                          display: "-webkit-box", WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical" as any,
                        }}>
                          {place.description}
                        </p>
                      )}

                      <button
                        onClick={(e) => { e.stopPropagation(); handleAdd(place); }}
                        disabled={added}
                        style={{
                          width: "100%", padding: "7px 0",
                          background: added ? "#4caf50" : "#000",
                          color: "#fff", border: "none", borderRadius: "5px",
                          fontWeight: "bold", fontSize: "12px",
                          cursor: added ? "not-allowed" : "pointer",
                        }}
                      >
                        {added ? "✓ 추가됨" : "+ 추가하기"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 오른쪽: 지도 */}
          <div style={{ flex: 1, position: "relative", background: "#e8e8e8", overflow: "hidden" }}>
            <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

            {/* 지도 미로드 */}
            {!mapLoaded && (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                background: "#f0f0f0", color: "#999",
              }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>🗺️</div>
                <p style={{ fontSize: "13px" }}>
                  {mapKey ? "지도 로딩 중..." : "VITE_NAVER_MAP_CLIENT_ID가 설정되지 않았습니다"}
                </p>
              </div>
            )}

            {/* 지도 클릭 힌트 — 항상 표시 */}
            {mapLoaded && (
              <div style={{
                position: "absolute", top: "12px", left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.62)", color: "#fff",
                padding: "5px 14px", borderRadius: "20px",
                fontSize: "12px", pointerEvents: "none", whiteSpace: "nowrap",
              }}>
                지도를 클릭하면 주변 장소를 검색합니다
              </div>
            )}

            {/* 선택 장소 하단 패널 */}
            {selectedPlace && (
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "#fff", borderTop: "2px solid #000",
                padding: "12px 20px",
                display: "flex", alignItems: "center", gap: "14px",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{
                      background: CATEGORY_COLOR[selectedPlace.category] || "#333",
                      color: "#fff", padding: "2px 8px",
                      fontSize: "11px", fontWeight: "bold", borderRadius: "3px",
                    }}>
                      {selectedPlace.category}
                    </span>
                    <span style={{ fontWeight: "bold", fontSize: "15px" }}>
                      {selectedPlace.name}
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>
                    📍 {selectedPlace.address}
                  </p>
                </div>
                <button
                  onClick={() => handleAdd(selectedPlace)}
                  disabled={isAdded(selectedPlace)}
                  style={{
                    padding: "10px 22px", flexShrink: 0,
                    background: isAdded(selectedPlace) ? "#4caf50" : "#000",
                    color: "#fff", border: "2px solid #000",
                    borderRadius: "6px", fontWeight: "bold",
                    fontSize: "14px", cursor: isAdded(selectedPlace) ? "not-allowed" : "pointer",
                  }}
                >
                  {isAdded(selectedPlace) ? "✓ 추가됨" : "+ 추가하기"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* 토스트 */}
      {addedName && (
        <div style={{
          position: "absolute", bottom: "24px", left: "50%",
          transform: "translateX(-50%)",
          background: "#222", color: "#fff",
          padding: "10px 22px", borderRadius: "20px",
          fontSize: "13px", fontWeight: "bold",
          boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          zIndex: 200, pointerEvents: "none",
          whiteSpace: "nowrap",
          animation: "fadeInUp 0.2s ease",
        }}>
          ✓ {addedName} 추가됨
        </div>
      )}
      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateX(-50%) translateY(8px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
};

export default AddPlaceModal;