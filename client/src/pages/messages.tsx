import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useChatUsers, useConversation, useSendMessage } from "@/hooks/use-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getDisplayName } from "@/lib/amanat";
import { SmartBackButton } from "@/components/smart-back-button";

type MessageItem = {
  id: string;
  senderId: string;
  content: string;
  createdAt?: number | string;
};

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: users = [], isLoading: usersLoading } = useChatUsers();
  const [query, setQuery] = useState("");
  const [peerId, setPeerId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const { data: rawMessages = [], isLoading: messagesLoading } = useConversation(peerId);
  const { mutate: send, isPending } = useSendMessage(peerId);
  const messages = (rawMessages as MessageItem[]) || [];

  const userStatus = user?.status || user?.accountStatus;
  const isPendingUser = userStatus === "pending";

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/auth");
    }
  }, [user, authLoading, setLocation]);

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((item) =>
      `${item.firstName ?? ""} ${item.lastName ?? ""} ${item.username}`.toLowerCase().includes(keyword),
    );
  }, [users, query]);

  useEffect(() => {
    if (!peerId && filteredUsers.length > 0) {
      setPeerId(filteredUsers[0].id);
    }
  }, [filteredUsers, peerId]);

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

  const peer = users.find((item) => item.id === peerId);

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6 min-h-screen w-full overflow-x-hidden">
        <div className="mb-4">
          <SmartBackButton fallback="/feed" label="Kembali" className="rounded-xl" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="amanat-panel p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-primary">Pesan Anggota</p>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari anggota..." className="rounded-xl pl-9" />
          </div>
          <div className="mt-4 space-y-2">
            {usersLoading ? <div className="p-4 text-sm text-center">Loading...</div> : null}
            {filteredUsers.map((item) => (
              <button
                key={item.id}
                className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left ${peerId === item.id ? "border-primary bg-primary/10" : "border-border bg-background/60"}`}
                onClick={() => setPeerId(item.id)}
              >
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={item.profileImageUrl || undefined} />
                  <AvatarFallback>{getDisplayName(item).slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{getDisplayName(item)}</p>
                  <p className="truncate text-xs text-muted-foreground">@{item.username}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="amanat-panel flex min-h-[70vh] flex-col overflow-hidden">
          {peer ? (
            <>
              <div className="border-b border-border/70 px-5 py-4">
                <p className="font-semibold">{getDisplayName(peer)}</p>
                <p className="text-sm text-muted-foreground">@{peer.username}</p>
              </div>
              <div className="flex-1 space-y-3 overflow-auto px-5 py-5">
                {messagesLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
                {messages.map((message) => {
                  const mine = message.senderId === user?.id;
                  return (
                    <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${mine ? "bg-primary text-primary-foreground" : "border border-border bg-background"}`}>
                        <p className={`text-[11px] ${mine ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          {mine ? `@${user?.username || "me"}` : `@${peer.username}`}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
                        <p className={`mt-2 text-[11px] ${mine ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          {new Date(message.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada pesan dalam percakapan ini.</p> : null}
              </div>
              <div className="border-t border-border/70 p-4">
                <div className="flex gap-3">
                  <Textarea
                    rows={2}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={isPendingUser ? "Mode read-only - tidak dapat mengirim pesan" : "Tulis pesan..."}
                    className="rounded-2xl"
                    disabled={isPendingUser}
                  />
                  <Button
                    className="rounded-2xl"
                    disabled={isPending || !text.trim() || isPendingUser}
                    onClick={() => {
                      const content = text.trim();
                      if (!content) return;
                      send(content, { onSuccess: () => setText("") });
                    }}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Kirim
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              Pilih anggota untuk mulai percakapan.
            </div>
          )}
        </section>
        </div>
      </div>
    </Layout>
  );
}
