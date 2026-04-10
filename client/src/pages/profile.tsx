import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useUserPosts } from "@/hooks/use-user-posts";
import { useUserStats } from "@/hooks/use-user-stats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, BookOpenText, MapPin, Medal, Sparkles, MessageCircle, FileText, Settings, Shield } from "lucide-react";
import { getDisplayName, getRankFromStats } from "@/lib/amanat";
import { useUserComments } from "@/hooks/use-articles";
import { ThreadCard } from "@/components/thread/thread-card";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { data: myPosts = [], isLoading: postsLoading } = useUserPosts(user?.id);
  const { data: myComments = [], isLoading: commentsLoading } = useUserComments(user?.id);
  const { data: stats = { totalPosts: 0, totalUpvotes: 0 }, isLoading: statsLoading } = useUserStats(user?.id);
  const [, setLocation] = useLocation();

  const bio = user?.bio ?? "";
  const location = user?.location ?? "";
  const achievements = user?.achievements ?? "";
  const profileImageUrl = user?.profileImageUrl || user?.profilePicture || null;
  const achievementsList = achievements.split(",").map((item) => item.trim()).filter(Boolean);

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/auth");
    }
  }, [user, authLoading, setLocation]);

  const rank = getRankFromStats({
    role: user?.role,
    rank: user?.rank ?? null,
    totalPost: stats.totalPosts,
    totalUpvote: stats.totalUpvotes,
  });

  if (authLoading) {
    return (
      <Layout>
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Memuat profil...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <div className="p-6 text-center text-red-500">No data</div>;
  }

  const isPending = (user.status || user.accountStatus) === "pending";

  return (
    <Layout>
      <div className="min-h-screen w-full overflow-x-hidden bg-background">
        {/* Header/Banner Area */}
        <div className="h-48 w-full bg-gradient-to-r from-primary/20 via-primary/5 to-accent/20 border-b border-border/50" />

        <div className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
          <div className="relative -mt-16 mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
              <div className="relative h-32 w-32 rounded-3xl border-4 border-background bg-muted shadow-xl overflow-hidden group">
                <img
                  src={profileImageUrl || "/default-avatar.png"}
                  alt={getDisplayName(user)}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-black tracking-tight">{getDisplayName(user)}</h1>
                  {user.role === "superadmin" && <Shield className="h-5 w-5 text-primary fill-primary/10" />}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
                  <span className="font-medium text-primary">@{user.username}</span>
                  {location && (
                    <span className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3.5 w-3.5" />
                      {location}
                    </span>
                  )}
                  <span className="text-sm">Joined {new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/settings">
                <Button variant="outline" className="rounded-xl font-bold">
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
            {/* Sidebar info */}
            <div className="space-y-6">
              <div className="amanat-panel p-6 space-y-6">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rank & Stats</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Rank</span>
                    <Badge className={`rounded-lg font-black ${rank === "S++" ? "bg-yellow-500 text-black shadow-[0_0_12px_rgba(234,179,8,0.5)]" : ""}`}>
                      {rank}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Posts</span>
                    <span className="font-bold">{stats.totalPosts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Upvotes</span>
                    <span className="font-bold">{stats.totalUpvotes}</span>
                  </div>
                </div>

                {bio && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Bio</p>
                    <p className="text-sm leading-relaxed text-foreground/80">{bio}</p>
                  </div>
                )}

                {achievementsList.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Achievements</p>
                    <div className="flex flex-wrap gap-2">
                      {achievementsList.map((ach, i) => (
                        <Badge key={i} variant="secondary" className="rounded-md bg-primary/5 text-primary border-primary/10">
                          <Award className="mr-1 h-3 w-3" /> {ach}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {isPending && (
                  <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4 space-y-2">
                    <p className="text-sm font-bold text-yellow-600 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> Account Pending
                    </p>
                    <p className="text-xs text-yellow-600/80">Your profile is visible, but you cannot post until approved by an admin.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
              <Tabs defaultValue="posts" className="w-full">
                <TabsList className="bg-muted/50 p-1 rounded-xl h-12 w-full sm:w-auto">
                  <TabsTrigger value="posts" className="rounded-lg px-6 font-bold gap-2">
                    <FileText className="h-4 w-4" /> Posts
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="rounded-lg px-6 font-bold gap-2">
                    <MessageCircle className="h-4 w-4" /> Comments
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="posts" className="mt-6 space-y-4">
                  {postsLoading ? (
                    <div className="space-y-4">
                      <div className="amanat-panel h-32 animate-pulse bg-muted/40" />
                      <div className="amanat-panel h-32 animate-pulse bg-muted/40" />
                    </div>
                  ) : myPosts.length === 0 ? (
                    <div className="amanat-panel py-20 text-center text-muted-foreground italic">
                      No posts yet. Start sharing your stories!
                    </div>
                  ) : (
                    myPosts.slice(0, 10).map((post) => (
                      <ThreadCard key={post.id} article={post} />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="comments" className="mt-6 space-y-4">
                  {commentsLoading ? (
                    <div className="space-y-4">
                      <div className="amanat-panel h-24 animate-pulse bg-muted/40" />
                      <div className="amanat-panel h-24 animate-pulse bg-muted/40" />
                    </div>
                  ) : myComments.length === 0 ? (
                    <div className="amanat-panel py-20 text-center text-muted-foreground italic">
                      No comments yet. Join the conversations!
                    </div>
                  ) : (
                    myComments.slice(0, 10).map((comment) => (
                      <div key={comment.id} className="amanat-panel p-5 space-y-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-bold text-primary">Commented on</span>
                          <Link href={`/post/${comment.articleId}`}>
                            <span className="hover:underline cursor-pointer font-medium text-foreground">
                              {/* We could fetch article title here, but for now just show ID or link */}
                              Thread #{comment.articleId}
                            </span>
                          </Link>
                          <span>•</span>
                          <span>{new Date(comment.createdAt || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm leading-relaxed">{comment.content}</p>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
