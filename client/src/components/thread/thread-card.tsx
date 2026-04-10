import { useTheme } from "next-themes";
import { Link } from "wouter";
import type { ArticleResponse } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ArrowBigUp, MessageSquare, MapPin } from "lucide-react";
import { useToggleUpvote } from "@/hooks/use-articles";
import { Button } from "@/components/ui/button";

interface ThreadCardProps {
  article: ArticleResponse;
}

export function ThreadCard({ article }: ThreadCardProps) {
  const { theme } = useTheme();

  switch (theme) {
    case "ide":
      return <ThreadIDE article={article} />;
    case "gold":
      return <ThreadGold article={article} />;
    case "comic":
      return <ThreadComic article={article} />;
    case "classic":
      return <ThreadClassic article={article} />;
    default:
      return <ThreadAmanat article={article} />;
  }
}

function ThreadAmanat({ article }: { article: ArticleResponse }) {
  const { mutate: upvote } = useToggleUpvote();

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3 
                    hover:shadow-lg transition-all active:scale-[0.99] group relative">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-primary">@{article.author?.username || "anonymous"}</span>
        <span>•</span>
        <span>{formatDistanceToNow(new Date(article.createdAt || Date.now()), { addSuffix: true })}</span>
      </div>

      <Link href={`/post/${article.id}`}>
        <div className="cursor-pointer">
          <h2 className="text-base sm:text-lg font-bold hover:text-primary transition-colors line-clamp-2 leading-snug">
            {article.title}
          </h2>
          {article.location && (
            <div className="flex items-center gap-1 text-xs text-primary font-medium mt-1">
              <MapPin className="h-3 w-3" />
              <span>{article.location}</span>
            </div>
          )}
        </div>
      </Link>

      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
        {article.content || "No content provided."}
      </p>

      <div className="flex items-center gap-3 pt-2">
        <Button 
          variant="outline" 
          size="sm"
          className={`h-9 rounded-xl gap-1.5 transition-all active:scale-95 ${article.hasUpvoted ? "border-orange-500 text-orange-500 bg-orange-500/5" : ""}`} 
          onClick={(e) => {
            e.preventDefault();
            upvote(article.id);
          }}
        >
          <ArrowBigUp className={`h-4.5 w-4.5 ${article.hasUpvoted ? "fill-current" : ""}`} />
          <span className="font-bold text-xs">{article.upvoteCount}</span>
        </Button>

        <Link href={`/post/${article.id}`}>
          <Button variant="ghost" size="sm" className="h-9 rounded-xl gap-1.5 text-muted-foreground hover:text-foreground">
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs font-bold">Discuss</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

function ThreadIDE({ article }: { article: ArticleResponse }) {
  return (
    <div className="thread-editor-container rounded-xl overflow-hidden border border-border bg-[#0d1117] text-sm shadow-xl">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#161b22] text-xs text-zinc-400 border-b border-border/10">
        <span className="w-3 h-3 bg-red-500 rounded-full"></span>
        <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
        <span className="ml-2 font-mono">{article.author?.username || "anonymous"}.post</span>
      </div>
      <div className="p-4 space-y-2 font-mono">
        <div className="text-blue-400">// {article.title}</div>
        {article.location && <div className="text-zinc-500 font-mono text-xs">// location: {article.location}</div>}
        <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
          {article.content || "No content provided."}
        </div>
      </div>
    </div>
  );
}

function ThreadGold({ article }: { article: ArticleResponse }) {
  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-100 border-2 border-amber-300 shadow-amber-200/50 shadow-md">
      <h2 className="text-lg font-serif font-bold text-amber-900">{article.title}</h2>
      {article.location && <p className="text-xs text-amber-700/70 font-medium italic">📍 {article.location}</p>}
      <p className="mt-2 text-sm text-amber-800 line-clamp-2">
        {article.content || "No content provided."}
      </p>
    </div>
  );
}

function ThreadComic({ article }: { article: ArticleResponse }) {
  return (
    <div className="p-4 rounded-lg bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all">
      <h2 className="text-xl font-black uppercase tracking-tighter">{article.title}</h2>
      {article.location && <p className="text-xs font-bold uppercase mt-1">@ {article.location}</p>}
      <p className="mt-2 text-sm font-bold">
        {article.content || "No content provided."}
      </p>
    </div>
  );
}

function ThreadClassic({ article }: { article: ArticleResponse }) {
  return (
    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded shadow-sm">
      <h2 className="text-lg font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4">{article.title}</h2>
      {article.location && <p className="text-xs text-zinc-500 mt-1">[{article.location}]</p>}
      <p className="mt-2 text-sm text-zinc-700 leading-snug">
        {article.content || "No content provided."}
      </p>
    </div>
  );
}
