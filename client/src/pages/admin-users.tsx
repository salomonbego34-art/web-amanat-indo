import { useState } from "react";
import { Layout } from "@/components/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Ban,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDisplayName } from "@/lib/amanat";
import { SmartBackButton } from "@/components/smart-back-button";

type AdminUser = {
  id: string;
  username: string;
  name?: string | null;
  nama?: string | null;
  role: "user" | "moderator" | "admin" | "superadmin";
  accountStatus?: "pending" | "active" | "banned";
  status?: "pending" | "active" | "banned";
  isBanned?: boolean;
  createdAt?: string | number | Date | null;
};

function getAccessLevel(user: AdminUser): "pending" | "active" | "moderator" | "admin" {
  if (user.role === "admin") return "admin";
  if (user.role === "moderator") return "moderator";
  return (user.accountStatus ?? user.status) === "pending" ? "pending" : "active";
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    }
  });

  const statusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: "pending" | "active" | "moderator" | "admin" }) => {
      await apiRequest("PUT", `/api/admin/user/${userId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User access updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update user access", description: error.message, variant: "destructive" });
    },
  });

  const banMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("POST", `/api/admin/user/${userId}/ban`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User banned successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to ban user", description: error.message, variant: "destructive" });
    },
  });

  const filteredUsers = users.filter((u) =>
    (u.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (getDisplayName(u) || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <SmartBackButton fallback="/admin" label="Kembali" className="mb-3 rounded-xl" />
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Approve, moderate, and manage user roles</p>
          </div>
        </div>

        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or username..."
              className="pl-9 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card className="border-border/50 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Access</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Loading users...</TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">No users found</TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-bold">{getDisplayName(user)}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isBanned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Select
                          disabled={statusMutation.isPending || (user.role === "superadmin" && currentUser?.role !== "superadmin")}
                          value={getAccessLevel(user)}
                          onValueChange={(value: "pending" | "active" | "moderator" | "admin") =>
                            statusMutation.mutate({ userId: user.id, status: value })
                          }
                        >
                          <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                            <SelectItem value="admin" disabled={currentUser?.role !== "superadmin"}>
                              Admin
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {!user.isBanned && user.role !== "superadmin" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-destructive hover:bg-destructive/10"
                          onClick={() => banMutation.mutate(user.id)}
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </Layout>
  );
}
