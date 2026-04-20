import { apiRequest } from "./api";

export const adminService = {
  getSummary: () => apiRequest("/admin/summary")
};
