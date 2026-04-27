// src/features/myTrips/hooks/useMyTrips.ts

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createTrip,
  deleteTrip,
  getInvitedTrips,
  getMyTrips,
} from "../../../api/trip.api";
import { getMyInfo } from "../../../api/auth.api";
import type { UserResponse } from "../../../types/auth.types";
import type {
  MyTripSummaryResponse,
  TripCreateRequest,
  TripVisibility,
} from "../../../types/trip.types";

export type TripFilter = "all" | "public" | "private" | "invited";

export interface SelectedMember {
  userId: number;
  email: string;
  name: string | null;
}

export interface TripCreateFormState {
  title: string;
  tripStartDate: string;
  tripEndDate: string;
  selectedMembers: SelectedMember[];
}

export interface TripStatusInfo {
  leftLabel: string;
  rightLabel: "출발 전" | "여행 중" | "여행 종료";
  isEnd: boolean;
  sortVal: number;
}

const INITIAL_FORM: TripCreateFormState = {
  title: "",
  tripStartDate: "",
  tripEndDate: "",
  selectedMembers: [],
};

const FILTER_TO_VISIBILITY: Record<
  Exclude<TripFilter, "all" | "invited">,
  TripVisibility
> = {
  public: "PUBLIC",
  private: "PRIVATE",
};

export const useMyTrips = () => {
  const navigate = useNavigate();

  const [filter, setFilter] = useState<TripFilter>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trips, setTrips] = useState<MyTripSummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);

  const [formData, setFormData] = useState<TripCreateFormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM);
  }, []);

  const fetchTrips = useCallback(async (nextFilter: TripFilter) => {
    setIsLoading(true);
    setError(null);

    try {
      const response =
        nextFilter === "invited"
          ? await getInvitedTrips()
          : nextFilter === "all"
            ? await getMyTrips()
            : await getMyTrips(FILTER_TO_VISIBILITY[nextFilter]);

      setTrips(response.data);
    } catch (fetchError) {
      console.error("여행 목록 조회 실패:", fetchError);
      setError("여행 목록을 불러오지 못했습니다.");
      setTrips([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips(filter);
  }, [filter, fetchTrips]);

  useEffect(() => {
    const loadMyInfo = async () => {
      try {
        const response = await getMyInfo();
        setCurrentUser(response.data);
      } catch (infoError) {
        console.error("내 정보 조회 실패:", infoError);
      }
    };

    loadMyInfo();
  }, []);

  const removeTrip = useCallback(
    async (tripId: number) => {
      if (!window.confirm("이 작전을 폐기하시겠습니까?")) {
        return;
      }

      try {
        await deleteTrip(tripId);
        await fetchTrips(filter);
      } catch (deleteError) {
        console.error("여행 삭제 실패:", deleteError);
        window.alert("여행 삭제에 실패했습니다.");
      }
    },
    [fetchTrips, filter],
  );

  const getTripStatus = useCallback(
    (tripStartDate: string, tripEndDate: string): TripStatusInfo => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const start = new Date(tripStartDate);
      const end = new Date(tripEndDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      if (today > end) {
        return {
          leftLabel: "END",
          rightLabel: "여행 종료",
          isEnd: true,
          sortVal: Number.MAX_SAFE_INTEGER,
        };
      }

      if (today >= start && today <= end) {
        return {
          leftLabel: "ONGOING",
          rightLabel: "여행 중",
          isEnd: false,
          sortVal: 0,
        };
      }

      const diffTime = start.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        leftLabel: diffDays === 0 ? "D-DAY" : `D-${diffDays}`,
        rightLabel: "출발 전",
        isEnd: false,
        sortVal: diffDays,
      };
    },
    [],
  );

  const sortedTrips = useMemo(() => {
    return [...trips].sort((a, b) => {
      const infoA = getTripStatus(a.tripStartDate, a.tripEndDate);
      const infoB = getTripStatus(b.tripStartDate, b.tripEndDate);
      return infoA.sortVal - infoB.sortVal;
    });
  }, [getTripStatus, trips]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (isSubmitting) {
        return;
      }

      const payload: TripCreateRequest = {
        title: formData.title.trim(),
        tripStartDate: formData.tripStartDate,
        tripEndDate: formData.tripEndDate,
        memberUserIds: formData.selectedMembers.map((member) => member.userId),
      };

      setIsSubmitting(true);

      try {
        const response = await createTrip(payload);

        setIsModalOpen(false);
        resetForm();

        const createdTripId = response.data.tripId;
        navigate(`/workspace/${createdTripId}`);
      } catch (submitError) {
        console.error("여행 생성 실패:", submitError);
        window.alert("여행 생성에 실패했습니다.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchTrips, filter, formData, isSubmitting, resetForm],
  );

  return {
    filter,
    setFilter,
    isModalOpen,
    setIsModalOpen,
    trips: sortedTrips,
    isLoading,
    error,
    currentUser,
    formData,
    setFormData,
    resetForm,
    isSubmitting,
    removeTrip,
    getTripStatus,
    handleSubmit,
    refreshTrips: () => fetchTrips(filter),
  };
};
