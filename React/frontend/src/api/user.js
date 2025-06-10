import api from "./api";


export const fetchCurrentUser = () => api.get('/users/currentUser');

// get email
export const requestResetPassword = (data) => api.post('/users/reset-password', data)
// Confirm password reset via token
export const confirmResetPassword = (data) => api.post('/users/reset-password/confirm', data);
