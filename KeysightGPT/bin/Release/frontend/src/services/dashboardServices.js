import * as api from "../api/dashboard";

export const fetchDashboard = async () => {
  const response = await api.getUserDashboard();
  return response.data;
};