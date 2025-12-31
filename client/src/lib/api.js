import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    console.log("📤 Request:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (res) => {
    // Return the full response data (which includes success, message, etc.)
    return res.data;
  },
  (err) => {
    const msg = err.response?.data?.message || err.response?.data?.error || "Server error";
    console.error("❌ API Error:", msg);
    
    // If unauthorized, redirect to login
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    
    return Promise.reject(new Error(msg));
  }
);

export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
};

export const adminAPI = {
  // STUDENTS
  createStudent: (data) => api.post("/admin/students", data),
  updateStudent: (id, data) => api.put(`/admin/students/${id}`, data),
  deleteStudent: (id) => api.delete(`/admin/students/${id}`),
  listStudents: () => api.get("/admin/students"),
  getStudent: (id) => api.get(`/admin/students/${id}`),

  // DRIVERS
  createDriver: (data) => api.post("/admin/drivers", data),
  updateDriver: (id, data) => api.put(`/admin/drivers/${id}`, data),
  deleteDriver: (id) => api.delete(`/admin/drivers/${id}`),
  listDrivers: () => api.get("/admin/drivers"),
  getDriver: (id) => api.get(`/admin/drivers/${id}`),

  // ROUTES
  createRoute: (data) => api.post("/admin/routes", data),
  updateRoute: (id, data) => api.put(`/admin/routes/${id}`, data),
  deleteRoute: (id) => api.delete(`/admin/routes/${id}`),
  listRoutes: () => api.get("/admin/routes"),
  getRoute: (id) => api.get(`/admin/routes/${id}`),

  // STOPS (nested under routes)
  addStop: (routeId, data) => api.post(`/admin/routes/${routeId}/stops`, data),
  updateStop: (stopId, data) => api.put(`/admin/routes/stops/${stopId}`, data),
  deleteStop: (stopId) => api.delete(`/admin/routes/stops/${stopId}`),
  getStops: (routeId) => api.get(`/admin/routes/${routeId}/stops`),
};

export const driverAPI = {
  updateLocation: (coords) => api.post("/driver/update-location", coords),
  toggleSharing: (state) => api.post("/driver/sharing", { state }),
};

export const studentAPI = {
  // will add based on backend endpoints
};

export default api;
