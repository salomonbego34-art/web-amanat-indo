import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { ThreadCard } from "@/components/thread/thread-card";
import { ForumSidebar } from "@/components/forum-sidebar";
import { useArticles } from "@/hooks/use-articles";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle, Clock3, Flame, Trophy } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const sortOptions = [
  { value: "hot", label: "Hot", icon: Flame },
  { value: "recent", label: "New", icon: Clock3 },
  { value: "popular", label: "Top", icon: Trophy },
] as const;

export default function Feed() {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<"hot" | "recent" | "popular">("hot");
  const { data: articles = [], isLoading: articlesLoading, error } = useArticles(sortBy === "hot" ? "popular" : sortBy);

  const userStatus = user?.status || user?.accountStatus;
  const isPending = userStatus === "pending";

  const sortedArticles = useMemo(() => {
    const items = [...articles];
    if (sortBy === "hot") {
      return items.sort((a, b) => {
        const hotA = (a.upvoteCount || 0) * 3 + ((a as any).commentCount ?? 0) * 2;
        const hotB = (b.upvoteCount || 0) * 3 + ((b as any).commentCount ?? 0) * 2;
        return hotB - hotA;
      });
    }
    return items;
  }, [articles, sortBy]);

  return (
    <Layout>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6 min-h-screen w-full overflow-x-hidden">
        <div className="hidden lg:block">
          <ForumSidebar articles={sortedArticles} />
        </div>

        <div className="space-y-5">
          <section className="amanat-panel overflow-hidden">
            <div className="border-b border-border/80 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 px-5 py-6">
              <p className="text-xs uppercase tracking-[0.28em] text-primary">Amanat News Hub</p>
              <h1 className="mt-2 text-4xl font-bold text-balance">Ruang diskusi komunitas yang beradab, bernas, dan fokus pada ilmu.</h1>
              <p className="mt-3 max-w-3xl text-muted-foreground">
                Forum ini menggabungkan ritme diskusi ala Reddit dan nuansa komunitas ala forum klasik.
                Fokusnya berita komunitas, edukasi, prestasi anggota, serta percakapan yang sehat.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 px-5 py-4">
              {sortOptions.map((option) => {
                const Icon = option.icon;
                const active = sortBy === option.value;
                return (
                  <Button
                    key={option.value}
                    variant={active ? "default" : "outline"}
                    className="rounded-xl gap-2"
                    onClick={() => setSortBy(option.value)}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </section>

          {isPending && (
            <Alert className="border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300">
              <Clock3 className="h-4 w-4" />
              <AlertTitle>Mode Read-Only</AlertTitle>
              <AlertDescription>
                Akun Anda sedang menunggu persetujuan admin. Anda dapat melihat post tetapi tidak dapat berinteraksi.
              </AlertDescription>
            </Alert>
          )}

          {!user && (
            <Alert className="border-primary/30 bg-primary/5">
              <Clock3 className="h-4 w-4" />
              <AlertTitle>Mode Publik</AlertTitle>
              <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>Anda bisa membaca thread tanpa login. Masuk untuk ikut berdiskusi, mengirim komentar, dan membuka fitur komunitas.</span>
                <Link href="/auth">
                  <Button className="rounded-xl">Masuk / Daftar</Button>
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {articlesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={`feed-skeleton-${index}`} className="amanat-panel h-40 animate-pulse bg-muted/40" />
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Feed gagal dimuat</AlertTitle>
              <AlertDescription>Periksa koneksi backend atau data SQLite Anda.</AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {sortedArticles.slice(0, 20).map((article) => (
                <ThreadCard key={article.id} article={article} />
              ))}
              {sortedArticles.length === 0 && (
                <div className="amanat-panel px-6 py-12 text-center text-muted-foreground">
                  Belum ada thread di kategori ini.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
