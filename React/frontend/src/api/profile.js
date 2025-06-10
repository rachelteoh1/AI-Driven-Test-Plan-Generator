import api from "./api";

// Get current user profile
export const getUserProfile = () => api.get("/users/profile");

// Update profile
export const updateUserProfile = (data) => api.put("/users/profile", data);
