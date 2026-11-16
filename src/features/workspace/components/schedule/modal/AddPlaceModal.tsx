//src\features\workspace\components\schedule\modal\AddPlaceModal.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNaverMap } from "../../../hooks/useNaverMap";
import { searchPlaces } from "../../../../../api/place.api";
import type { PlaceSearchItem } from "../../../../../api/place.api";
import { CATEGORY_COLOR, CATEGORY_LIST } from "../../../hooks/schedule.constants";
import { PIN_SIZE, TEMP_PIN_SIZE, cssVar, infoHtml, infoWindowBase, pinHtml, tempPinHtml } from "../mapStyle";
import type { NaverMapObject } from "../../../hooks/naverMapTypes";
import { apiMessage } from "../../../hooks/apiError";

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
}

interface AddPlaceModalProps {
  onClose: () => void;
  /** 있으면 헤더에 "저장한 장소에서 고르기" 링크를 보여준다 */
  onBackToSaved?: () => void;
  onAddPlace: (place: Place) => void | Promise<void>;
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
  onBackToSaved,
  onAddPlace,
  existingPlaces,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null); // 추가 요청 진행 중인 장소
  const [hasClickedMap, setHasClickedMap] = useState(false);
  const [categoryPickerFor, setCategoryPickerFor] = useState<string | null>(null); // 카테고리 드롭다운 열린 장소 id

  const { mapLoaded, mapKey } = useNaverMap();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<NaverMapObject>(null);
  const markersRef = useRef<NaverMapObject[]>([]);
  const markerByPlaceIdRef = useRef<Record<string, NaverMapObject>>({});
  const infoWindowRef = useRef<NaverMapObject>(null);
  const searchSeqRef = useRef(0); // 오래된 검색 응답이 최신 결과를 덮어쓰지 않도록

  // ── geocoder 서브모듈 추가 로드 (역지오코딩용, 이 모달에서만 필요) ──
  useEffect(() => {
    if (!mapLoaded) return;
    if (window.naver?.maps?.Service) return;

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${mapKey}&submodules=geocoder`;
    script.async = true;
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
      ...infoWindowBase(),
      disableAnchor: false,
      pixelOffset: new window.naver.maps.Point(0, -(PIN_SIZE / 2)),
    });

    // 지도 클릭 → 해당 위치에서 검색
    window.naver.maps.Event.addListener(map, "click", (e: NaverMapObject) => {
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
    markerByPlaceIdRef.current = {};
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
      const color = CATEGORY_COLOR[place.category] || cssVar("--tm-line-strong", "#999999");

      const marker = new window.naver.maps.Marker({
        position: pos,
        map: mapInstanceRef.current,
        icon: {
          content: pinHtml(color, idx + 1),
          anchor: new window.naver.maps.Point(PIN_SIZE / 2, PIN_SIZE / 2),
        },
        zIndex: 100,
      });

      window.naver.maps.Event.addListener(marker, "click", () => {
        infoWindowRef.current.setContent(infoHtml(place, color));
        infoWindowRef.current.open(mapInstanceRef.current, marker);
        onMarkerClick(place);
      });

      bounds.extend(pos);
      markersRef.current.push(marker);
      markerByPlaceIdRef.current[place.id] = marker;
    });

    if (markersRef.current.length === 1) {
      mapInstanceRef.current.setCenter(new window.naver.maps.LatLng(places[0].lat!, places[0].lng!));
      mapInstanceRef.current.setZoom(15);
    } else {
      mapInstanceRef.current.fitBounds(bounds, { top: 50, right: 40, bottom: 100, left: 40 });
    }
  }, []);

  // ── 검색 실행 ───────────────────────────────────────────────
  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    const seq = ++searchSeqRef.current; // 이 호출 이후 더 최신 검색이 시작되면 결과를 무시하기 위한 순번
    setIsSearching(true);
    setErrorMsg(null);
    setSelectedPlace(null);

    try {
      const { data } = await searchPlaces(query.trim(), 12);
      if (seq !== searchSeqRef.current) return; // 이미 다음 검색이 시작됨 — 이 응답은 폐기

      if (!data.success || !data.places?.length) {
        setSearchResults([]);
        setErrorMsg(`'${query}' 검색 결과가 없습니다.`);
        clearMarkers();
        return;
      }

      const mapped: Place[] = data.places.map((p: PlaceSearchItem, idx: number) => ({
        id: `search_${Date.now()}_${idx}`,
        name: p.name,
        category: CATEGORY_MAP[p.category ?? ""] ?? p.category ?? "관광",
        address: p.address || "",
        description: p.description || "",
        lat: p.lat,
        lng: p.lng,
      }));

      setSearchResults(mapped);
      // drawMarkers는 state 업데이트 후 effect에서 실행되면 타이밍 이슈가 있어서
      // 직접 mapped 넘김
      setTimeout(() => {
        drawMarkers(mapped, (p) => setSelectedPlace(p));
      }, 0);
    } catch (e) {
      if (seq !== searchSeqRef.current) return;
      setErrorMsg(apiMessage(e, "검색 중 오류가 발생했습니다."));
    } finally {
      if (seq === searchSeqRef.current) setIsSearching(false);
    }
  }, [drawMarkers]);

  const handleSearch = () => doSearch(searchQuery);

  // ── 지도 클릭 → 임시 핀 + 네이버 SDK reverseGeocode 후 검색 ──
  const handleMapClick = (lat: number, lng: number, map: NaverMapObject) => {
    if (!window.naver) return;
    setHasClickedMap(true);

    // 임시 핀
    const tempMarker = new window.naver.maps.Marker({
      position: new window.naver.maps.LatLng(lat, lng),
      map,
      icon: {
        content: tempPinHtml(),
        anchor: new window.naver.maps.Point(TEMP_PIN_SIZE / 2, TEMP_PIN_SIZE / 2),
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
      (status: NaverMapObject, response: NaverMapObject) => {
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
  const handleListClick = (place: Place) => {
    setSelectedPlace(place);
    if (!mapInstanceRef.current || !window.naver || place.lat == null) return;

    mapInstanceRef.current.setCenter(new window.naver.maps.LatLng(place.lat, place.lng));
    mapInstanceRef.current.setZoom(16);

    const marker = markerByPlaceIdRef.current[place.id];
    if (marker) {
      window.naver.maps.Event.trigger(marker, "click");
    }
  };

  // ── 장소 추가 ────────────────────────────────────────────────
  // 검색 시 자동 추정된 카테고리로 바로 추가하되, 자동 분류가 틀렸을 때를 대비해
  // 카드의 카테고리 배지를 눌러 추가 전에 바로 고칠 수 있게 한다.
  const [addedName, setAddedName] = useState<string | null>(null);

  const isAdded = (place: Place) =>
    existingPlaces.some((p) => p.name === place.name && p.lat === place.lat);

  const updateResultCategory = (placeId: string, newCategory: string) => {
    setSearchResults((prev) => prev.map((p) => (p.id === placeId ? { ...p, category: newCategory } : p)));
    setSelectedPlace((prev) => (prev && prev.id === placeId ? { ...prev, category: newCategory } : prev));
    setCategoryPickerFor(null);
  };

  const handleAdd = async (place: Place) => {
    if (isAdded(place) || addingId) return;
    setAddingId(place.id);
    setErrorMsg(null);
    try {
      await onAddPlace(place);
      setAddedName(place.name);
      setTimeout(() => setAddedName(null), 2500);
    } catch (e) {
      setErrorMsg(apiMessage(e, `'${place.name}' 추가에 실패했습니다.`));
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="tm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="tm-modal tm-modal--wide ws-search"
        role="dialog"
        aria-modal="true"
        aria-label="장소 검색"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 헤더 ── */}
        <div className="tm-modal__head">
          <h3 className="tm-modal__title">장소 검색</h3>
          <button type="button" className="tm-btn tm-btn--sm" onClick={onClose}>닫기</button>
        </div>

        {/* ── 검색바 ── */}
        <div className="tm-input-group ws-search__bar">
          <input
            type="text"
            className="tm-input tm-grow"
            aria-label="장소 검색"
            placeholder="장소, 지역 검색 (예: 오사카 라멘) · 지도를 눌러도 검색돼요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
          />
          <button type="button" className="tm-btn tm-btn--sm tm-btn--primary" onClick={handleSearch} disabled={isSearching}>
            {isSearching ? "검색 중…" : "검색"}
          </button>
        </div>

        {/* ── 바디: 왼쪽 결과 + 오른쪽 지도 ── */}
        <div className="ws-search__body">
          <div className="ws-search__list">
            <div className="ws-search__count">
              검색결과 <b>{searchResults.length}개</b>
              {searchResults.length > 0 && <span className="tm-hint"> · 카테고리를 눌러 바꿀 수 있어요</span>}
            </div>

            {errorMsg && <div className="tm-notice tm-notice--warn ws-search__msg" role="alert">{errorMsg}</div>}

            {!errorMsg && searchResults.length === 0 && !isSearching && (
              <p className="tm-empty">검색어를 입력하거나 지도를 눌러 보세요</p>
            )}

            {searchResults.map((place, idx) => {
              const added = isAdded(place);
              const selected = selectedPlace?.id === place.id;
              const color = CATEGORY_COLOR[place.category] || "var(--tm-line-strong)";
              const pickerKey = `list:${place.id}`;
              return (
                <div
                  key={place.id}
                  className={`tm-list__item ws-search__row${selected ? " is-on" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${idx + 1}. ${place.name} 지도에서 보기`}
                  onClick={() => handleListClick(place)}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleListClick(place); }
                  }}
                >
                  <span className="ws-search__no">{idx + 1}</span>
                  <div className="ws-search__main">
                    <div className="tm-row tm-row--wrap tm-gap-2 ws-search__titlerow">
                      <b className="tm-list__title">{place.name}</b>
                      <span className="ws-menuwrap">
                        <button
                          type="button"
                          className="tm-tag tm-cat ws-search__cat"
                          style={{ ["--tm-cat" as string]: color }}
                          aria-haspopup="menu"
                          aria-expanded={categoryPickerFor === pickerKey}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCategoryPickerFor((prev) => (prev === pickerKey ? null : pickerKey));
                          }}
                        >
                          {place.category} ▾
                        </button>
                        {categoryPickerFor === pickerKey && (
                          <>
                            <div
                              className="tm-backdrop"
                              onClick={(e) => { e.stopPropagation(); setCategoryPickerFor(null); }}
                            />
                            <div className="tm-dropdown__menu ws-menu" role="menu" onClick={(e) => e.stopPropagation()}>
                              {CATEGORY_LIST.map((cat) => (
                                <button
                                  key={cat}
                                  type="button"
                                  role="menuitem"
                                  className="tm-dropdown__item"
                                  onClick={() => updateResultCategory(place.id, cat)}
                                >
                                  {cat}{cat === place.category ? " ✓" : ""}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="tm-list__sub">{place.address || "주소 없음"}</div>
                    
                  </div>
                  {/* 빠른 추가 — 지도 확인 없이 바로 추가하고 싶을 때 */}
                  <button
                    type="button"
                    className="tm-btn tm-btn--sm"
                    onClick={(e) => { e.stopPropagation(); void handleAdd(place); }}
                    disabled={added || addingId === place.id}
                    title={added ? "이미 추가했어요" : "바로 추가"}
                  >
                    {added ? "추가됨" : addingId === place.id ? "추가 중…" : "추가"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* 오른쪽: 지도 */}
          <div className="tm-map ws-search__map">
            <div ref={mapRef} className="tm-map__canvas" />
            {!mapLoaded && (
              <div className="ws-all__mapmsg">
                {mapKey ? "지도 불러오는 중…" : "지도 키(VITE_NAVER_MAP_CLIENT_ID)가 설정되지 않았어요"}
              </div>
            )}
            {mapLoaded && !hasClickedMap && (
              <div className="tm-tag tm-tag--dark ws-all__mapcount">지도를 누르면 주변 장소를 검색해요</div>
            )}
          </div>
        </div>
        {onBackToSaved && (
          <div className="tm-modal__foot">
            <button type="button" className="tm-btn tm-btn--link ws-ulink tm-mr-auto" onClick={onBackToSaved}>
              ← 저장한 장소로
            </button>
          </div>
        )}
      </div>

      {/* 추가 알림 */}
      {addedName && (
        <div className="tm-toast" role="status">
          {addedName}을(를) 추가했어요
        </div>
      )}
    </div>
  );
};

export default AddPlaceModal;