import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Mail, Eye, MousePointerClick, ChevronDown, ChevronUp, Trash2, Loader2, ExternalLink, Download, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import CampaignDetailDialog from "./CampaignDetailDialog";
import EditEmailCampaignDialog from "./EditEmailCampaignDialog";

interface Campaign {
  id: string;
  subject: string;
  body: string;
  recipient_count: number;
  sent_at: string;
  open_count: number;
  click_count: number;
  unique_clickers: number;
}

const CampaignAnalytics = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const { toast } = useToast();

  const fetchCampaigns = async () => {
    setIsLoading(true);
    
    // Fetch campaigns
    const { data: campaignsData, error: campaignsError } = await supabase
      .from("email_campaigns")
      .select("*")
      .order("sent_at", { ascending: false });

    if (campaignsError) {
      console.error("Error fetching campaigns:", campaignsError);
      toast({
        title: "Error loading campaigns",
        description: campaignsError.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Fetch open and click counts for each campaign
    const campaignsWithStats = await Promise.all(
      (campaignsData || []).map(async (campaign) => {
        // Get open count
        const { count: openCount } = await supabase
          .from("email_opens")
          .select("*", { count: "exact", head: true })
          .eq("campaign_id", campaign.id);

        // Get total click count
        const { count: clickCount } = await supabase
          .from("email_clicks")
          .select("*", { count: "exact", head: true })
          .eq("campaign_id", campaign.id);

        // Get unique clickers (distinct recipients who clicked)
        const { data: uniqueClicks } = await supabase
          .from("email_clicks")
          .select("recipient_email")
          .eq("campaign_id", campaign.id);
        
        const uniqueClickers = new Set(uniqueClicks?.map(c => c.recipient_email) || []).size;

        return {
          ...campaign,
          open_count: openCount || 0,
          click_count: clickCount || 0,
          unique_clickers: uniqueClickers,
        };
      })
    );

    setCampaigns(campaignsWithStats);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    
    const { error } = await supabase
      .from("email_campaigns")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error deleting campaign",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setCampaigns(campaigns.filter((c) => c.id !== id));
      toast({
        title: "Campaign deleted",
        description: "The campaign and its analytics have been removed.",
      });
    }
    
    setDeletingId(null);
  };

  const getRate = (count: number, recipients: number) => {
    if (recipients === 0) return 0;
    return Math.round((count / recipients) * 100);
  };

  const handleExportCSV = () => {
    if (campaigns.length === 0) return;

    const headers = ["Subject", "Sent", "Opens", "Open Rate (%)", "Clicks", "Click Rate (%)", "Date"];
    const rows = campaigns.map((c) => [
      `"${c.subject.replace(/"/g, '""')}"`,
      c.recipient_count,
      c.open_count,
      getRate(c.open_count, c.recipient_count),
      c.click_count,
      getRate(c.unique_clickers, c.recipient_count),
      format(new Date(c.sent_at), "yyyy-MM-dd HH:mm:ss"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `campaign-analytics-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: `Downloaded analytics for ${campaigns.length} campaign${campaigns.length !== 1 ? "s" : ""}.`,
    });
  };

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Email Campaign Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Email Campaign Analytics
          </CardTitle>
          <div className="flex items-center gap-2">
            {campaigns.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="text-muted-foreground"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(!isVisible)}
              className="text-muted-foreground"
            >
              {isVisible ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Expand
                </>
              )}
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Track open and click rates for your bulk email campaigns
        </p>
      </CardHeader>

      {isVisible && (
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No campaigns sent yet</p>
              <p className="text-sm">Send a bulk email to see analytics here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-center">Sent</TableHead>
                  <TableHead className="text-center">Opens</TableHead>
                  <TableHead className="text-center">Open Rate</TableHead>
                  <TableHead className="text-center">Clicks</TableHead>
                  <TableHead className="text-center">Click Rate</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => {
                  const openRate = getRate(campaign.open_count, campaign.recipient_count);
                  const clickRate = getRate(campaign.unique_clickers, campaign.recipient_count);
                  return (
                    <TableRow 
                      key={campaign.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedCampaign(campaign)}
                    >
                      <TableCell className="font-medium max-w-[180px] truncate">
                        <div className="flex items-center gap-1">
                          {campaign.subject}
                          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {campaign.recipient_count}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                          {campaign.open_count}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-medium ${
                          openRate >= 30 ? "text-green-600" : 
                          openRate >= 15 ? "text-amber-600" : 
                          "text-muted-foreground"
                        }`}>
                          {openRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <MousePointerClick className="h-3 w-3 text-muted-foreground" />
                          {campaign.click_count}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-medium ${
                          clickRate >= 10 ? "text-green-600" : 
                          clickRate >= 3 ? "text-amber-600" : 
                          "text-muted-foreground"
                        }`}>
                          {clickRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {format(new Date(campaign.sent_at), "MMM d")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCampaign(campaign);
                            }}
                            className="text-muted-foreground hover:text-foreground"
                            title="Edit campaign"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(campaign.id);
                            }}
                            disabled={deletingId === campaign.id}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Delete campaign"
                          >
                            {deletingId === campaign.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      )}

      <CampaignDetailDialog
        campaignId={selectedCampaign?.id || null}
        campaignSubject={selectedCampaign?.subject || ""}
        onClose={() => setSelectedCampaign(null)}
      />

      <EditEmailCampaignDialog
        campaign={editingCampaign}
        onClose={() => setEditingCampaign(null)}
        onSaved={fetchCampaigns}
      />
    </Card>
  );
};

export default CampaignAnalytics;
