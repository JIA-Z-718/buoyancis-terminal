import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  Shield,
  ShieldCheck,
  ChevronDown,
  RefreshCw,
  Plus,
  Trash2,
  Search,
  UserCog,
  History,
  Download,
  Calendar,
  X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

type AppRole = "admin" | "user";

interface UserWithRoles {
  user_id: string;
  display_name: string | null;
  roles: AppRole[];
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

interface Profile {
  user_id: string;
  display_name: string | null;
  created_at: string;
}

interface AuditLogEntry {
  id: string;
  user_id: string;
  target_user_id: string;
  action: "assigned" | "revoked";
  role: AppRole;
  created_at: string;
  actor_name?: string;
  target_name?: string;
}

const ROLE_CONFIG: Record<AppRole, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: "Admin", icon: ShieldCheck, color: "bg-destructive text-destructive-foreground" },
  user: { label: "User", icon: Users, color: "bg-secondary text-secondary-foreground" },
};

const UserRoleManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("user");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: string; role: AppRole } | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const fetchAdminProfiles = async (): Promise<Profile[]> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-profiles?fields=user_id,display_name,created_at`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      }
    );

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || "Failed to fetch profiles");
    }

    const { profiles } = await response.json();
    return profiles || [];
  };

  const fetchAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const { data: logs, error: logsError } = await supabase
        .from("role_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (logsError) throw logsError;

      // Fetch profiles via admin Edge Function (audited access)
      const profiles = await fetchAdminProfiles();

      const profileMap = new Map(
        profiles.map((p: Profile) => [p.user_id, p.display_name])
      );

      const logsWithNames = (logs || []).map((log: AuditLogEntry) => ({
        ...log,
        actor_name: profileMap.get(log.user_id) || "Unknown",
        target_name: profileMap.get(log.target_user_id) || "Unknown",
      }));

      setAuditLogs(logsWithNames);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const logRoleChange = async (targetUserId: string, role: AppRole, action: "assigned" | "revoked") => {
    if (!currentUser?.id) return;
    try {
      await supabase.from("role_audit_log").insert({
        user_id: currentUser.id,
        target_user_id: targetUserId,
        action,
        role,
      });

      // Send email notification for admin role changes
      if (role === "admin") {
        const targetUser = users.find((u) => u.user_id === targetUserId);
        const { data: actorProfile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        const { data: sessionData } = await supabase.auth.getSession();
        
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-admin-role-change`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session?.access_token}`,
          },
          body: JSON.stringify({
            targetUserId,
            targetUserName: targetUser?.display_name || "Unknown User",
            action,
            role,
            actorName: actorProfile?.display_name || "Admin",
          }),
        }).catch((err) => console.error("Failed to send admin role notification:", err));
      }
    } catch (error) {
      console.error("Error logging role change:", error);
    }
  };

  const filteredAuditLogs = auditLogs.filter((log) => {
    const logDate = parseISO(log.created_at);
    if (dateFrom && dateTo) {
      return isWithinInterval(logDate, {
        start: startOfDay(dateFrom),
        end: endOfDay(dateTo),
      });
    }
    if (dateFrom) {
      return logDate >= startOfDay(dateFrom);
    }
    if (dateTo) {
      return logDate <= endOfDay(dateTo);
    }
    return true;
  });

  const clearDateFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const exportAuditLogToCsv = () => {
    if (filteredAuditLogs.length === 0) {
      toast({
        title: "No Data",
        description: "There are no audit logs to export",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Date", "Action", "Role", "Target User", "Changed By", "Target User ID", "Actor User ID"];
    const rows = filteredAuditLogs.map((log) => [
      format(parseISO(log.created_at), "yyyy-MM-dd HH:mm:ss"),
      log.action,
      log.role,
      log.target_name || "Unknown",
      log.actor_name || "Unknown",
      log.target_user_id,
      log.user_id,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateRangeSuffix = dateFrom || dateTo 
      ? `-${dateFrom ? format(dateFrom, "yyyyMMdd") : "start"}-to-${dateTo ? format(dateTo, "yyyyMMdd") : "now"}`
      : "";
    link.download = `role-audit-log${dateRangeSuffix}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${filteredAuditLogs.length} audit log entries`,
    });
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch profiles via admin Edge Function (audited access)
      const profiles = await fetchAdminProfiles();

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles: UserWithRoles[] = profiles.map((profile: Profile) => {
        const userRoles = (roles || [])
          .filter((r: UserRole) => r.user_id === profile.user_id)
          .map((r: UserRole) => r.role as AppRole);
        
        return {
          user_id: profile.user_id,
          display_name: profile.display_name,
          roles: userRoles,
          created_at: profile.created_at,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users and roles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchAuditLogs();
    }
  }, [isOpen]);

  const handleAddRole = async () => {
    if (!selectedUserId || !selectedRole) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: selectedUserId,
          role: selectedRole,
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Role Already Exists",
            description: "This user already has this role",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        await logRoleChange(selectedUserId, selectedRole, "assigned");
        toast({
          title: "Role Assigned",
          description: `Successfully assigned ${selectedRole} role`,
        });
        setIsAddDialogOpen(false);
        setSelectedUserId(null);
        setSelectedRole("user");
        fetchUsers();
        fetchAuditLogs();
      }
    } catch (error) {
      console.error("Error adding role:", error);
      toast({
        title: "Error",
        description: "Failed to assign role",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    // Prevent removing your own admin role
    if (userId === currentUser?.id && role === "admin") {
      toast({
        title: "Cannot Remove",
        description: "You cannot remove your own admin role",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;

      await logRoleChange(userId, role, "revoked");
      toast({
        title: "Role Removed",
        description: `Successfully removed ${role} role`,
      });
      setDeleteConfirm(null);
      fetchUsers();
      fetchAuditLogs();
    } catch (error) {
      console.error("Error removing role:", error);
      toast({
        title: "Error",
        description: "Failed to remove role",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.display_name?.toLowerCase().includes(searchLower) ||
      user.user_id.toLowerCase().includes(searchLower) ||
      user.roles.some((r) => r.toLowerCase().includes(searchLower))
    );
  });

  const usersWithoutSelectedRole = users.filter(
    (u) => !u.roles.includes(selectedRole)
  );

  return (
    <Card className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCog className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">User Role Management</CardTitle>
                {users.length > 0 && (
                  <Badge variant="secondary">{users.length} users</Badge>
                )}
              </div>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="users">Users & Roles</TabsTrigger>
                <TabsTrigger value="audit">
                  <History className="h-4 w-4 mr-2" />
                  Audit Log
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="users" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <>
                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchUsers}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setIsAddDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Assign Role
                    </Button>
                  </div>
                </div>

                {/* Users Table */}
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No Users Found</p>
                    <p className="text-sm">
                      {searchQuery
                        ? "No users match your search"
                        : "No user profiles exist yet"}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Roles</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.user_id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {user.display_name || "Unnamed User"}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  {user.user_id.slice(0, 8)}...
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {user.roles.length === 0 ? (
                                  <span className="text-sm text-muted-foreground">
                                    No roles
                                  </span>
                                ) : (
                                  user.roles.map((role) => {
                                    const config = ROLE_CONFIG[role];
                                    const Icon = config.icon;
                                    return (
                                      <Badge
                                        key={role}
                                        className={`${config.color} gap-1`}
                                      >
                                        <Icon className="h-3 w-3" />
                                        {config.label}
                                      </Badge>
                                    );
                                  })
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(parseISO(user.created_at), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {user.roles.map((role) => (
                                  <Button
                                    key={role}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    onClick={() =>
                                      setDeleteConfirm({ userId: user.user_id, role })
                                    }
                                    disabled={
                                      user.user_id === currentUser?.id && role === "admin"
                                    }
                                    title={
                                      user.user_id === currentUser?.id && role === "admin"
                                        ? "Cannot remove your own admin role"
                                        : `Remove ${role} role`
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Role Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  {(["admin", "user"] as AppRole[]).map((role) => {
                    const config = ROLE_CONFIG[role];
                    const count = users.filter((u) => u.roles.includes(role)).length;
                    const Icon = config.icon;
                    return (
                      <Card key={role}>
                        <CardContent className="pt-4 flex items-center gap-3">
                          <div className={`p-2 rounded-md ${config.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold">{count}</div>
                            <div className="text-sm text-muted-foreground">
                              {config.label}s
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
              </TabsContent>
              
              <TabsContent value="audit" className="space-y-4 mt-4">
                {/* Date Filter and Export */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                  <div className="flex flex-wrap gap-2 items-center">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Calendar className="h-4 w-4" />
                          {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          disabled={(date) => dateTo ? date > dateTo : false}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <span className="text-muted-foreground text-sm">to</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Calendar className="h-4 w-4" />
                          {dateTo ? format(dateTo, "MMM d, yyyy") : "To"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          disabled={(date) => dateFrom ? date < dateFrom : false}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {(dateFrom || dateTo) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearDateFilters}
                        className="gap-1 text-muted-foreground"
                      >
                        <X className="h-4 w-4" />
                        Clear
                      </Button>
                    )}
                  </div>
                  {filteredAuditLogs.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {filteredAuditLogs.length} {filteredAuditLogs.length === 1 ? "entry" : "entries"}
                      </span>
                      <Button variant="outline" size="sm" onClick={exportAuditLogToCsv}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  )}
                </div>
                
                {isLoadingLogs ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-64 w-full" />
                  </div>
                ) : filteredAuditLogs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">
                      {dateFrom || dateTo ? "No Results" : "No Activity Yet"}
                    </p>
                    <p className="text-sm">
                      {dateFrom || dateTo
                        ? "No role changes found in the selected date range"
                        : "Role changes will be logged here"}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Action</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Target User</TableHead>
                          <TableHead>Changed By</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAuditLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <Badge
                                variant={log.action === "assigned" ? "default" : "destructive"}
                              >
                                {log.action === "assigned" ? "Assigned" : "Revoked"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={ROLE_CONFIG[log.role]?.color || ""}>
                                {ROLE_CONFIG[log.role]?.label || log.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {log.target_name || "Unknown User"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {log.actor_name || "Unknown"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(parseISO(log.created_at), "MMM d, yyyy h:mm a")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* Add Role Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
            <DialogDescription>
              Select a user and the role you want to assign.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={selectedRole}
                onValueChange={(value) => {
                  setSelectedRole(value as AppRole);
                  setSelectedUserId(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {(["admin", "user"] as AppRole[]).map((role) => {
                    const config = ROLE_CONFIG[role];
                    const Icon = config.icon;
                    return (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">User</label>
              <Select
                value={selectedUserId || ""}
                onValueChange={setSelectedUserId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {usersWithoutSelectedRole.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      All users already have this role
                    </div>
                  ) : (
                    usersWithoutSelectedRole.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.display_name || `User ${user.user_id.slice(0, 8)}...`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddRole}
              disabled={!selectedUserId || isSubmitting}
            >
              {isSubmitting ? "Assigning..." : "Assign Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the{" "}
              <strong>{deleteConfirm?.role}</strong> role from this user? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteConfirm &&
                handleRemoveRole(deleteConfirm.userId, deleteConfirm.role)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Removing..." : "Remove Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default UserRoleManager;
