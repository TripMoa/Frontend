// hooks/mate/mate.types.ts

export interface Author {
  id: number;
  nickname: string;
  email: string;
  profileImage: string | null;
  avatarEmoji: string | null;
  avatarColor: string | null;
  gender: string | null;
  age: number | null;
  travelStyles: string[] | null;
}

export interface Post {
  id: number;
  content: string;
  destination: string;
  startDate: string;
  endDate: string;
  currentParticipant: number;
  maxParticipant: number;
  budget: number;
  transport: string;
  genderPreference: string | null;
  ageGroup: string | null;
  likesCount: number;
  viewsCount: number;
  createdAt: string;
  author: Author;
  duration?: string;
  isLiked?: boolean;
  hasApplied?: boolean;
}

export interface MateCreateRequest {
  content: string;
  destination: string;
  startDate: string;
  endDate: string;
  currentParticipant: number;
  maxParticipant: number;
  budget: number;
  transport: string;
  genderPreference: string | null;
  ageGroup: string | null;
}

export interface Applicant {
  name: string;
  age: number;
  gender: string;
  email: string;
  avatar: string;
  travelStyles: string[];
  message: string;
  appliedDate: string;
  preferredActivities?: string[];
  budget?: string;
}

export interface MyApplication {
  id: string;
  postId: number;
  postDestination: string;
  startDate: string;
  endDate: string;
  postAuthor: Author;
  applicant: Applicant;
}

export interface ReceivedApplication {
  id: string;
  postId: number;
  postAuthorEmail: string;
  postDestination: string;
  startDate: string;
  endDate: string;
  applicant: Applicant;
}

export interface PostStats {
  [postId: number]: {
    views: number;
    likes: number;
  };
}

export interface SelectedApplicant {
  id: string;
  postId: number;
  postDestination: string;
  applicant: Applicant;
}

export interface ApplicationRequest {
  content: string;
}

export interface ApplicationResponse {
  applicant: User;
  matePost: Post;
  status: ApplyStatus;
  content: string;
}

export interface User {
  id: number;
  nickname: string;
  email: string;
  profileImage: string | null;
  avatarEmoji: string | null;
  avatarColor: string | null;
  gender: string | null;
  age: number | null;
}

export type ApplyStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LikeResponse {
  liked: boolean;
  count: number;
}