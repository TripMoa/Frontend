// mate.types.ts

export interface Author {
  name: string;
  age: number;
  gender: string;
  avatar: string;
  email: string;
  travelStyle: string[];
}

export interface Applicant extends Author {
  message: string;
  preferredActivities: string[];
  budget: string;
  appliedDate: string;
}

export interface Post {
  id: string;
  author: Author;
  from: string;
  to: string;
  destination: string;
  dates: { start: string; end: string };
  duration: string;
  participants: { current: number; max: number };
  tags: string[];
  gender: string;
  ageGroup: string;
  description: string;
  budget: string;
  budgetNumber: number;
  travelStyle: string[];
  views: number;
  likes: number;
}

export interface MyApplication {
  id: string;
  postId: string;
  postDestination: string;
  postDates: { start: string; end: string };
  postAuthor: Author;
  applicant: Applicant;
}

export interface ReceivedApplication {
  id: string;
  postId: string;
  postDestination: string;
  postDates: { start: string; end: string };
  applicant: Applicant;
}

export interface PostStats {
  [key: string]: { views: number; likes: number };
}

export interface SelectedApplicant {
  postId: string;
  postDestination: string;
  applicant: Applicant;
}
