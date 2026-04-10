import { Layout } from "@/components/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Shield,
  UserCheck,
  UserCog,
  Trash2,
  Ban,
  Eye,
  FileText,
  Users,
  TrendingUp,
  AlertCircle,
  Search,
  CheckCircle,
  XCircle,
  Edit,
  Clock,
  MapPin,
} from "lucide-react";
import type { User } from "@shared/models/auth";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState, useMemo } from "react";
import type { ArticleResponse } from "@shared/schema";

export default function AdminDashboardEnhanced() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newRole, setNewRole] = useState("");

  // Check superadmin access
  if (currentUser?.role !== "superadmin" && currentUser?.role !== "admin") {
    return (
      <Layout>
        <div className="container mx-auto py-20 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Only Super Admins and Admins can access this panel.</p>
        </div>
      </Layout>
    );
  }

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  // Fetch all articles
  const { data: articles = [] } = useQuery<ArticleResponse[]>({
    queryKey: ["/api/articles"],
    queryFn: async () => {
      const res = await fetch("/api/articles", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch articles");
      return res.json();
    },
  });

  // Mutations
  const roleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await fetch(`/api/admin/user/${userId}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update role");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Role Updated" });
      setShowRoleDialog(false);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/user/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete user");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User Deleted" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/user/${userId}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to approve user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User Approved" });
    },
  });

  const banMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/user/${userId}/ban`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to ban user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User Banned" });
    },
  });

  const deleteArticleMutation = useMutation({
    mutationFn: async (articleId: number) => {
      const res = await fetch(`/api/admin/article/${articleId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete article");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Article Deleted" });
    },
  });

  const stats = useMemo(() => ({
    totalUsers: users.length,
    pendingUsers: users.filter(u => u.accountStatus === "pending").length,
    activeUsers: users.filter(u => u.accountStatus === "active").length,
    bannedUsers: users.filter(u => u.accountStatus === "banned" || u.isBanned).length,
    totalPosts: articles.length,
    totalUpvotes: articles.reduce((sum, a) => sum + (a.upvoteCount || 0), 0),
  }), [users, articles]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const matchStatus = statusFilter === "all" || u.accountStatus === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  if (usersLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Hub</h1>
              <p className="text-muted-foreground">Full control over amanat.app database</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg">Users Management</TabsTrigger>
            <TabsTrigger value="content" className="rounded-lg">Content Moderation</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard title="Total Users" value={stats.totalUsers} icon={Users} />
              <StatCard title="Pending" value={stats.pendingUsers} icon={Clock} color="text-yellow-500" />
              <StatCard title="Active" value={stats.activeUsers} icon={CheckCircle} color="text-green-500" />
              <StatCard title="Banned" value={stats.bannedUsers} icon={Ban} color="text-red-500" />
              <StatCard title="Threads" value={stats.totalPosts} icon={FileText} />
              <StatCard title="Upvotes" value={stats.totalUpvotes} icon={TrendingUp} />
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Users List</CardTitle>
                  <CardDescription>Manage user roles, status, and account data</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search users..." 
                      className="pl-9 w-64 rounded-xl"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img 
                              src={u.profileImageUrl || "/default-avatar.png"} 
                              loading="lazy"
                              className="w-10 h-10 rounded-full object-cover border"
                            />
                            <div>
                              <p className="font-bold">{u.nama || u.username}</p>
                              <p className="text-xs text-muted-foreground">@{u.username}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{u.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={u.accountStatus} />
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(u.createdAt || Date.now()).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {u.accountStatus === "pending" && (
                              <Button size="icon" variant="ghost" className="text-green-500" onClick={() => approveMutation.mutate(u.id)}>
                                <UserCheck className="h-5 w-5" />
                              </Button>
                            )}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="icon" variant="ghost" onClick={() => setSelectedUser(u)}>
                                  <UserCog className="h-5 w-5" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>User Management: {u.username}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <Button variant="outline" onClick={() => { setNewRole(u.role); setShowRoleDialog(true); }}>
                                      Change Role
                                    </Button>
                                    <Button variant="outline" onClick={() => { /* Edit profile logic */ }}>
                                      Edit Profile
                                    </Button>
                                  </div>
                                  <Button 
                                    variant="destructive" 
                                    className="w-full" 
                                    onClick={() => banMutation.mutate(u.id)}
                                    disabled={u.role === "superadmin"}
                                  >
                                    Ban User
                                  </Button>
                                  {currentUser?.role === "superadmin" && (
                                    <Button 
                                      variant="destructive" 
                                      className="w-full"
                                      onClick={() => {
                                        if (confirm("Permanently delete this user?")) deleteUserMutation.mutate(u.id);
                                      }}
                                      disabled={u.id === currentUser.id}
                                    >
                                      Delete User (Permanent)
                                    </Button>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Threads Moderation</CardTitle>
                <CardDescription>Review and manage all community posts</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articles.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">{a.title}</TableCell>
                        <TableCell>@{a.author.username}</TableCell>
                        <TableCell className="text-sm">
                          {a.location ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {a.location}</span> : "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => window.open(`/post/${a.id}`, '_blank')}>
                              <Eye className="h-5 w-5" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-destructive"
                              onClick={() => {
                                if (confirm("Delete this thread?")) deleteArticleMutation.mutate(a.id);
                              }}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {showRoleDialog && selectedUser && (
        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Role for @{selectedUser.username}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              {["user", "moderator", "admin", "superadmin"].map((r) => (
                <Button 
                  key={r} 
                  variant={newRole === r ? "default" : "outline"}
                  onClick={() => setNewRole(r)}
                  className="capitalize"
                >
                  {r}
                </Button>
              ))}
            </div>
            <Button 
              className="w-full" 
              onClick={() => roleMutation.mutate({ userId: selectedUser.id, role: newRole })}
              disabled={roleMutation.isPending}
            >
              {roleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Changes"}
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
}

type StatCardProps = {
  title: string;
  value: number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color?: string;
};

type StatusBadgeProps = {
  status?: string | null;
};

function StatCard({ title, value, icon: Icon, color = "text-primary" }: StatCardProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardDescription className="text-xs uppercase font-bold tracking-wider">{title}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="text-2xl font-bold">{value}</div>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "active": return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    case "pending": return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">Pending</Badge>;
    case "banned": return <Badge variant="destructive">Banned</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}
