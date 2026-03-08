import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  Users,
  Search,
  Trash2,
  Download,
  RefreshCw,
  Clock,
  Mail,
  Phone,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EventCheckin {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  checked_in_at: string;
  created_at: string;
}

const EventCheckinsManager = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data: checkins,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["event-checkins"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-event-checkins", {
        body: { action: "list" },
      });

      if (error) throw error;
      return data.data as EventCheckin[];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("event-checkins-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_checkins" },
        () => {
          refetch();
          toast.info("簽到名單已更新");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const filteredCheckins = checkins?.filter((checkin) => {
    const query = searchQuery.toLowerCase();
    return (
      checkin.full_name.toLowerCase().includes(query) ||
      checkin.email?.toLowerCase().includes(query) ||
      checkin.phone?.includes(query) ||
      checkin.company?.toLowerCase().includes(query)
    );
  });

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { data, error } = await supabase.functions.invoke("admin-event-checkins", {
        body: { action: "delete", id },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      toast.success("已刪除簽到記錄");
      refetch();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("刪除失敗");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCSV = () => {
    if (!checkins || checkins.length === 0) {
      toast.error("沒有資料可匯出");
      return;
    }

    const headers = ["姓名", "電子郵件", "電話", "公司/單位", "簽到時間"];
    const rows = checkins.map((c) => [
      c.full_name,
      c.email || "",
      c.phone || "",
      c.company || "",
      format(new Date(c.checked_in_at), "yyyy-MM-dd HH:mm:ss"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `event-checkins-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
    link.click();
    toast.success("已匯出 CSV 檔案");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              活動簽到名單
            </CardTitle>
            <CardDescription>
              即時查看和管理活動簽到記錄
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {checkins?.length || 0} 位嘉賓
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜尋姓名、電郵、電話或公司..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              匯出 CSV
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            載入中...
          </div>
        ) : filteredCheckins?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "找不到符合的簽到記錄" : "尚無簽到記錄"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>聯絡方式</TableHead>
                  <TableHead>公司/單位</TableHead>
                  <TableHead>簽到時間</TableHead>
                  <TableHead className="w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCheckins?.map((checkin) => (
                  <TableRow key={checkin.id}>
                    <TableCell className="font-medium">
                      {checkin.full_name}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {checkin.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {checkin.email}
                          </div>
                        )}
                        {checkin.phone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {checkin.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {checkin.company && (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          {checkin.company}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {format(
                          new Date(checkin.checked_in_at),
                          "MM/dd HH:mm",
                          { locale: zhTW }
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>確認刪除</AlertDialogTitle>
                            <AlertDialogDescription>
                              確定要刪除 {checkin.full_name} 的簽到記錄嗎？此操作無法復原。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(checkin.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deletingId === checkin.id ? "刪除中..." : "確認刪除"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventCheckinsManager;
