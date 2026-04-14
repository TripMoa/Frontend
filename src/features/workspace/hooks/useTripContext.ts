// src/features/workspace/hooks/useTripContext.ts

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getTripDetail } from "../../../api/trip.api";
import type { TripDetailResponse } from "../../../types/trip.types";

export const useTripContext = () => {
  const params = useParams<{ tripId: string }>();
  const tripId = Number(params.tripId);

  const [tripDetail, setTripDetail] = useState<TripDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUserId = Number(localStorage.getItem("userId"));

  useEffect(() => {
    if (!Number.isFinite(tripId) || tripId <= 0) {
      setTripDetail(null);
      setError("유효한 여행 ID를 찾을 수 없습니다.");
      setLoading(false);
      return;
    }

    const fetchTripDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getTripDetail(tripId);
        setTripDetail(response.data);
      } catch (e) {
        console.error("여행 상세 조회 실패:", e);
        setTripDetail(null);
        setError("여행 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetail();
  }, [tripId]);

  const ownerUserId = tripDetail?.ownerUserId ?? null;
  const isOwner =
    ownerUserId !== null &&
    !Number.isNaN(currentUserId) &&
    currentUserId === ownerUserId;

  return {
    tripId,
    tripDetail,
    ownerUserId,
    currentUserId,
    isOwner,
    loading,
    error,
  };
};
