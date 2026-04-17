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