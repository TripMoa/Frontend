import { useState, useCallback } from "react";
import type { Post, MateCreateRequest, LikeResponse } from "./mate.types";
import {
  TRANSPORT_MAP,
  GENDER_PREFERENCE_MAP,
  AGE_GROUP_MAP
} from "./mate.constants";

const API_BASE_URL = "http://localhost:8080/api";

export function useMate() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem("accessToken");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/mate/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error("게시글을 불러오는데 실패했습니다.");
      }

      const data: Post[] = await response.json();
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  const createPost = useCallback(async (formData: {
    destination: string;
    startDate: Date;
    endDate: Date;
    currentParticipant: number;
    maxParticipant: number;
    budget: number;
    transport: string;
    genderPreference?: string;
    ageGroup?: string;
    content: string;
  }): Promise<Post | null> => {
    setLoading(true);
    setError(null);

    try {
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const requestData: MateCreateRequest = {
        destination: formData.destination,
        startDate: formatDate(formData.startDate),
        endDate: formatDate(formData.endDate),
        currentParticipant: formData.currentParticipant,
        maxParticipant: formData.maxParticipant,
        budget: formData.budget,
        transport: TRANSPORT_MAP[formData.transport] || formData.transport,
        genderPreference: formData.genderPreference 
          ? GENDER_PREFERENCE_MAP[formData.genderPreference] || null
          : null,
        ageGroup: formData.ageGroup 
          ? AGE_GROUP_MAP[formData.ageGroup] || null
          : null,
        content: formData.content,
      };

      const response = await fetch(`${API_BASE_URL}/mate/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "게시글 작성에 실패했습니다.");
      }

      const newPost: Post = await response.json();
      setPosts((prev) => [newPost, ...prev]);
      return newPost;
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPostDetail = useCallback(async (postId: number): Promise<Post | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/mate/${postId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error("게시글을 불러오는데 실패했습니다.");
      }

      const post: Post = await response.json();
      return post;
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePost = useCallback(async (postId: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/mate/${postId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error("게시글 삭제에 실패했습니다.");
      }

      setPosts((prev) => prev.filter((post) => post.id !== postId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleLike = useCallback(async (postId: number): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/mate/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error("좋아요 처리에 실패했습니다.");
      }

      const likeResponse: LikeResponse = await response.json();
      
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { 
                ...post, 
                likesCount: likeResponse.count,
                isLiked: likeResponse.liked 
              }
            : post
        )
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      return false;
    }
  }, []);

  return {
    posts,
    loading,
    error,
    fetchPosts,
    createPost,
    fetchPostDetail,
    deletePost,
    toggleLike,
  };
}