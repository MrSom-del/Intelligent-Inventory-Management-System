import api from "./api";

const API = "/products";

export const ProductService = {
  // list a page; params: { page, size, sort, q }
  listPage: ({ page = 0, size = 10, sort = "id,asc", q = "" } = {}) => {
    const params = { page, size, sort };
    if (q && q.trim() !== "") params.q = q.trim();
    return api.get(API, { params });
  },
  create: (product) => api.post(API, product).then(res => res.data),
  remove: (id) => api.delete(`${API}/${id}`),
  update: (id, product) => api.put(`${API}/${id}`, product).then(res => res.data),
};
