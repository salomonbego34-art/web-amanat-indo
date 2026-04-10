import { useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useNotifications, useReadAllNotifications } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { SmartBackButton } from "@/components/smart-back-button";
import { Clock3 } from "lucide-react";

type NotificationItem = {
  id: string;
  message: string;
  isRead: boolean;
  createdAt?: number | string;
  actor: {
    username: string;
    firstName?: string | null;
  };
};

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: rawData = [], isLoading: notificationsLoading } = useNotifications();
  const { mutate: readAll } = useReadAllNotifications();
  const data = (rawData as NotificationItem[]) || [];

  const userStatus = user?.status || user?.accountStatus;
  const isPending = userStatus === "pending";

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
      <div className="container max-w-3xl mx-auto px-4 py-8 min-h-screen w-full overflow-x-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <SmartBackButton fallback="/feed" label="Kembali" className="rounded-xl" />
            <h1 className="text-2xl font-display font-bold">Notifikasi</h1>
          </div>
          <Button variant="outline" onClick={() => readAll()}>
            Tandai semua dibaca
          </Button>
        </div>

        {isPending && (
          <Alert className="border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 mb-4">
            <Clock3 className="h-4 w-4" />
            <AlertTitle>Mode Read-Only</AlertTitle>
            <AlertDescription>
              Akun Anda sedang menunggu persetujuan admin.
            </AlertDescription>
          </Alert>
        )}

        {notificationsLoading ? (
          <p className="text-muted-foreground animate-pulse">Memuat...</p>
        ) : data.length === 0 ? (
          <p className="text-muted-foreground">Belum ada notifikasi.</p>
        ) : (
          <div className="space-y-3">
            {data.slice(0, 50).map((n) => (
              <div key={n.id} className={`rounded-lg border p-3 ${n.isRead ? "bg-background" : "bg-primary/5"}`}>
                <p className="text-sm">
                  <span className="font-medium">{n.actor.firstName || n.actor.username}</span> {n.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.createdAt || Date.now()), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
