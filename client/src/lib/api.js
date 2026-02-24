import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// Add an interceptor to handle session expiry automatically
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // DON'T auto redirect on 401
    // let frontend handle it with AuthContext
    return Promise.reject(error);
  }
);


export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
  changePassword: (data) => api.put("/auth/change-password", data),
};

// ... existing imports and axios config ...

export const adminAPI = {
  // Students
  getStudents: () => api.get("/admin/students"),
  getStudent: (id) => api.get(`/admin/students/${id}`),
  createStudent: (data) => api.post("/admin/students", data),
  updateStudent: (id, data) => api.put(`/admin/students/${id}`, data),
  deleteStudent: (id) => api.delete(`/admin/students/${id}`),

  // Drivers
  getDrivers: () => api.get("/admin/drivers"),
  getDriver: (id) => api.get(`/admin/drivers/${id}`),
  createDriver: (data) => api.post("/admin/drivers", data),
  updateDriver: (id, data) => api.put(`/admin/drivers/${id}`, data),
  deleteDriver: (id) => api.delete(`/admin/drivers/${id}`),

  // Routes
  getRoutes: () => api.get("/admin/routes"),
  getRoute: (id) => api.get(`/admin/routes/${id}`),
  createRoute: (data) => api.post("/admin/routes", data),
  updateRoute: (id, data) => api.put(`/admin/routes/${id}`, data),
  deleteRoute: (id) => api.delete(`/admin/routes/${id}`),

  // Stops (Nested)
  addStop: (routeId, data) => api.post(`/admin/routes/${routeId}/stops`, data),
  updateStop: (id, data) => api.put(`/admin/routes/stops/${id}`, data),
  deleteStop: (id) => api.delete(`/admin/routes/stops/${id}`),
  getRouteStops: (routeId) => api.get(`/admin/routes/${routeId}/stops`),
};

export const driverAPI = {
  toggleSharing: (state) => api.post("/driver/sharing", { state }),
  getAssignedRoute: () => api.get("/driver/assigned-route"),
};

export const studentAPI = {
  getMyRoute: () => api.get("/student/my-route"),
};


export default api;