// src/shared/config/env.ts

const raw = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL =
  raw && raw !== "undefined" ? raw.replace(/\/+$/, "") : "";