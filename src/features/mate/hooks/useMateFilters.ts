// hooks/useMateFilters.ts
import { useState, useMemo } from "react";
import type { Post } from "./mate.types";
import {
  GENDER_PREFERENCE_MAP,
  AGE_GROUP_MAP,
} from "./mate.constants";

export function useMateFilters(posts: Post[]) {
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [genderFilter, setGenderFilter] = useState("전체");
  const [ageFilter, setAgeFilter] = useState("전체");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("default");

  // 좋아요, 삭제 등의 로컬 상태
  const [likedPostIds, setLikedPostIds] = useState<number[]>(() => {
    const stored = localStorage.getItem("mate_likedPosts");
    return stored ? JSON.parse(stored) : [];
  });

  const [removedPosts, setRemovedPosts] = useState<number[]>(() => {
    const stored = localStorage.getItem("mate_removedPosts");
    return stored ? JSON.parse(stored) : [];
  });

  // 필터링 로직
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // 장소 필터
    if (locationFilter) {
      result = result.filter((p) =>
        p.destination.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // 날짜 필터
    if (dateFilter) {
      const filterDate = dateFilter.toISOString().split("T")[0];
      result = result.filter((p) => {
        return p.startDate <= filterDate && p.endDate >= filterDate;
      });
    }

    // 성별 필터
    if (genderFilter !== "전체") {
      const mappedGender = GENDER_PREFERENCE_MAP[genderFilter];
      result = result.filter((p) => {
        return !p.genderPreference || p.genderPreference === mappedGender;
      });
    }

    // 나이 필터
    if (ageFilter !== "전체") {
      const mappedAge = AGE_GROUP_MAP[ageFilter];
      result = result.filter((p) => {
        return !p.ageGroup || p.ageGroup === mappedAge;
      });
    }

    // 태그 필터
    if (selectedTags.length > 0) {
      result = result.filter((p) => {
        const postStyles = p.author?.travelStyles || [];
        return selectedTags.some((tag) => postStyles.includes(tag));
      });
    }

    // 정렬
    switch (sortBy) {
      case "budget-high":
        result.sort((a, b) => b.budget - a.budget);
        break;
      case "budget-low":
        result.sort((a, b) => a.budget - b.budget);
        break;
      case "views":
        result.sort((a, b) => b.viewsCount - a.viewsCount);
        break;
      case "likes":
        result.sort((a, b) => b.likesCount - a.likesCount);
        break;
      case "liked-only":
        result = result.filter((p) => p.isLiked);
        break;
      case "applied-only":
        // TODO: 신청한 항목 필터링 (myApplications 필요)
        break;
      case "removed-only":
        result = result.filter((p) => removedPosts.includes(p.id));
        break;
      default:
        // 기본 순서 유지
        break;
    }

    return result;
  }, [
    posts,
    locationFilter,
    dateFilter,
    genderFilter,
    ageFilter,
    selectedTags,
    sortBy,
    likedPostIds,
    removedPosts,
  ]);

  // 태그 토글
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // 모든 필터 초기화
  const handleResetAll = () => {
    setLocationFilter("");
    setDateFilter(null);
    setGenderFilter("전체");
    setAgeFilter("전체");
    setSelectedTags([]);
    setSortBy("default");
  };

  // 활성 필터가 있는지 확인
  const hasActiveFilters =
    locationFilter !== "" ||
    dateFilter !== null ||
    genderFilter !== "전체" ||
    ageFilter !== "전체" ||
    selectedTags.length > 0 ||
    sortBy !== "default";

  // 모드 체크
  const isLikedOnlyMode = sortBy === "liked-only";
  const isRemovedOnlyMode = sortBy === "removed-only";
  const isAppliedOnlyMode = sortBy === "applied-only";

  // 삭제(Pass) 처리
  const handleRemove = (postId: number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setRemovedPosts((prev) => {
      const newRemovedPosts = [...prev, postId];
      localStorage.setItem("mate_removedPosts", JSON.stringify(newRemovedPosts));
      return newRemovedPosts;
    });
  };

  // 복원 처리
  const handleRestore = (postId: number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setRemovedPosts((prev) => {
      const newRemovedPosts = prev.filter((id) => id !== postId);
      localStorage.setItem("mate_removedPosts", JSON.stringify(newRemovedPosts));
      return newRemovedPosts;
    });
  };

  return {
    // 필터 상태
    locationFilter,
    setLocationFilter,
    dateFilter,
    setDateFilter,
    genderFilter,
    setGenderFilter,
    ageFilter,
    setAgeFilter,
    selectedTags,
    toggleTag,
    sortBy,
    setSortBy,

    // 필터링된 데이터
    filteredPosts,
    removedPosts,

    // 모드 체크
    isLikedOnlyMode,
    isRemovedOnlyMode,
    isAppliedOnlyMode,
    hasActiveFilters,

    // 액션
    handleResetAll,
    handleRemove,
    handleRestore,
  };
}