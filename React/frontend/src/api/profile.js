import api from "./api";

export const getUserProfile = () => api.get("/profile/");
export const updateUserProfile = (data) => api.put("/profile/", data);
