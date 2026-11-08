import axios from "axios";

// Read base API url from environment (REACT_APP_API_URL) or default to local backend
export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export default api;

