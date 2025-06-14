import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as profileService from "../services/profileServices";

// Fetch user profile
export const useUserProfile = (isLoggedIn = false) => {
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: profileService.fetchUserProfile,
    enabled: isLoggedIn, // only run if user is logged in
    retry: false,
    refetchOnWindowFocus: false,
  });
};

// Update user profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries(["userProfile"]);
    },
  });
};
