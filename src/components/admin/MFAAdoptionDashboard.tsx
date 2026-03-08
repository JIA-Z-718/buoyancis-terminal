import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Fingerprint,
  Key,
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import MFAEnrollmentReminderSettings from "./MFAEnrollmentReminderSettings";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface MFAStats {
  summary: {
    totalAdmins: number;
    adminsWithAnyMfa: number;
    adminsWithTotp: number;
    adminsWithPasskey: number;
    adminsWithBothMethods: number;
    adminsWithoutMfa: number;
    adoptionRate: number;
    totpAdoptionRate: number;
    passkeyAdoptionRate: number;
  };
  admins: Array<{
    userId: string;
    email: string;
    displayName: string;
    createdAt: string;
    lastSignIn: string | null;
    mfa: {
      totpEnrolled: boolean;
      totpFactorCount: number;
      passkeysEnrolled: boolean;
      passkeyCount: number;
      passkeys: Array<{
        id: string;
        friendly_name: string;
        created_at: string;
        last_used_at: string | null;
      }>;
      recoveryCodesRemaining: number;
      hasAnyMfa: boolean;
    };
  }>;
  verificationPatterns: {
    byMethod: Record<string, number>;
    byDay: Array<{ date: string; count: number }>;
    byHour: Array<{ hour: number; count: number }>;
    totalVerifications: number;
    successfulVerifications: number;
    failedVerifications: number;
  };
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

export default function MFAAdoptionDashboard() {
  const [stats, setStats] = useState<MFAStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const { data, error: fnError } = await supabase.functions.invoke("get-mfa-adoption-stats", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setStats(data);
    } catch (err: any) {
      console.error("Error fetching MFA stats:", err);
      setError(err.message || "Failed to load MFA adoption statistics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!stats) return null;

  const { summary, admins, verificationPatterns } = stats;

  // Prepare pie chart data for enrollment distribution
  const enrollmentPieData = [
    { name: "TOTP Only", value: summary.adminsWithTotp - summary.adminsWithBothMethods },
    { name: "Passkey Only", value: summary.adminsWithPasskey - summary.adminsWithBothMethods },
    { name: "Both Methods", value: summary.adminsWithBothMethods },
    { name: "No MFA", value: summary.adminsWithoutMfa },
  ].filter((d) => d.value > 0);

  // Prepare method verification data
  const methodData = Object.entries(verificationPatterns.byMethod).map(([method, count]) => ({
    method: method.charAt(0).toUpperCase() + method.slice(1).replace("_", " "),
    count,
  }));

  // Format hour data for chart
  const hourData = verificationPatterns.byHour.map(({ hour, count }) => ({
    hour: `${hour.toString().padStart(2, "0")}:00`,
    count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">MFA Adoption Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor multi-factor authentication enrollment and usage patterns
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalAdmins}</div>
            <p className="text-xs text-muted-foreground">Active admin accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">MFA Adoption Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.adoptionRate}%</div>
            <Progress value={summary.adoptionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {summary.adminsWithAnyMfa} of {summary.totalAdmins} enrolled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">TOTP Enrolled</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.adminsWithTotp}</div>
            <Progress value={summary.totpAdoptionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{summary.totpAdoptionRate}% of admins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Passkeys Enrolled</CardTitle>
            <Fingerprint className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.adminsWithPasskey}</div>
            <Progress value={summary.passkeyAdoptionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{summary.passkeyAdoptionRate}% of admins</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert for admins without MFA */}
      {summary.adminsWithoutMfa > 0 && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{summary.adminsWithoutMfa} admin{summary.adminsWithoutMfa > 1 ? "s" : ""}</strong> do not have MFA enabled.
            This poses a security risk to your application.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Tabs */}
      <Tabs defaultValue="admins" className="w-full">
        <TabsList>
          <TabsTrigger value="admins" className="gap-2">
            <Users className="h-4 w-4" />
            Admin Status
          </TabsTrigger>
          <TabsTrigger value="patterns" className="gap-2">
            <Clock className="h-4 w-4" />
            Verification Patterns
          </TabsTrigger>
          <TabsTrigger value="distribution" className="gap-2">
            <Shield className="h-4 w-4" />
            Method Distribution
          </TabsTrigger>
          <TabsTrigger value="reminders" className="gap-2">
            <Bell className="h-4 w-4" />
            Reminders
          </TabsTrigger>
        </TabsList>

        {/* Admin Status Tab */}
        <TabsContent value="admins" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin MFA Status</CardTitle>
              <CardDescription>Detailed view of each admin's MFA enrollment</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>MFA Status</TableHead>
                    <TableHead>TOTP</TableHead>
                    <TableHead>Passkeys</TableHead>
                    <TableHead>Recovery Codes</TableHead>
                    <TableHead>Last Sign In</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.userId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{admin.displayName}</p>
                          <p className="text-xs text-muted-foreground">{admin.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {admin.mfa.hasAnyMfa ? (
                          <Badge variant="default" className="gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Protected
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <ShieldOff className="h-3 w-3" />
                            At Risk
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {admin.mfa.totpEnrolled ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm">Enrolled</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm">Not set</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {admin.mfa.passkeyCount > 0 ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <Fingerprint className="h-4 w-4" />
                            <span className="text-sm">{admin.mfa.passkeyCount} registered</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm">None</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {admin.mfa.recoveryCodesRemaining > 0 ? (
                          <div className="flex items-center gap-1">
                            <Key className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{admin.mfa.recoveryCodesRemaining} remaining</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {admin.lastSignIn
                            ? new Date(admin.lastSignIn).toLocaleDateString()
                            : "Never"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verification Patterns Tab */}
        <TabsContent value="patterns" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Verification by Day */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Verifications Over Time</CardTitle>
                <CardDescription>Last 30 days of MFA verifications</CardDescription>
              </CardHeader>
              <CardContent>
                {verificationPatterns.byDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={verificationPatterns.byDay}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No verification data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verification by Hour */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Peak Usage Hours</CardTitle>
                <CardDescription>When admins verify most often</CardDescription>
              </CardHeader>
              <CardContent>
                {hourData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={hourData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No verification data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verification Summary */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Verification Summary</CardTitle>
                <CardDescription>Last 30 days statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-3xl font-bold">{verificationPatterns.totalVerifications}</div>
                    <p className="text-sm text-muted-foreground">Total Verifications</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-green-500/10">
                    <div className="text-3xl font-bold text-green-600">
                      {verificationPatterns.successfulVerifications}
                    </div>
                    <p className="text-sm text-muted-foreground">Successful</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-red-500/10">
                    <div className="text-3xl font-bold text-red-600">
                      {verificationPatterns.failedVerifications}
                    </div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Method Distribution Tab */}
        <TabsContent value="patterns" className="hidden" />
        <TabsContent value="distribution" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Enrollment Distribution Pie */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Enrollment Distribution</CardTitle>
                <CardDescription>How admins are protected</CardDescription>
              </CardHeader>
              <CardContent>
                {enrollmentPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={enrollmentPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {enrollmentPieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No enrollment data
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verification by Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Verifications by Method</CardTitle>
                <CardDescription>Which methods are used most</CardDescription>
              </CardHeader>
              <CardContent>
                {methodData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={methodData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="method" tick={{ fontSize: 12 }} width={100} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No verification data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reminders Tab */}
        <TabsContent value="reminders" className="mt-4">
          <MFAEnrollmentReminderSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
