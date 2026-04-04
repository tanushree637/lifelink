import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(
    `📤 API Request: ${config.method.toUpperCase()} ${config.url}`,
    config.data,
  );
  return config;
});

// Handle responses
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response:`, response.data);
    return response;
  },
  (error) => {
    console.error(`❌ API Error:`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  },
);

// Auth APIs
export const authAPI = {
  register: (data) => apiClient.post("/auth/register", data),
  login: (email, password) =>
    apiClient.post("/auth/login", { email, password }),
};

// Donor APIs
export const donorAPI = {
  getProfile: () => apiClient.get("/donors/profile"),
  updateAvailability: (available) =>
    apiClient.put("/donors/availability", { available }),
  getNearbyRequests: () => apiClient.get("/donors/requests/nearby"),
  getAllPendingRequests: () => apiClient.get("/donors/requests/all-pending"),
  getPendingRequests: (status) =>
    apiClient.get("/donors/requests/pending", { params: { status } }),
  getNearbyHospitals: () => apiClient.get("/donors/hospitals/nearby"),
  acceptRequest: (requestId) =>
    apiClient.post(`/donors/accept-request/${requestId}`),
  getHistory: () => apiClient.get("/donors/history"),
  getBadges: () => apiClient.get("/donors/badges"),
  getCertificates: () => apiClient.get("/donors/certificates"),
  downloadCertificate: (donationId) =>
    `${API_BASE_URL}/donors/certificate/${donationId}/download`,
};

// Recipient APIs
export const recipientAPI = {
  createEmergencyRequest: (data) =>
    apiClient.post("/recipients/emergency-request", data),
  getRequest: (requestId) => apiClient.get(`/recipients/request/${requestId}`),
  getMyRequests: () => apiClient.get("/recipients/my-requests"),
  cancelRequest: (requestId) =>
    apiClient.put(`/recipients/request/${requestId}/cancel`),
  searchDonors: (bloodGroup, location) =>
    apiClient.get("/recipients/search-donors", {
      params: { bloodGroup, location },
    }),
  getAvailableDonorsCount: () =>
    apiClient.get("/recipients/available-donors-count"),
};

// Hospital APIs
export const hospitalAPI = {
  getProfile: () => apiClient.get("/hospitals/profile"),
  getHospitals: () => apiClient.get("/hospitals/list"),
  getHospitalsWithCoordinates: () =>
    apiClient.get("/hospitals/with-coordinates"),
  getDashboardStats: () => apiClient.get("/hospitals/dashboard-stats"),
  getPendingDonations: () => apiClient.get("/hospitals/pending-donations"),
  verifyDonation: (donationId, otp, donationDetails) =>
    apiClient.post(`/hospitals/verify-donation/${donationId}`, {
      otp,
      donationDetails,
    }),
  getDonationHistory: () => apiClient.get("/hospitals/donation-history"),
  getPatientVerificationRequests: () =>
    apiClient.get("/hospitals/patient-verification-requests"),
  confirmAdmitted: (requestId) =>
    apiClient.post(
      `/hospitals/patient-verification/${requestId}/confirm-admitted`,
    ),
  rejectPatientRequest: (requestId) =>
    apiClient.post(`/hospitals/patient-verification/${requestId}/reject`),
  updateLocation: (address, latitude, longitude, displayName) =>
    apiClient.post("/hospitals/update-location", {
      address,
      latitude,
      longitude,
      displayName,
    }),
  regenerateCertificate: (donationId) =>
    apiClient.post(`/hospitals/regenerate-certificate/${donationId}`),
};

// Admin APIs
export const adminAPI = {
  getPendingUsers: () => apiClient.get("/admin/pending-users"),
  approveUser: (userId) => apiClient.post(`/admin/approve-user/${userId}`),
  rejectUser: (userId, reason) =>
    apiClient.post(`/admin/reject-user/${userId}`, { reason }),
  syncRejectedUsers: () => apiClient.post("/admin/sync-rejected-users"),
  getSuspiciousActivity: () => apiClient.get("/admin/suspicious-activity"),
  getStatistics: () => apiClient.get("/admin/statistics"),
  getAnalytics: (timeRange = "30") =>
    apiClient.get("/admin/analytics", { params: { timeRange } }),
  getAllUsers: (role = "all", status = "all") =>
    apiClient.get("/admin/all-users", { params: { role, status } }),
  blockUser: (userId, block = true) =>
    apiClient.put(`/admin/block-user/${userId}`, { block }),
  getBloodRequests: (status = "all", urgency = "all") =>
    apiClient.get("/admin/blood-requests", { params: { status, urgency } }),
  updateRequestStatus: (requestId, status) =>
    apiClient.put(`/admin/blood-request/${requestId}/status`, { status }),
  rejectRequest: (requestId, reason) =>
    apiClient.put(`/admin/blood-request/${requestId}/reject`, { reason }),
  getSystemAlerts: () => apiClient.get("/admin/system-alerts"),
};

export default apiClient;
