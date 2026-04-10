import { useState } from "react";
import type { CommentResponse } from "@shared/schema";
import { getDisplayName, getRankBadgeClass } from "@/lib/amanat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowBigUp, ArrowBigDown, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CommentProps {
  comment: CommentResponse;
  onReply: (content: string, parentId: number) => void;
  depth?: number;
}

export function CommentThread({ comment, onReply, depth = 0 }: CommentProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  const handleReply = () => {
    if (!replyContent.trim()) return;
    onReply(replyContent, comment.id);
    setReplyContent("");
    setIsReplying(false);
  };

  return (
    <div className={`group mt-4 ${depth > 0 ? "ml-4 border-l-2 border-border/30 pl-4" : ""}`}>
      <div className="flex gap-3">
        {/* Voting placeholder -- real voting to be implemented with backend in future */}
        <div className="flex flex-col items-center gap-1 shrink-0 pt-1 text-xs text-muted-foreground">
          <span>👍</span>
          <span>{(comment as any).upvoteCount ?? 0}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold">@{comment.user?.username || "anonymous"}</span>
            <Badge className={`h-4 text-[9px] uppercase ${getRankBadgeClass(comment.user?.rank || "C")}`}>
              {comment.user?.rank || "C"}
            </Badge>
            <span className="text-[10px] text-muted-foreground">•</span>
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt || Date.now()), { addSuffix: true })}
            </span>
            {comment.replies && comment.replies.length > 0 && (
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
              >
                {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
            )}
          </div>

          <div className={`text-sm leading-relaxed ${isCollapsed ? "hidden" : "block"}`}>
            {comment.content}
          </div>

          <div className={`flex items-center gap-4 mt-2 ${isCollapsed ? "hidden" : "flex"}`}>
            <button 
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors active:scale-95"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Reply
            </button>
          </div>

          {isReplying && !isCollapsed && (
            <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <Textarea
                rows={2}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="What are your thoughts?"
                className="rounded-xl text-sm focus-visible:ring-primary"
              />
              <div className="flex gap-2">
                <Button size="sm" className="rounded-lg h-8 px-4" onClick={handleReply}>
                  Post Reply
                </Button>
                <Button size="sm" variant="ghost" className="rounded-lg h-8 px-4" onClick={() => setIsReplying(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Recursive Replies */}
          {!isCollapsed && comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.map((reply) => (
                <CommentThread 
                  key={reply.id} 
                  comment={reply} 
                  onReply={onReply} 
                  depth={depth + 1} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
