import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle, Clock, Mail, LogOut } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getDisplayName } from "@/lib/amanat";

export default function PendingApprovalPage() {
  const { user, loading, logout, refresh } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/auth");
      return;
    }
    const status = user?.status || user?.accountStatus;
    if (status === "active") {
      setLocation("/feed");
    }
  }, [loading, setLocation, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat status...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="p-6 text-center text-red-500">No data</div>;
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-primary/20 bg-primary/10">
              <AlertCircle className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Pending Approval</h1>
          <p className="text-sm text-muted-foreground">Your account is awaiting admin review</p>
        </div>

        {/* Main Alert */}
        <Alert className="border-primary/30 bg-primary/5">
          <Clock className="h-4 w-4" />
          <AlertTitle>Thank you for registering!</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>
              Your account <span className="font-semibold">@{user?.username}</span> has been created successfully.
            </p>
            <p>
              To maintain community quality, new accounts require admin approval before you can post, vote, or comment.
            </p>
          </AlertDescription>
        </Alert>

        {/* What happens next */}
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">What happens next?</h2>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium">Admin Review</p>
                <p className="text-sm text-muted-foreground">Our administrators will review your profile</p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                <span className="text-sm font-bold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium">You'll be notified</p>
                <p className="text-sm text-muted-foreground">
                  We'll send you an email when your account is approved
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                <span className="text-sm font-bold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium">Enjoy the community</p>
                <p className="text-sm text-muted-foreground">
                  Once approved, you'll have full access to all features
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* Info box */}
        <Alert className="border-border/30">
          <Mail className="h-4 w-4" />
          <AlertTitle>Typical approval time</AlertTitle>
          <AlertDescription>
            Most accounts are approved within 24 hours. If you don't receive approval within 48 hours, please contact
            support.
          </AlertDescription>
        </Alert>

        {/* Action buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={async () => {
              const success = await logout();
              if (success) {
                setLocation("/");
              }
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
          <Button
            className="flex-1"
            onClick={() => void refresh()}
          >
            Check Status
          </Button>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-muted-foreground">
          <p>
            Need help? Contact{" "}
            <a href="mailto:admin@amanat.com" className="text-primary hover:underline">
              admin@amanat.com
            </a>
          </p>
        </div>

        {/* User info display */}
        {user && (
          <div className="rounded-lg bg-muted/30 p-4 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Username:</span>
              <span className="font-mono font-semibold">{user.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-semibold">{getDisplayName(user)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-semibold capitalize text-yellow-600">Pending</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
