import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type ArticleInput } from "@shared/routes";
import { type ArticleResponse, type CommentResponse } from "@shared/schema";
import type { User } from "@shared/models/auth";
import { useAuth } from "@/hooks/use-auth";

export function useArticles(sortBy: 'recent' | 'popular' = 'recent') {
  return useQuery({
    queryKey: [api.articles.list.path, sortBy],
    queryFn: async () => {
      const res = await fetch(api.articles.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch articles");
      let articles = (await res.json()) as ArticleResponse[];
      
      // Apply simple algorithm
      if (sortBy === 'popular') {
        articles = articles.sort((a, b) => b.upvoteCount - a.upvoteCount);
      } else {
        articles = articles.sort((a, b) => new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime());
      }
      return articles;
    },
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ArticleInput) => {
      // Validate with schema first
      const validated = api.articles.create.input.parse(data);
      const res = await fetch(api.articles.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create article");
      }
      return (await res.json()) as ArticleResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.articles.list.path] });
    },
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: number; data: Partial<ArticleInput> }) => {
      const validated = api.articles.update.input.parse(input.data);
      const res = await fetch(buildUrl(api.articles.update.path, { id: input.id }), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        if (res.status === 404) throw new Error("Article not found");
        if (res.status === 400) {
          const err = await res.json();
          throw new Error(err.message || "Validation failed");
        }
        throw new Error("Failed to update article");
      }
      return (await res.json()) as ArticleResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.articles.list.path] });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.articles.remove.path, { id }), {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete article");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.articles.list.path] });
    },
  });
}

export function useArticle(id: number | null) {
  return useQuery({
    queryKey: [api.articles.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(buildUrl(api.articles.get.path, { id }), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch article");
      return (await res.json()) as ArticleResponse;
    },
    enabled: !!id,
  });
}

export function useToggleUpvote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (articleId: number) => {
      const res = await fetch(buildUrl(api.articles.upvote.path, { id: articleId }), {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message || "Failed to toggle upvote");
      }
      return res.json();
    },
    onSuccess: (_, articleId) => {
      queryClient.invalidateQueries({ queryKey: [api.articles.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.articles.get.path, articleId] });
    },
  });
}

export function useComments(articleId: number) {
  return useQuery({
    queryKey: [api.articles.comments.list.path, articleId],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.articles.comments.list.path, { id: articleId }), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch comments");
      return (await res.json()) as CommentResponse[];
    },
  });
}

export function useUserComments(userId?: string) {
  return useQuery<CommentResponse[]>({
    queryKey: ["/api/users", userId, "comments"],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/users/${userId}/comments`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user comments");
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { articleId: number; content: string; parentId?: number | null }) => {
      const res = await fetch(buildUrl(api.articles.comments.create.path, { id: input.articleId }), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input.content, parentId: input.parentId }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message || "Failed to create comment");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.articles.comments.list.path, variables.articleId] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { articleId: number; commentId: number }) => {
      const res = await fetch(buildUrl(api.articles.comments.remove.path, { id: input.articleId, commentId: input.commentId }), {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete comment");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.articles.comments.list.path, variables.articleId] });
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { articleId: number; commentId: number; content: string }) => {
      const res = await fetch(buildUrl(api.articles.comments.update.path, { id: input.articleId, commentId: input.commentId }), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input.content }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message || "Failed to update comment");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.articles.comments.list.path, variables.articleId] });
    },
  });
}

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });
}

export const useArticleComments = useComments;
export const useUpvoteArticle = useToggleUpvote;

export function useSearchArticles(query: string) {
  return useQuery({
    queryKey: ["searchArticles", query],
    queryFn: async () => {
      const res = await fetch(api.articles.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch articles");
      const allArticles = (await res.json()) as ArticleResponse[];
      const text = query.trim().toLowerCase();
      if (!text) return [];
      return allArticles.filter((article) =>
        [article.title, article.content, article.location, article.author.username]
          .join(" ")
          .toLowerCase()
          .includes(text),
      );
    },
    enabled: query.trim().length > 0,
  });
}

export function useSearchUsers(query: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["searchUsers", query],
    queryFn: async () => {
      const res = await fetch("/api/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      const allUsers = (await res.json()) as User[];
      const text = query.trim().toLowerCase();
      if (!text) return [];
      return allUsers.filter((user) =>
        [`${user.firstName ?? ""} ${user.lastName ?? ""}`, user.username, user.email || "", user.bio || ""]
          .join(" ")
          .toLowerCase()
          .includes(text),
      );
    },
    enabled: isAuthenticated && query.trim().length > 0,
  });
}
