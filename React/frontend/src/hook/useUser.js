// hook/useUser.js
import { useQuery, useMutation } from "@tanstack/react-query";
import * as userService from "../services/userServices";

export const useUser = () => {
  const token = localStorage.getItem("access_token");

  return useQuery({
    queryKey: ["currentUser"],
    queryFn: userService.getCurrentUser,
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!token,
    select: (data) => data, // ensure it returns the user object
  });
};

export const useRequestResetPassword = () => {
  return useMutation({
    mutationFn: userService.sendResetPassword,
  });
};

export const useConfirmResetPassword = () => {
  return useMutation({
    mutationFn: userService.confirmResetPw,
  });
};