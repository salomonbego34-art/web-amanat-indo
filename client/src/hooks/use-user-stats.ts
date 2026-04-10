import { useQuery } from "@tanstack/react-query";

export function useUserStats(userId?: string) {
  return useQuery({
    queryKey: ["/api/users", userId, "stats"],
    queryFn: async () => {
      if (!userId) return null;
      const res = await fetch(`/api/users/${userId}/stats`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user stats");
      return res.json();
    },
    enabled: !!userId,
  });
}
