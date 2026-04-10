import { useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import type { NotificationResponse } from "@shared/schema";
import { getDisplayName, getRankBadgeClass, getRankFromStats } from "@/lib/amanat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Bell, Compass, MessageSquareText, Settings2, SquarePen, UserCircle2, Users2, Shield } from "lucide-react";

const primaryNav = [
  { href: "/feed", label: "Home", icon: Compass },
  { href: "/search", label: "Communities", icon: Users2 },
  { href: "/messages", label: "Chat", icon: MessageSquareText },
  { href: "/profile", label: "Profile", icon: UserCircle2 },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { data: notifications = [] } = useNotifications();
  const [location, setLocation] = useLocation();

  const notificationsTyped = notifications as NotificationResponse[];
  const unreadCount = notificationsTyped.filter((item) => !item.isRead).length;
  const rank = getRankFromStats({
    role: user?.role,
    rank: user?.rank ?? null,
    totalPost: user?.totalPost ?? 0,
    totalUpvote: user?.totalUpvote ?? 0,
  });

  const activeLabel = useMemo(
    () => primaryNav.find((item) => typeof location === 'string' && location.startsWith(item.href))?.label ?? "AMANAT",
    [location],
  );
  const accountStatusText =
    user?.accountStatus === "pending"
      ? "Menunggu persetujuan admin"
      : user?.accountStatus === "banned"
        ? "Akun diblokir"
        : "Akun aktif";

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-border/80 bg-background/95 px-5 py-6 lg:flex lg:flex-col">
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">AN</div>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Amanat News Hub</p>
            <p className="text-xl font-bold">AMANAT</p>
          </div>
        </Link>

        <div className="overflow-y-auto flex-1 min-h-0">
          <nav className="mt-8 space-y-2">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const active = typeof location === 'string' && location.startsWith(item.href);
              return (
                <Link key={`${item.href}-${item.label}`} href={item.href}>
                  <Button variant={active ? "secondary" : "ghost"} className="h-12 w-full justify-start rounded-2xl gap-3 px-4">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            <Link href="/submit">
              <Button className="gold-shine h-12 w-full justify-start rounded-2xl gap-3 px-4" data-gold-shine="true">
                <SquarePen className="h-4 w-4" />
                Buat Thread
              </Button>
            </Link>
            {user && ["admin", "superadmin"].includes(user.role) && (
              <>
                <div className="h-px bg-border/30 my-2" />
                <Link href="/admin">
                  <Button
                    variant="outline"
                    className="h-12 w-full justify-start rounded-2xl gap-3 px-4"
                  >
                    <Shield className="h-4 w-4" />
                    Admin Panel
                  </Button>
                </Link>
              </>
            )}
          </nav>

          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Status Akun</p>
              <div className="mt-3 rounded-xl border border-border/60 bg-background/70 px-3 py-3">
                <p className="font-medium">{user?.username || "Guest"}</p>
                <p className="text-xs text-muted-foreground">{accountStatusText}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Theme</p>
              <div className="mt-3">
                <ThemeSwitcher compact />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto rounded-2xl border border-border/70 bg-card p-4">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-border">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback>{user ? getDisplayName(user).slice(0, 1).toUpperCase() : "U"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{user ? getDisplayName(user) : "User"}</p>
                  <p className="truncate text-xs text-muted-foreground">@{user?.username}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
<Badge className={`rank-badge ${getRankBadgeClass(rank)} shadow-lg shadow-gold`}>{rank === "S++" ? "👑 " + rank : rank}</Badge>
                <Button
                  variant="ghost"
                  className="h-9 rounded-xl px-3 text-sm"
                  onClick={async () => {
                    const success = await logout();
                    if (success) {
                      setLocation("/");
                    }
                  }}
                >
                  Keluar
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Masuk untuk ikut berdiskusi dan membuka fitur komunitas.</p>
              <Link href="/auth">
                <Button className="w-full rounded-xl">Masuk / Daftar</Button>
              </Link>
            </div>
          )}
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-primary">Amanat News Hub</p>
              <p className="font-semibold">{activeLabel}</p>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/notifications">
                <Button variant="outline" className="relative h-11 rounded-2xl px-4">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 ? (
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-destructive" />
                  ) : null}
                </Button>
              </Link>
              <Link href="/submit">
                <Button className="gold-shine hidden rounded-2xl md:inline-flex" data-gold-shine="true">Buat Thread</Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="pb-24 lg:pb-8 relative">{children}</main>

        {/* Floating Action Button (Mobile Only) */}
        <Link href="/submit">
          <Button className="fixed bottom-24 right-6 z-50 h-14 w-14 rounded-full shadow-2xl bg-primary text-primary-foreground border-4 border-background lg:hidden active:scale-90 transition-transform flex items-center justify-center">
            <SquarePen className="h-6 w-6" />
          </Button>
        </Link>
      </div>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {primaryNav.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const active = typeof location === 'string' && location.startsWith(item.href);
            return (
              <Link key={`mobile-${item.href}`} href={item.href}>
                <button 
                  className={`flex flex-col items-center gap-1 transition-all duration-200 ${
                    active ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "fill-primary/20" : ""}`} />
                  <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
