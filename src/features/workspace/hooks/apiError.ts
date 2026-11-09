// src/features/workspace/hooks/apiError.ts
//
// 서버가 준 안내 문구(예: "종료 시간을 넘기게 돼서 바꿀 수 없어요")가 있으면 그것을, 없으면 기본 문구를 쓴다.
// useTimeline/usePlaces 등 이 폴더의 훅들이 공통으로 쓴다.

export function apiMessage(e: unknown, fallback: string): string {
  const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return msg || fallback;
}
