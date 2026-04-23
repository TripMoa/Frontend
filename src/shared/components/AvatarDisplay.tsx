// shared/components/AvatarDisplay.tsx
import { getApplicantAvatar } from "../hooks/avatar";

type AvatarResult = ReturnType<typeof getApplicantAvatar>;

export function AvatarDisplay({ avatar }: {
  avatar: AvatarResult;
}) {
  if (avatar.type === "image") {
    return <img src={avatar.src} alt="" className="w-full h-full object-cover rounded-full" />;
  }
  return <span>{avatar.value}</span>;
}