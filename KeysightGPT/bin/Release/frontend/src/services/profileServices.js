import * as api from "../api/profile";

export const fetchUserProfile = async () => {
  const response = await api.getUserProfile();
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.updateUserProfile(data);
  return response.data;
};
