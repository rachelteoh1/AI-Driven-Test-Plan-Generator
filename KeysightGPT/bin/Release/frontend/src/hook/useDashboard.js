// useDashboard.js
import { useQuery } from "@tanstack/react-query";
import * as dashboardService from "../services/dashboardServices";

export const useUserDashboard = () => {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardService.fetchDashboard,
  });
};
