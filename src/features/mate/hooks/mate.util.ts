// mate.util.ts

export function getApplicantAvatar(
  profileImage: string | null,
  avatarEmoji: string | null
): { type: "image"; src: string } | { type: "emoji"; value: string } {
  if (profileImage) return { type: "image", src: profileImage };
  if (avatarEmoji) return { type: "emoji", value: avatarEmoji };
  return { type: "emoji", value: "👤" };
}