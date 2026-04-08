// hooks/useCurrentUser.ts

export function useCurrentUser() {
    return {
        email: localStorage.getItem("userEmail") ?? "",
        id: Number(localStorage.getItem("userId") ?? 0)
    };
}