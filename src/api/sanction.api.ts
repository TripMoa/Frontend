// src/api/sanction.api.ts

import { api } from "./api";
import type { MySanctionStatusResponse } from "../types";

export const getMySanctionStatus = () => {
  return api.get<MySanctionStatusResponse>("/users/me/sanction");
};

export const markWarningPopupRead = () => {
  return api.post("/users/me/sanction/warning-popup/read");
};
