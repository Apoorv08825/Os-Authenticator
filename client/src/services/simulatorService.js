import { apiRequest } from "./api";

export const simulatorService = {
  runAuthFlow: (payload) =>
    apiRequest("/simulator/auth-flow", {
      method: "POST",
      body: payload
    }),
  runAttack: (type, payload = {}) =>
    apiRequest("/simulator/attack", {
      method: "POST",
      body: {
        type,
        payload
      }
    })
};
