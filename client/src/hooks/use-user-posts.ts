import { useQuery } from "@tanstack/react-query";
import type { ArticleResponse } from "@shared/schema";

export function useUserPosts(userId?: string) {
  return useQuery<ArticleResponse[]>({
    queryKey: ["/api/users", userId, "posts"],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/users/${userId}/posts`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user posts");
      return res.json();
    },
    enabled: !!userId,
  });
}
