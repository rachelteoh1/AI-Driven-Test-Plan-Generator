import api from "./api";

export const getUserDashboard = () => api.get("/dashboard");
