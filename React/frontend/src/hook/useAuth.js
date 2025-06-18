import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authService from "../services/authServices";
import * as userService from "../services/userServices";
import * as chatService from "../services/chatServices";

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
    onSuccess: async () => {
      // Wait for token to exist
      await queryClient.invalidateQueries(["currentUser"]);
      await queryClient.invalidateQueries(["chats"]);
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

  // Accept user and pref_autosave as arguments
  const logout = async (user, pref_autosave) => {
    if (user && pref_autosave === false) {
      const loginSessionId = localStorage.getItem("login_session_id");
      try {
        await chatService.deleteChatsForLoginSession(user.id, loginSessionId);
      } catch (e) {
        console.error("Failed to delete chats/logs for this session", e);
      }
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("login_session_id");
    queryClient.invalidateQueries(["chats"]); // clear all cached data
    return true;
  };

  return logout;
};
//Clears the JWT token from localStorage
//Invalidates all cached queries in React Query to prevent unauthorized access to stale data
