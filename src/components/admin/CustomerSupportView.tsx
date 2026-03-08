import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  HeadsetIcon,
  ChevronDown,
  RefreshCw,
  Search,
  User,
  Mail,
  Calendar,
  Shield,
  Copy,
  ExternalLink,
  Send,
  Loader2,
  FileText,
  History,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from "date-fns";

type AppRole = "admin" | "user";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  user_id: string;
  role: AppRole;
}

interface ProfileWithRoles extends Profile {
  roles: AppRole[];
}

interface EmailHistoryEntry {
  id: string;
  notification_type: string;
  subject: string | null;
  status: string;
  created_at: string;
  error_message: string | null;
}

const ROLE_COLORS: Record<AppRole, string> = {
  admin: "bg-destructive text-destructive-foreground",
  user: "bg-secondary text-secondary-foreground",
};

interface SupportTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

const SUPPORT_TEMPLATES: SupportTemplate[] = [
  {
    id: "password-reset",
    name: "Password Reset Help",
    subject: "Help with Your Password Reset",
    body: `We received your request for assistance with resetting your password.

To reset your password, please follow these steps:
1. Go to the login page and click "Forgot Password"
2. Enter the email address associated with your account
3. Check your inbox (and spam folder) for the reset link
4. Click the link and create a new secure password

If you continue to experience issues, please reply to this email and we'll help you further.`,
  },
  {
    id: "account-access",
    name: "Account Access Issues",
    subject: "Regarding Your Account Access",
    body: `Thank you for reaching out about your account access concerns.

We've reviewed your account and wanted to provide some guidance:

If you're having trouble logging in:
- Ensure you're using the correct email address
- Try resetting your password using the "Forgot Password" link
- Clear your browser cache and cookies

If you believe your account may have been compromised:
- We recommend changing your password immediately
- Review your recent account activity
- Let us know if you notice anything unusual

Please don't hesitate to reply if you need additional assistance.`,
  },
  {
    id: "welcome",
    name: "Welcome Message",
    subject: "Welcome to Buoyancis",
    body: `Welcome aboard! We're genuinely pleased to have you with us.

Buoyancis was built with a simple idea: that clarity and calm can coexist with ambition. We hope our platform becomes a useful part of your journey.

A few things you might find helpful:
- Take your time exploring the features at your own pace
- Our documentation covers most common questions
- This email is monitored—feel free to reply anytime

There's no rush. We're here when you need us.`,
  },
  {
    id: "feature-request",
    name: "Feature Request Response",
    subject: "Thank You for Your Suggestion",
    body: `Thank you for taking the time to share your thoughts with us.

We read every piece of feedback we receive. Your suggestion has been logged and will be considered as we plan future improvements.

While we can't promise a timeline or guarantee implementation, ideas from our users genuinely shape the direction we take. Many of our best features started as exactly this—a thoughtful note from someone like you.

We appreciate you being part of this.`,
  },
  {
    id: "general-followup",
    name: "General Follow-up",
    subject: "Following Up on Your Recent Inquiry",
    body: `We wanted to follow up on your recent inquiry and ensure everything has been resolved to your satisfaction.

If you have any remaining questions or concerns, please don't hesitate to reach out. We're here to help.

Thank you for your patience and for being part of the Buoyancis community.`,
  },
];

const CustomerSupportView = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profiles, setProfiles] = useState<ProfileWithRoles[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<ProfileWithRoles | null>(null);
  const [emailDialogProfile, setEmailDialogProfile] = useState<ProfileWithRoles | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailHistory, setEmailHistory] = useState<EmailHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEmailHistory = async (userId: string) => {
    setIsLoadingHistory(true);
    setEmailHistory([]);
    setUserEmail(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-email-history`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session?.access_token}`,
          },
          body: JSON.stringify({ targetUserId: userId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch history");
      }

      setEmailHistory(result.history || []);
      setUserEmail(result.email || null);
    } catch (error: any) {
      console.error("Error fetching email history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      // Fetch profiles via admin Edge Function (audited access)
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-profiles`,
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

      const { profiles: profilesData } = await response.json();

      // Fetch all roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const profilesWithRoles: ProfileWithRoles[] = (profilesData || []).map(
        (profile: Profile) => {
          const userRoles = (rolesData || [])
            .filter((r: UserRole) => r.user_id === profile.user_id)
            .map((r: UserRole) => r.role as AppRole);

          return {
            ...profile,
            roles: userRoles,
          };
        }
      );

      setProfiles(profilesWithRoles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast({
        title: "Error",
        description: "Failed to load user profiles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
    }
  }, [isOpen]);

  const filteredProfiles = profiles.filter((profile) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      profile.display_name?.toLowerCase().includes(searchLower) ||
      profile.user_id.toLowerCase().includes(searchLower)
    );
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  const openEmailDialog = (profile: ProfileWithRoles) => {
    setEmailDialogProfile(profile);
    setEmailSubject("");
    setEmailBody("");
  };

  const closeEmailDialog = () => {
    setEmailDialogProfile(null);
    setEmailSubject("");
    setEmailBody("");
  };

  const applyTemplate = (templateId: string) => {
    if (templateId === "blank") {
      setEmailSubject("");
      setEmailBody("");
      return;
    }
    const template = SUPPORT_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setEmailSubject(template.subject);
      setEmailBody(template.body);
    }
  };

  const handleSendEmail = async () => {
    if (!emailDialogProfile || !emailSubject.trim() || !emailBody.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please enter both subject and message",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-support-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session?.access_token}`,
          },
          body: JSON.stringify({
            targetUserId: emailDialogProfile.user_id,
            subject: emailSubject.trim(),
            body: emailBody.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send email");
      }

      toast({
        title: "Email Sent",
        description: `Support email sent to ${emailDialogProfile.display_name || "user"}`,
      });
      closeEmailDialog();
    } catch (error: any) {
      console.error("Error sending support email:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const stats = {
    total: profiles.length,
    admins: profiles.filter((p) => p.roles.includes("admin")).length,
    recent: profiles.filter((p) => {
      const created = parseISO(p.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return created >= weekAgo;
    }).length,
  };

  return (
    <Card className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HeadsetIcon className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Customer Support</CardTitle>
                {profiles.length > 0 && (
                  <Badge variant="secondary">{profiles.length} users</Badge>
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
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold">{stats.total}</div>
                      <div className="text-sm text-muted-foreground">Total Users</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold">{stats.admins}</div>
                      <div className="text-sm text-muted-foreground">Admins</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold">{stats.recent}</div>
                      <div className="text-sm text-muted-foreground">New (7d)</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Search and Refresh */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or user ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={fetchProfiles}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>

                {/* Profiles Table */}
                {filteredProfiles.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
                          <TableHead>User ID</TableHead>
                          <TableHead>Roles</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProfiles.map((profile) => (
                          <TableRow key={profile.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={profile.avatar_url || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(profile.display_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">
                                  {profile.display_name || "Unnamed User"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {profile.user_id.slice(0, 8)}...
                              </code>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {profile.roles.length === 0 ? (
                                  <span className="text-sm text-muted-foreground">—</span>
                                ) : (
                                  profile.roles.map((role) => (
                                    <Badge key={role} className={ROLE_COLORS[role]}>
                                      {role}
                                    </Badge>
                                  ))
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(parseISO(profile.created_at), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedProfile(profile);
                                  fetchEmailHistory(profile.user_id);
                                }}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* Profile Detail Dialog */}
      <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>
              Detailed information for customer support
            </DialogDescription>
          </DialogHeader>
          {selectedProfile && (
            <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="history">
                  <History className="h-4 w-4 mr-2" />
                  Email History
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="flex-1 overflow-auto mt-4">
                <div className="space-y-6">
                  {/* Avatar and Name */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedProfile.avatar_url || undefined} />
                      <AvatarFallback className="text-xl">
                        {getInitials(selectedProfile.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {selectedProfile.display_name || "Unnamed User"}
                      </h3>
                      <div className="flex gap-1 mt-1">
                        {selectedProfile.roles.map((role) => (
                          <Badge key={role} className={ROLE_COLORS[role]}>
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    {userEmail && (
                      <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                        <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-muted-foreground">Email</div>
                          <div className="text-sm break-all">{userEmail}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => copyToClipboard(userEmail, "Email")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-muted-foreground">User ID</div>
                        <div className="font-mono text-sm break-all">
                          {selectedProfile.user_id}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => copyToClipboard(selectedProfile.user_id, "User ID")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm text-muted-foreground">Account Created</div>
                        <div className="text-sm">
                          {format(parseISO(selectedProfile.created_at), "MMMM d, yyyy 'at' h:mm a")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm text-muted-foreground">Last Updated</div>
                        <div className="text-sm">
                          {format(parseISO(selectedProfile.updated_at), "MMMM d, yyyy 'at' h:mm a")}
                        </div>
                      </div>
                    </div>

                    {selectedProfile.roles.length > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                        <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm text-muted-foreground">Assigned Roles</div>
                          <div className="text-sm">
                            {selectedProfile.roles.join(", ")}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Send Email Button */}
                  <div className="pt-4">
                    <Button
                      className="w-full"
                      onClick={() => {
                        setSelectedProfile(null);
                        openEmailDialog(selectedProfile);
                      }}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send Support Email
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="flex-1 overflow-auto mt-4">
                {isLoadingHistory ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : emailHistory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No Emails Sent</p>
                    <p className="text-sm">No email history found for this user</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3 pr-4">
                      {emailHistory.map((entry) => (
                        <div
                          key={entry.id}
                          className="p-3 bg-muted rounded-lg space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {entry.subject || "No subject"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {entry.notification_type.replace(/_/g, " ")}
                              </div>
                            </div>
                            <Badge
                              variant={entry.status === "sent" ? "default" : "destructive"}
                              className="shrink-0"
                            >
                              {entry.status === "sent" ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              {entry.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(parseISO(entry.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </div>
                          {entry.error_message && (
                            <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                              {entry.error_message}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={!!emailDialogProfile} onOpenChange={() => closeEmailDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Support Email</DialogTitle>
            <DialogDescription>
              Send an email to {emailDialogProfile?.display_name || "this user"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select onValueChange={applyTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template or start blank..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blank">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Start Blank
                    </div>
                  </SelectItem>
                  {SUPPORT_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {template.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                placeholder="Enter email subject..."
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-body">Message</Label>
              <Textarea
                id="email-body"
                placeholder="Enter your message..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEmailDialog} disabled={isSendingEmail}>
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isSendingEmail || !emailSubject.trim() || !emailBody.trim()}
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CustomerSupportView;
