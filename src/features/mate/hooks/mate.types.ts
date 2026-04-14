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
  profileImage: string | null;
  avatarEmoji: string | null;
  travelStyles: string[];
  message: string;
  appliedDate: string;
  preferredActivities?: string[];
  budget?: string;
}

export interface MyApplication {
  id: string;
  matePostId: number;
  applicantId: number;
  applicantName: string;
  applicantEmail: string;
  postAuthorName: string;
  postAuthorEmail: string;
  postAuthorAvatar: string | null;
  postDestination: string;
  startDate: string;
  endDate: string;
  content: string;
  status: "approved" | "rejected" | "pending";
  gender: string;
  age: number;
  avatar: string | null;
}

// export interface ReceivedApplication {
//   id: string;
//   postId: number;
//   postAuthorEmail: string;
//   postDestination: string;
//   startDate: string;
//   endDate: string;
//   applicant: Applicant;
// }

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
  applicantId: number;
}

export interface ApplicationRequest {
  content: string;
}

export interface ApplicationResponse {
  id: number;
  applicantId: number;
  applicantName: string;
  applicantEmail: string;
  postAuthorName: string;
  postAuthorEmail: string;
  postAuthorAvatar: string | null;
  startDate: string;
  endDate: string;
  status: ApplyStatus;
  content: string;
  matePostId: number;
  postDestination: string;
  profileImage: string | null;
  avatar: string | null;
  travelStyles: string[];
  age: number;
  gender: string;
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

export type ApplyStatus = 'pending' | 'approved' | 'rejected';

export interface LikeResponse {
  liked: boolean;
  count: number;
}