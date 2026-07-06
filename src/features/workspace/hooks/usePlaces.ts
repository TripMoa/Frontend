// src/features/workspace/hooks/usePlaces.ts
import { useEffect, useState, useCallback } from "react";
import { getPlaces, createPlace, updatePlace, deletePlace } from "../../../api/place.api";

export interface Place {
  id: string;
  name: string;
  category: string;
  address: string;
  description?: string;
  imageUrl?: string;
  rating?: number;
  lat?: number;
  lng?: number;
}

export const usePlaces = (tripId: number | null) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaces = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await getPlaces(tripId);
      setPlaces(data.map((p: any) => ({
        id: String(p.id),
        name: p.name,
        category: p.category,
        address: p.address ?? "",
        description: p.description ?? "",
        lat: p.lat,
        lng: p.lng,
      })));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => { fetchPlaces(); }, [fetchPlaces]);

  const addPlace = useCallback(async (place: Omit<Place, "id">) => {
    if (!tripId) return;
    try {
      const { data } = await createPlace({ tripId, ...place });
      setPlaces((prev) => [...prev, {
        id: String(data.id),
        name: data.name,
        category: data.category,
        address: data.address ?? "",
        description: data.description ?? "",
        lat: data.lat,
        lng: data.lng,
      }]);
    } catch (e: any) {
      setError(e.message);
      throw e; // 호출자(AddPlaceModal 등)가 성공/실패를 구분해서 피드백을 줄 수 있게 재전파
    }
  }, [tripId]);

  const updatePlaceItem = useCallback(async (placeId: string, patch: { category?: string }) => {
    try {
      const { data } = await updatePlace(placeId, patch);
      setPlaces((prev) => prev.map((p) =>
        p.id === placeId ? { ...p, category: data.category } : p
      ));
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const deletePlaceItem = useCallback(async (placeId: string) => {
    try {
      await deletePlace(placeId);
      setPlaces((prev) => prev.filter((p) => p.id !== placeId));
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  return {
    places, loading, error,
    addPlace,
    updatePlace: updatePlaceItem,
    deletePlace: deletePlaceItem,
    refetch: fetchPlaces,
  };
};