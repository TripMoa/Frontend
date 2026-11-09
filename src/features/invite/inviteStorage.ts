// src/features/invite/inviteStorage.ts
//
// 초대 링크로 들어왔지만 아직 로그인하지 않은 사용자의 초대코드를 로그인 이후까지 들고 간다.
// 소셜 로그인은 페이지 전체가 이동하므로 라우터 state는 사라지고, 같은 탭에서는 sessionStorage가 남는다.

const KEY = "tripmoa_pending_invite";
const MAX_AGE_MS = 30 * 60 * 1000;

// 초대코드 형식. 서버가 UUID 앞 12자(영문 대문자/숫자 + 하이픈, 예: D0983FA6-B4E)로 만든다.
// 경로로 이동하기 전에 한 번 걸러서 엉뚱한 주소로 보내지 않게 한다.
const CODE_PATTERN = /^[A-Za-z0-9-]{1,20}$/;

export const isValidInviteCode = (code: string | undefined | null): code is string =>
  !!code && CODE_PATTERN.test(code);

export const savePendingInvite = (code: string) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ code, at: Date.now() }));
  } catch {
    // 저장소를 못 쓰는 환경이면 로그인 후 링크를 다시 열어야 한다
  }
};

export const readPendingInvite = (): string | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { code?: string; at?: number };
    if (!isValidInviteCode(parsed.code)) return null;
    if (typeof parsed.at !== "number" || Date.now() - parsed.at > MAX_AGE_MS) return null;
    return parsed.code;
  } catch {
    return null;
  }
};

export const clearPendingInvite = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // 무시
  }
};
