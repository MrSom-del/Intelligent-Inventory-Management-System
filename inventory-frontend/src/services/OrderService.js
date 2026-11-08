import api from "./api";

const API = "/orders";

const OrderService = {
  listPage: ({ page = 0, size = 10, sort = "id,desc" } = {}) =>
    api.get(API, { params: { page, size, sort } }),

  get: (id) => api.get(`${API}/${id}`).then(res => res.data),

  create: (payload) => api.post(API, payload).then(res => res.data),

  remove: (id) => api.delete(`${API}/${id}`),

  getById: (id) => api.get(`${API}/${id}`).then(res => res.data),

  updateStatus: (id, status) => api.put(`${API}/${id}/status?status=${status}`)
};

export default OrderService;
