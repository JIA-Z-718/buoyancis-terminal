import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShieldBan, Plus, ShieldOff, Search, AlertCircle, Download, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format, parseISO } from "date-fns";

interface BlockedIp {
  id: string;
  ip_address: string;
  reason: string | null;
  blocked_by: string | null;
  created_at: string;
}

// Basic IPv4/IPv6 validation regex
const IP_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$/;

const IpBlocklistManager = () => {
  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newIpAddress, setNewIpAddress] = useState("");
  const [newReason, setNewReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ipError, setIpError] = useState<string | null>(null);
  const [unblockTarget, setUnblockTarget] = useState<BlockedIp | null>(null);
  const [isUnblocking, setIsUnblocking] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkUnblockDialog, setShowBulkUnblockDialog] = useState(false);
  const [isBulkUnblocking, setIsBulkUnblocking] = useState(false);
  const { toast } = useToast();

  const fetchBlockedIps = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("ip_blocklist")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching blocked IPs:", error);
      toast({
        title: "Error",
        description: "Failed to load blocked IPs",
        variant: "destructive",
      });
    } else {
      setBlockedIps(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBlockedIps();
  }, []);

  const validateIpAddress = (ip: string): boolean => {
    const trimmed = ip.trim();
    if (!trimmed) {
      setIpError("IP address is required");
      return false;
    }
    if (!IP_REGEX.test(trimmed)) {
      setIpError("Please enter a valid IPv4 or IPv6 address");
      return false;
    }
    if (blockedIps.some((b) => b.ip_address === trimmed)) {
      setIpError("This IP address is already blocked");
      return false;
    }
    setIpError(null);
    return true;
  };

  const handleAddIp = async () => {
    const trimmedIp = newIpAddress.trim();
    
    if (!validateIpAddress(trimmedIp)) {
      return;
    }

    setIsSubmitting(true);

    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from("ip_blocklist").insert({
      ip_address: trimmedIp,
      reason: newReason.trim() || null,
      blocked_by: userData?.user?.id || null,
    });

    if (error) {
      console.error("Error adding IP to blocklist:", error);
      toast({
        title: "Error",
        description: error.code === "23505" ? "This IP is already blocked" : "Failed to add IP to blocklist",
        variant: "destructive",
      });
    } else {
      toast({
        title: "IP blocked",
        description: `${trimmedIp} has been added to the blocklist`,
      });
      setNewIpAddress("");
      setNewReason("");
      setIsAddDialogOpen(false);
      fetchBlockedIps();
    }

    setIsSubmitting(false);
  };

  const handleRemoveIp = async (blockedIp: BlockedIp) => {
    setIsUnblocking(true);
    const { error } = await supabase.from("ip_blocklist").delete().eq("id", blockedIp.id);

    if (error) {
      console.error("Error removing IP from blocklist:", error);
      toast({
        title: "Error",
        description: "Failed to remove IP from blocklist",
        variant: "destructive",
      });
    } else {
      toast({
        title: "IP unblocked",
        description: `${blockedIp.ip_address} has been removed from the blocklist`,
      });
      setBlockedIps((prev) => prev.filter((ip) => ip.id !== blockedIp.id));
    }
    setIsUnblocking(false);
    setUnblockTarget(null);
  };

  const handleBulkUnblock = async () => {
    if (selectedIds.size === 0) return;
    
    setIsBulkUnblocking(true);
    const idsToDelete = Array.from(selectedIds);
    
    const { error } = await supabase
      .from("ip_blocklist")
      .delete()
      .in("id", idsToDelete);

    if (error) {
      console.error("Error bulk removing IPs:", error);
      toast({
        title: "Error",
        description: "Failed to remove some IPs from blocklist",
        variant: "destructive",
      });
    } else {
      toast({
        title: "IPs unblocked",
        description: `${idsToDelete.length} IP${idsToDelete.length !== 1 ? "s have" : " has"} been removed from the blocklist`,
      });
      setBlockedIps((prev) => prev.filter((ip) => !selectedIds.has(ip.id)));
      setSelectedIds(new Set());
    }
    setIsBulkUnblocking(false);
    setShowBulkUnblockDialog(false);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredIps.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIps.map((ip) => ip.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const exportToCSV = () => {
    if (blockedIps.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no blocked IPs to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["IP Address", "Reason", "Blocked At"];
    const rows = blockedIps.map((ip) => [
      ip.ip_address,
      ip.reason || "",
      format(parseISO(ip.created_at), "yyyy-MM-dd HH:mm:ss"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ip-blocklist-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    toast({
      title: "Export complete",
      description: `Exported ${blockedIps.length} blocked IP${blockedIps.length !== 1 ? "s" : ""} to CSV`,
    });
  };

  const filteredIps = blockedIps.filter(
    (ip) =>
      ip.ip_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ip.reason && ip.reason.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldBan className="w-5 h-5" />
            IP Blocklist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldBan className="w-5 h-5" />
              IP Blocklist
            </CardTitle>
            <CardDescription>
              Permanently block IP addresses from signing up
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={blockedIps.length === 0}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Block IP
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Block IP Address</DialogTitle>
                <DialogDescription>
                  Add an IP address to the blocklist. Requests from this IP will be silently rejected.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="ip-address" className="text-sm font-medium">
                    IP Address
                  </label>
                  <Input
                    id="ip-address"
                    placeholder="e.g., 192.168.1.1 or 2001:0db8::1"
                    value={newIpAddress}
                    onChange={(e) => {
                      setNewIpAddress(e.target.value);
                      if (ipError) setIpError(null);
                    }}
                    className={ipError ? "border-destructive" : ""}
                  />
                  {ipError && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {ipError}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="reason" className="text-sm font-medium">
                    Reason (optional)
                  </label>
                  <Textarea
                    id="reason"
                    placeholder="Why is this IP being blocked?"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddIp} disabled={isSubmitting}>
                  {isSubmitting ? "Blocking..." : "Block IP"}
                </Button>
              </DialogFooter>
            </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by IP or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats and Bulk Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{blockedIps.length} blocked IP{blockedIps.length !== 1 ? "s" : ""}</span>
            {searchQuery && (
              <span>• {filteredIps.length} matching</span>
            )}
            {selectedIds.size > 0 && (
              <span className="text-primary font-medium">• {selectedIds.size} selected</span>
            )}
          </div>
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkUnblockDialog(true)}
              className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 hover:border-green-300 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950 dark:hover:text-green-300"
            >
              <Trash2 className="w-4 h-4" />
              Unblock {selectedIds.size} IP{selectedIds.size !== 1 ? "s" : ""}
            </Button>
          )}
        </div>

        {/* Table */}
        {filteredIps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? (
              <p>No IPs match your search</p>
            ) : (
              <p>No IPs have been blocked yet</p>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={filteredIps.length > 0 && selectedIds.size === filteredIps.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Blocked At</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIps.map((ip) => (
                  <TableRow key={ip.id} className={selectedIds.has(ip.id) ? "bg-muted/50" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(ip.id)}
                        onCheckedChange={() => toggleSelect(ip.id)}
                        aria-label={`Select ${ip.ip_address}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {ip.ip_address}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {ip.reason || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(parseISO(ip.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUnblockTarget(ip)}
                            className="h-7 gap-1.5 text-xs text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 hover:border-green-300 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950 dark:hover:text-green-300"
                          >
                            <ShieldOff className="w-3.5 h-3.5" />
                            Unblock
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Remove from blocklist</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Unblock Confirmation Dialog */}
      <AlertDialog open={!!unblockTarget} onOpenChange={(open) => !open && setUnblockTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock IP Address?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unblock{" "}
              <span className="font-mono font-medium text-foreground">{unblockTarget?.ip_address}</span>?
              {unblockTarget?.reason && (
                <span className="block mt-2 text-sm">
                  <span className="font-medium">Reason for block:</span> {unblockTarget.reason}
                </span>
              )}
              <span className="block mt-2">
                This IP will be able to sign up again immediately.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnblocking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unblockTarget && handleRemoveIp(unblockTarget)}
              disabled={isUnblocking}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUnblocking ? "Unblocking..." : "Unblock IP"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Unblock Confirmation Dialog */}
      <AlertDialog open={showBulkUnblockDialog} onOpenChange={setShowBulkUnblockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock {selectedIds.size} IP Address{selectedIds.size !== 1 ? "es" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unblock the following IP addresses?
              <span className="block mt-2 max-h-32 overflow-y-auto rounded bg-muted p-2 font-mono text-xs">
                {Array.from(selectedIds).map((id) => {
                  const ip = blockedIps.find((b) => b.id === id);
                  return ip?.ip_address;
                }).filter(Boolean).join(", ")}
              </span>
              <span className="block mt-2">
                These IPs will be able to sign up again immediately.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkUnblocking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkUnblock}
              disabled={isBulkUnblocking}
              className="bg-green-600 hover:bg-green-700"
            >
              {isBulkUnblocking ? "Unblocking..." : `Unblock ${selectedIds.size} IP${selectedIds.size !== 1 ? "s" : ""}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default IpBlocklistManager;
