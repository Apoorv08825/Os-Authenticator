import { apiRequest } from "./api";

export const mfaService = {
  setup: () => apiRequest("/mfa/setup", { method: "POST" }),
  enable: (token) =>
    apiRequest("/mfa/enable", {
      method: "POST",
      body: { token }
    }),
  disable: (token) =>
    apiRequest("/mfa/disable", {
      method: "POST",
      body: { token }
    })
};
