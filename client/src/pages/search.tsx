import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { ForumSidebar } from "@/components/forum-sidebar";
import { useArticles, useSearchArticles, useSearchUsers } from "@/hooks/use-articles";
import { ThreadCard } from "@/components/thread/thread-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, FileText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { SmartBackButton } from "@/components/smart-back-button";

export default function SearchPage() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"articles" | "users">("articles");
  const { data: allArticles = [] } = useArticles();
  const { data: articles = [], isLoading: articlesLoading } = useSearchArticles(searchType === "articles" ? query : "");
  const { data: users = [], isLoading: usersLoading } = useSearchUsers(searchType === "users" ? query : "");

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/auth");
    }
  }, [user, authLoading, setLocation]);

  if (authLoading) {
    return (
      <Layout>
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Memuat data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <Layout>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6 min-h-screen w-full overflow-x-hidden">
        <div className="hidden lg:block">
          <ForumSidebar articles={allArticles} />
        </div>

        <div className="space-y-5">
          <section className="amanat-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <SmartBackButton fallback="/feed" label="Kembali" className="rounded-xl" />
            </div>
            <p className="text-xs uppercase tracking-[0.28em] text-primary">Pencarian Forum</p>
            <h1 className="mt-2 text-3xl font-bold">Cari thread, topik, atau anggota komunitas.</h1>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant={searchType === "articles" ? "default" : "outline"} className="rounded-xl gap-2" onClick={() => setSearchType("articles")}>
                <FileText className="h-4 w-4" />
                Thread
              </Button>
              <Button variant={searchType === "users" ? "default" : "outline"} className="rounded-xl gap-2" onClick={() => setSearchType("users")}>
                <Users className="h-4 w-4" />
                Anggota
              </Button>
            </div>

            <div className="mt-4 flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchType === "articles" ? "Cari judul, isi, atau hashtag..." : "Cari nama atau username..."}
                className="rounded-xl"
              />
              <Button className="rounded-xl">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </section>

          {searchType === "articles" ? (
            <div className="space-y-4">
              {articlesLoading ? (
                <div className="space-y-4">
                  <div className="amanat-panel h-32 animate-pulse bg-muted/40" />
                  <div className="amanat-panel h-32 animate-pulse bg-muted/40" />
                </div>
              ) : (
                <>
                  {articles.slice(0, 20).map((article, index) => (
                    <ThreadCard key={article.id} article={article} />
                  ))}
                  {query && articles.length === 0 ? (
                    <div className="amanat-panel px-6 py-10 text-center text-muted-foreground">Tidak ada thread yang cocok dengan pencarian Anda.</div>
                  ) : null}
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {usersLoading ? (
                <>
                  <div className="amanat-panel h-24 animate-pulse bg-muted/40" />
                  <div className="amanat-panel h-24 animate-pulse bg-muted/40" />
                </>
              ) : (
                <>
                  {users.slice(0, 20).map((user) => (
                    <div key={user.id} className="amanat-panel p-4">
                      <p className="text-lg font-semibold">{[user.firstName, user.lastName].filter(Boolean).join(" ") || user.username}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{user.bio || "Belum ada bio."}</p>
                    </div>
                  ))}
                  {query && users.length === 0 ? (
                    <div className="amanat-panel px-6 py-10 text-center text-muted-foreground">Tidak ada anggota yang cocok dengan pencarian ini.</div>
                  ) : null}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
