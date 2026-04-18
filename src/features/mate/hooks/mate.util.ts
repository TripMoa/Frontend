// mate.util.ts
import type { Post } from "./mate.types";

export function getApplicantAvatar(
  profileImage: string | null,
  avatarEmoji: string | null
): { type: "image"; src: string } | { type: "emoji"; value: string } {
  if (profileImage) return { type: "image", src: profileImage };
  if (avatarEmoji) return { type: "emoji", value: avatarEmoji };
  return { type: "emoji", value: "👤" };
}

export const getTodayKST = (): string => {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;  // UTC+9
  const kst = new Date(now.getTime() + kstOffset);
  return kst.toISOString().slice(0, 10);
};

export const isPostExpired = (post: Pick<Post, "endDate">): boolean => {
  return post.endDate < getTodayKST();
};

// UTC 변환
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}