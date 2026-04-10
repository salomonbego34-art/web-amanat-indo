import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export function useNotifications() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    enabled: isAuthenticated,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) {
        throw new Error("Unauthorized");
      }

      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark notifications read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });
}

export const useReadAllNotifications = useMarkNotificationsRead;
