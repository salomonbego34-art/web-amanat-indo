import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";
import { useAuth } from "@/hooks/use-auth";

export function useChatUsers() {
  const { isAuthenticated } = useAuth();

  return useQuery<User[]>({
    queryKey: ["/api/messages/users"],
    queryFn: async () => {
      const res = await fetch("/api/messages/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json();
    },
    enabled: isAuthenticated,
  });
}

export function useConversation(userId: string | null) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["/api/messages", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/messages/${userId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: isAuthenticated && !!userId,
  });
}

export function useSendMessage(userId?: string | null) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!isAuthenticated) throw new Error("Unauthorized");
      if (!userId) throw new Error("No recipient selected");
      const res = await fetch(`/api/messages/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: ["/api/messages", userId] });
    },
  });
}
