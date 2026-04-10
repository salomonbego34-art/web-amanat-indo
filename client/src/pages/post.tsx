import { useState } from "react";
import { useRoute } from "wouter";
import { Layout } from "@/components/layout";
import { useArticle, useComments, useCreateComment, useToggleUpvote } from "@/hooks/use-articles";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowBigUp, MessagesSquare, ShieldCheck, Clock3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { CommentResponse } from "@shared/schema";
import { CommentThread } from "@/components/comments/comment-thread";
import { getRankBadgeClass } from "@/lib/amanat";
import { useToast } from "@/hooks/use-toast";
import { SmartBackButton } from "@/components/smart-back-button";
import { useSmartBack } from "@/hooks/use-smart-back";

export default function PostPage() {
  const [match, params] = useRoute("/post/:id");
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const articleId = match ? Number(params.id) : null;
  const { data: article, isLoading: articleLoading } = useArticle(articleId);
  const currentArticleId = article?.id ?? articleId ?? 0;
  const { data: comments = [], isLoading: commentsLoading } = useComments(currentArticleId);
  const { mutate: upvote } = useToggleUpvote();
  const { mutate: addComment } = useCreateComment();
  const [commentInput, setCommentInput] = useState("");
  const { toast } = useToast();
  const { goBack } = useSmartBack("/feed");

  if (authLoading || articleLoading) {
    return (
      <Layout>
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Memuat thread...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-red-500 font-bold">Thread tidak ditemukan atau Anda tidak memiliki akses.</p>
          <Button onClick={() => goBack("/feed")} variant="ghost" className="mt-4">Kembali</Button>
        </div>
      </Layout>
    );
  }

  const userStatus = user?.status || user?.accountStatus;
  const isPending = userStatus === "pending";
  const commentCount = countComments(comments);

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-8 min-h-screen w-full overflow-x-hidden space-y-6">
        <div className="flex items-center justify-between">
          <SmartBackButton fallback="/feed" label="Kembali" className="rounded-xl" />
        </div>

        {isPending && (
          <Alert className="border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300">
            <Clock3 className="h-4 w-4" />
            <AlertTitle>Mode Read-Only</AlertTitle>
            <AlertDescription>
              Akun Anda sedang menunggu persetujuan admin. Anda dapat melihat post tetapi tidak dapat berinteraksi.
            </AlertDescription>
          </Alert>
        )}

        <article className="amanat-panel overflow-hidden">
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-4">
              <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 text-primary">
                {article.location || "Diskusi Umum"}
              </Badge>
              <span className="inline-flex items-center gap-1 font-bold">
                <ShieldCheck className="h-3.5 w-3.5" />
                @{article.author.username}
              </span>
              <Badge className={`rank-badge ${getRankBadgeClass(article.author.rank)}`}>
                {article.author.rank}
              </Badge>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(article.createdAt || Date.now()), { addSuffix: true })}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black mb-4 leading-tight">
              {article.title}
            </h1>

            <div className="text-foreground/90 whitespace-pre-wrap leading-relaxed mb-6">
              {article.content || "Thread tanpa uraian tambahan."}
            </div>

            {article.attachmentDataUrl && article.attachmentMime?.startsWith("image/") ? (
              <img src={article.attachmentDataUrl} alt={article.title} loading="lazy" className="mb-6 max-h-[520px] w-full rounded-2xl object-cover shadow-lg" />
            ) : null}

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border/50">
              <Button 
                variant="outline" 
                className={`rounded-full gap-2 transition-all active:scale-95 ${article.hasUpvoted ? "border-orange-500 text-orange-500 bg-orange-500/5" : ""}`} 
                disabled={!isAuthenticated || isPending}
                onClick={() =>
                  upvote(article.id, {
                    onError: (error) =>
                      toast({
                        title: "Gagal memberi upvote",
                        description: error instanceof Error ? error.message : "Terjadi kesalahan.",
                        variant: "destructive",
                      }),
                  })
                }
              >
                <ArrowBigUp className={`h-5 w-5 ${article.hasUpvoted ? "fill-current" : ""}`} />
                <span className="font-bold">{article.upvoteCount}</span>
              </Button>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm font-bold text-muted-foreground">
                <MessagesSquare className="h-4 w-4" />
                {commentCount} Comments
              </div>
            </div>
          </div>
        </article>

        <section className="amanat-panel p-6">
          <div className="flex items-center gap-2 mb-6">
            <MessagesSquare className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-black uppercase tracking-tight">Discussion</h2>
          </div>

          <div className="space-y-4 mb-8">
            <Textarea
              rows={3}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder={isAuthenticated ? "What are your thoughts?" : "Login to join the discussion"}
              disabled={!isAuthenticated || isPending}
              className="rounded-2xl bg-muted/30 focus-visible:ring-primary border-border/50"
            />
            <div className="flex justify-end">
              <Button
                className="rounded-full px-8 font-bold active:scale-95 transition-transform"
                disabled={!isAuthenticated || isPending || !commentInput.trim()}
                onClick={() => {
                  const content = commentInput.trim();
                  if (!content) return;
                  addComment(
                    { articleId: currentArticleId, content, parentId: null },
                    {
                      onSuccess: () => setCommentInput(""),
                      onError: (error) =>
                        toast({
                          title: "Gagal menambahkan komentar",
                          description: error instanceof Error ? error.message : "Terjadi kesalahan.",
                          variant: "destructive",
                        }),
                    },
                  );
                }}
              >
                Comment
              </Button>
            </div>
          </div>

          <div className="space-y-2 divide-y divide-border/30">
            {commentsLoading ? (
              <div className="py-12 text-center text-muted-foreground animate-pulse">
                Memuat komentar...
              </div>
            ) : comments.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground italic">
                No comments yet. Be the first to share your thoughts!
              </div>
            ) : (
              comments.slice(0, 50).map((comment) => (
                <CommentThread 
                  key={comment.id} 
                  comment={comment} 
                  onReply={(content, parentId) => addComment({ articleId: currentArticleId, content, parentId })} 
                />
              ))
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}

function countComments(comments: CommentResponse[]): number {
  return comments.reduce((sum, item) => sum + 1 + countComments(item.replies || []), 0);
}
