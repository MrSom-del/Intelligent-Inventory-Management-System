import api from "./api";

const API = "/dashboard";

export const DashboardService = {
  getStats: () => api.get(`${API}/stats`).then(res => res.data),
};
