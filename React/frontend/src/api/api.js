import axios from 'axios'

const api = axios.create({
    baseURL : 'http://localhost:8000',
})
// Add token to headers if exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token or any auth state you have
      localStorage.removeItem("access_token");
      // Redirect to sign-in page immediately
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export default api