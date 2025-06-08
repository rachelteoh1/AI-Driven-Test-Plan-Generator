import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authService from "../services/authServices";

// Register
export const useRegister = () => {
  return useMutation(authService.registerUser);
};

// Login
export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation(authService.loginUser, {
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']); // refetch after login
    },
  });
};

// Get current user
export const useUser = () => {
  return useQuery(['currentUser'], authService.getCurrentUser, {
    retry: false,
    refetchOnWindowFocus: false,
  });
};