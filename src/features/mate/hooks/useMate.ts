import { useState, useCallback } from "react";
import type { Post, MateCreateRequest, LikeResponse } from "./mate.types";
import {
  TRANSPORT_MAP,
  GENDER_PREFERENCE_MAP,
  AGE_GROUP_MAP
} from "./mate.constants";
import { useChat } from "../../chat/hooks/useChat";

const API_BASE_URL = "http://localhost:8080/api";

export function useMate() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [receivedApplications, setReceivedApplications] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem("accessToken");

  const { createRoom } = useChat();

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
    genderPreference: string;
    ageGroup: string;
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
        genderPreference: GENDER_PREFERENCE_MAP[formData.genderPreference] ?? "any",
        ageGroup: AGE_GROUP_MAP[formData.ageGroup] ?? "all",
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

  const toggleLike = useCallback(async (postId: number): Promise<LikeResponse | null> => {
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

      return likeResponse;
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      return false;
    }
  }, []);

  // 1. 받은 신청 목록 불러오기
  const fetchReceivedApplications = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/mate/applications/received`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("데이터 로딩 실패");
      const data = await response.json();

      setReceivedApplications(data);
    } catch (err) {
    }
  }, [token]);

  // 2. 승인/거절 처리 (상태 업데이트 로직 포함)
  const handleApplicationStatus = async (
    applyId: string,
    type: 'approve' | 'reject',
    postId?: number,
    onApproved?: (postId: number, applicantId?: number) => unknown,
    applicantId?: number,
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/mate/applications/${applyId}/${type}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const errorData = await response.json();
      
      if (response.ok) {
        alert(type === 'approve' ? "승인되었습니다." : "거절되었습니다.");
        if (type === 'approve' && postId && onApproved) {
          onApproved(postId, applicantId);  // createRoom 호출은 Mate.tsx에서
        }
        fetchReceivedApplications();
      } else {
        alert(errorData.message || "이미 처리가 완료된 신청서입니다.");
      }
    } catch (err) {
    }
  };

  // 3. 보낸 신청서 조회하기
  const fetchSentApplications = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/mate/applications/sent`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}`}
      });
      if(!response.ok) throw new Error("데이터 로딩 실패");
      const data = await response.json();
      setApplications(data);
    } catch (err) {
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
    applications,
    fetchReceivedApplications,
    receivedApplications,
    handleApplicationStatus,
    fetchSentApplications,
    getApplicantStatus: (id: string) => {
      const app = receivedApplications.find(a => String(a.id) === String(id));
      return app?.status || "pending"; 
    }
  };
}