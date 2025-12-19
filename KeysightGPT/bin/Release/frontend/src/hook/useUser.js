// hook/useUser.js
import { useQuery, useMutation } from "@tanstack/react-query";
import * as userService from "../services/userServices";
import { useNavigate } from "react-router-dom";

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

export const useDeleteAccount = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: userService.deleteMyAccount,
    onSuccess: () => {
      localStorage.removeItem("access_token");
      navigate("/signin");
    },
  });
};