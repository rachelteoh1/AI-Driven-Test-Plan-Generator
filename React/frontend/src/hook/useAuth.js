import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authService from "../services/authServices";
import * as userService from "../services/userServices";

// Register
export const useSignUp = () => {
  return useMutation({
    mutationFn: authService.registerUser,
  });
};

// Login
export const useSignIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.loginUserforToken,
    onSuccess: () => {
      queryClient.invalidateQueries(["currentUser"] ); // refetch user after login
      
    },
  });
};
const token = localStorage.getItem('access_token');
// Get current user
export const useUser = () => {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: userService.getCurrentUser,
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!token
  });
};

// Logout
export const useLogout = () => {
  const queryClient = useQueryClient();

  const logout = () => {
    localStorage.removeItem("access_token");
    queryClient.removeQueries(); // clear all cached data
  };

  return logout;
};
//Clears the JWT token from localStorage
//Invalidates all cached queries in React Query to prevent unauthorized access to stale data
