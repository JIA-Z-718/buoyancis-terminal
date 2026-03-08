import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, MousePointerClick, ExternalLink, FlaskConical, Trophy, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import EditABVariantDialog from "./EditABVariantDialog";

interface CampaignDetailDialogProps {
  campaignId: string | null;
  campaignSubject: string;
  onClose: () => void;
}

interface OpenRecord {
  id: string;
  recipient_email: string;
  opened_at: string;
  user_agent: string | null;
  variant: string | null;
}

interface ClickRecord {
  id: string;
  recipient_email: string;
  original_url: string;
  clicked_at: string;
  user_agent: string | null;
  variant: string | null;
}

interface ABVariant {
  id: string;
  variant_name: string;
  subject: string;
  recipient_count: number;
}

interface VariantStats {
  name: string;
  subject: string;
  recipientCount: number;
  opens: number;
  clicks: number;
  openRate: number;
  clickRate: number;
}

const CampaignDetailDialog = ({ campaignId, campaignSubject, onClose }: CampaignDetailDialogProps) => {
  const [opens, setOpens] = useState<OpenRecord[]>([]);
  const [clicks, setClicks] = useState<ClickRecord[]>([]);
  const [variants, setVariants] = useState<ABVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingVariant, setEditingVariant] = useState<ABVariant | null>(null);

  useEffect(() => {
    if (campaignId) {
      fetchDetails();
    }
  }, [campaignId]);

  const fetchDetails = async () => {
    if (!campaignId) return;
    
    setIsLoading(true);

    const [opensResult, clicksResult, variantsResult] = await Promise.all([
      supabase
        .from("email_opens")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("opened_at", { ascending: false }),
      supabase
        .from("email_clicks")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("clicked_at", { ascending: false }),
      supabase
        .from("ab_test_variants")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("variant_name", { ascending: true }),
    ]);

    setOpens(opensResult.data || []);
    setClicks(clicksResult.data || []);
    setVariants(variantsResult.data || []);
    setIsLoading(false);
  };

  const truncateUrl = (url: string, maxLength = 40) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + "...";
  };

  const getDeviceFromUserAgent = (ua: string | null) => {
    if (!ua) return "Unknown";
    if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")) return "Mobile";
    if (ua.includes("Tablet") || ua.includes("iPad")) return "Tablet";
    return "Desktop";
  };

  const hasABTest = variants.length >= 2;

  // Calculate variant stats
  const variantStats: VariantStats[] = hasABTest
    ? variants.map((v) => {
        const variantOpens = opens.filter((o) => o.variant === v.variant_name).length;
        const variantClicks = new Set(
          clicks.filter((c) => c.variant === v.variant_name).map((c) => c.recipient_email)
        ).size;
        return {
          name: v.variant_name,
          subject: v.subject,
          recipientCount: v.recipient_count,
          opens: variantOpens,
          clicks: variantClicks,
          openRate: v.recipient_count > 0 ? Math.round((variantOpens / v.recipient_count) * 100) : 0,
          clickRate: v.recipient_count > 0 ? Math.round((variantClicks / v.recipient_count) * 100) : 0,
        };
      })
    : [];

  const winningVariant = variantStats.length > 0
    ? variantStats.reduce((best, current) => 
        current.openRate > best.openRate ? current : best
      )
    : null;

  return (
    <Dialog open={!!campaignId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="pr-8 flex items-center gap-2">
            Campaign Details
            {hasABTest && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <FlaskConical className="h-3 w-3" />
                A/B Test
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="truncate">
            {campaignSubject}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={hasABTest ? "variants" : "opens"} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full justify-start">
            {hasABTest && (
              <TabsTrigger value="variants" className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4" />
                A/B Results
              </TabsTrigger>
            )}
            <TabsTrigger value="opens" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Opens ({opens.length})
            </TabsTrigger>
            <TabsTrigger value="clicks" className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />
              Clicks ({clicks.length})
            </TabsTrigger>
          </TabsList>

          {/* A/B Test Results Tab */}
          {hasABTest && (
            <TabsContent value="variants" className="flex-1 overflow-auto mt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {variantStats.map((stat) => {
                      const variantData = variants.find(v => v.variant_name === stat.name);
                      return (
                        <Card
                          key={stat.name}
                          className={
                            winningVariant?.name === stat.name && stat.openRate > 0
                              ? "border-green-500 bg-green-50/50"
                              : ""
                          }
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-lg font-semibold px-3">
                                  {stat.name}
                                </Badge>
                                {winningVariant?.name === stat.name && stat.openRate > 0 && (
                                  <Badge className="bg-green-600 text-white flex items-center gap-1">
                                    <Trophy className="h-3 w-3" />
                                    Winner
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {stat.recipientCount} recipients
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => variantData && setEditingVariant(variantData)}
                                  title="Edit variant"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <p className="text-sm font-medium mb-4 text-foreground">
                              "{stat.subject}"
                            </p>

                            <div className="grid grid-cols-4 gap-4 text-center">
                              <div>
                                <p className="text-2xl font-bold">{stat.opens}</p>
                                <p className="text-xs text-muted-foreground">Opens</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-blue-600">{stat.openRate}%</p>
                                <p className="text-xs text-muted-foreground">Open Rate</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold">{stat.clicks}</p>
                                <p className="text-xs text-muted-foreground">Clicks</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-green-600">{stat.clickRate}%</p>
                                <p className="text-xs text-muted-foreground">Click Rate</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {variantStats.length >= 2 && (
                    <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                      <strong>Analysis:</strong> Variant {winningVariant?.name} has the highest open rate at{" "}
                      {winningVariant?.openRate}%. Consider using this subject line for future campaigns.
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="opens" className="flex-1 overflow-auto mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))}
              </div>
            ) : opens.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No opens recorded yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Opened At</TableHead>
                    <TableHead>Device</TableHead>
                    {hasABTest && <TableHead>Variant</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {opens.map((open) => (
                    <TableRow key={open.id}>
                      <TableCell className="font-medium">{open.recipient_email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(open.opened_at), "MMM d, yyyy 'at' h:mm a")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {getDeviceFromUserAgent(open.user_agent)}
                        </Badge>
                      </TableCell>
                      {hasABTest && (
                        <TableCell>
                          <Badge variant="outline">{open.variant || "A"}</Badge>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="clicks" className="flex-1 overflow-auto mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-5 w-64" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                ))}
              </div>
            ) : clicks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MousePointerClick className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No clicks recorded yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Link Clicked</TableHead>
                    <TableHead>Clicked At</TableHead>
                    {hasABTest && <TableHead>Variant</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clicks.map((click) => (
                    <TableRow key={click.id}>
                      <TableCell className="font-medium">{click.recipient_email}</TableCell>
                      <TableCell>
                        <a
                          href={click.original_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline max-w-[200px]"
                        >
                          <span className="truncate">{truncateUrl(click.original_url)}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(click.clicked_at), "MMM d, yyyy 'at' h:mm a")}
                      </TableCell>
                      {hasABTest && (
                        <TableCell>
                          <Badge variant="outline">{click.variant || "A"}</Badge>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>

        <EditABVariantDialog
          variant={editingVariant}
          onClose={() => setEditingVariant(null)}
          onSaved={fetchDetails}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CampaignDetailDialog;
