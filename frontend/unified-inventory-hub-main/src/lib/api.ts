import axios from "axios";

// ISSUE 4 — AXIOS INSTANCE
export const api = axios.create({
  baseURL: "/api",
  withCredentials: true
});

// Helper for legacy code that might still use positional get/post
export const get = (url: string) => api.get(url).then(res => res.data);
export const post = (url: string, data?: any) => api.post(url, data).then(res => res.data);
export const put = (url: string, data?: any) => api.put(url, data).then(res => res.data);
export const del = (url: string) => api.delete(url).then(res => res.data);

export default api;
