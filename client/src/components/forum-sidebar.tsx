import { getRankBadgeClass } from "@/lib/amanat";
import { Badge } from "@/components/ui/badge";
import { Flame, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import type { ArticleResponse } from "@shared/schema";

export function ForumSidebar({ articles = [] }: { articles?: ArticleResponse[] }) {
  const trending = articles
    .slice()
    .sort((a, b) => (b.upvoteCount + ((b as any).commentCount ?? 0)) - (a.upvoteCount + ((a as any).commentCount ?? 0)))
    .slice(0, 5);
  const activeLocations = Array.from(
    new Set(
      articles
        .map((article) => article.location?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ).slice(0, 5);

  return (
    <div className="space-y-4">
      <aside className="amanat-sidebar-card">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Nilai Utama</h3>
        </div>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          <p>Ilmu sebagai fondasi percakapan.</p>
          <p>Akhlak dan adab saat berbeda pendapat.</p>
          <p>Diskusi sehat yang memperkuat persatuan.</p>
          <p>Konten edukatif, bukan sensasi visual.</p>
        </div>
      </aside>

      <aside className="amanat-sidebar-card">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Lokasi Aktif</h3>
        </div>
        <div className="mt-3 space-y-3">
          {activeLocations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada lokasi aktif.</p>
          ) : (
            activeLocations.map((location) => (
              <div key={location} className="rounded-xl border border-border/70 bg-background/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{location}</p>
                  <Badge variant="outline" className={`rank-badge ${getRankBadgeClass("B")}`}>Live</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <aside className="amanat-sidebar-card">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Trending</h3>
        </div>
        <div className="mt-3 space-y-3">
          {trending.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada diskusi trending.</p>
          ) : (
            trending.map((article, index) => (
              <div key={article.id} className="rounded-xl border border-border/70 bg-background/60 p-3">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-medium">{article.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {article.upvoteCount} upvote
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <aside className="amanat-sidebar-card">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Moderasi</h3>
        </div>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>Tidak toxic</li>
          <li>Tidak spam</li>
          <li>Utamakan dalil, data, dan adab</li>
          <li>Prestasi dan kegiatan dihargai</li>
        </ul>
      </aside>
    </div>
  );
}
