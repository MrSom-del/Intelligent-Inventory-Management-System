import api from "./api";

const API = "/forecast";

export const ForecastService = {
  runForecast: (productId) => api.post(`${API}/${productId}/run`),
  getForecast: (productId) => api.get(`${API}/${productId}`),
  getAlerts: () => api.get(`${API}/alerts`),
  aggregateSales: () => api.post(`${API}/aggregate`),
};
