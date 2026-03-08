import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Plus, Calendar as CalendarIcon, Send, Eye, Trash2, Edit, Loader2, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyWord {
  id: string;
  word: string;
  decoded_string: string;
  interpretation: string;
  deep_analysis: string;
  scheduled_date: string;
  sent_at: string | null;
  recipient_count: number;
  created_at: string;
}

const DailyEntropyManager = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<DailyWord | null>(null);
  const [formData, setFormData] = useState({
    word: "",
    decoded_string: "",
    interpretation: "",
    deep_analysis: "",
    scheduled_date: new Date(),
  });
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all scheduled words
  const { data: words, isLoading } = useQuery({
    queryKey: ["daily-entropy-words"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_entropy_words")
        .select("*")
        .order("scheduled_date", { ascending: false });
      
      if (error) throw error;
      return data as DailyWord[];
    },
  });

  // Fetch subscriber count
  const { data: subscriberCount } = useQuery({
    queryKey: ["daily-entropy-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-early-access", {
        body: { action: "count_subscribers" },
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.count || 0;
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        word: data.word,
        decoded_string: data.decoded_string,
        interpretation: data.interpretation,
        deep_analysis: data.deep_analysis,
        scheduled_date: format(data.scheduled_date, "yyyy-MM-dd"),
      };

      if (editingWord) {
        const { error } = await supabase
          .from("daily_entropy_words")
          .update(payload)
          .eq("id", editingWord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("daily_entropy_words")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-entropy-words"] });
      toast({ title: editingWord ? "Updated" : "Created", description: "Word saved successfully" });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("daily_entropy_words")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-entropy-words"] });
      toast({ title: "Deleted", description: "Word removed" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      word: "",
      decoded_string: "",
      interpretation: "",
      deep_analysis: "",
      scheduled_date: new Date(),
    });
    setEditingWord(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (word: DailyWord) => {
    setEditingWord(word);
    setFormData({
      word: word.word,
      decoded_string: word.decoded_string,
      interpretation: word.interpretation,
      deep_analysis: word.deep_analysis,
      scheduled_date: new Date(word.scheduled_date),
    });
    setIsDialogOpen(true);
  };

  const handleSendNow = async () => {
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-daily-entropy");
      if (error) throw error;
      
      toast({
        title: "Sent",
        description: data.message || `Sent to ${data.sent} subscribers`,
      });
      queryClient.invalidateQueries({ queryKey: ["daily-entropy-words"] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!formData.word.trim()) {
      toast({ title: "Error", description: "Please enter a word first", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-entropy-analysis", {
        body: { word: formData.word, saveToDb: false }
      });
      
      if (error) throw error;
      
      setFormData({
        ...formData,
        decoded_string: data.decoded_string || "",
        interpretation: data.interpretation || "",
        deep_analysis: data.deep_analysis || "",
      });
      
      toast({ title: "Generated", description: "AI analysis generated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{subscriberCount || 0}</div>
            <p className="text-sm text-muted-foreground">Active Subscribers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {words?.filter(w => !w.sent_at).length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Scheduled Words</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {words?.filter(w => w.sent_at).length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Words Sent</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Daily Entropy Words</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSendNow}
            disabled={isSending}
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Send Today's Word
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Word
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingWord ? "Edit Word" : "Add New Word"}</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveMutation.mutate(formData);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Word</label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.word}
                        onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                        placeholder="e.g., Bitcoin"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGenerateAI}
                        disabled={isGenerating || !formData.word.trim()}
                        className="shrink-0"
                      >
                        {isGenerating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Scheduled Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("w-full justify-start text-left font-normal")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.scheduled_date, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.scheduled_date}
                          onSelect={(date) => date && setFormData({ ...formData, scheduled_date: date })}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Decoded String</label>
                  <Input
                    value={formData.decoded_string}
                    onChange={(e) => setFormData({ ...formData, decoded_string: e.target.value })}
                    placeholder="e.g., B(Birth)-I(Service)-T(Technology)-C(Care)-O(Order)-I(Service)-N(Network)"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Interpretation</label>
                  <Textarea
                    value={formData.interpretation}
                    onChange={(e) => setFormData({ ...formData, interpretation: e.target.value })}
                    placeholder="A brief poetic interpretation..."
                    rows={2}
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Deep Analysis</label>
                  <Textarea
                    value={formData.deep_analysis}
                    onChange={(e) => setFormData({ ...formData, deep_analysis: e.target.value })}
                    placeholder="A detailed structural analysis of the word..."
                    rows={5}
                    required
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingWord ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Words Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Word</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : words?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No words scheduled yet
                  </TableCell>
                </TableRow>
              ) : (
                words?.map((word) => (
                  <TableRow key={word.id}>
                    <TableCell className="font-mono font-medium">
                      {word.word.toUpperCase()}
                    </TableCell>
                    <TableCell>
                      {format(new Date(word.scheduled_date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {word.sent_at ? (
                        <Badge variant="default" className="bg-green-600">
                          <Check className="w-3 h-3 mr-1" />
                          Sent
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Scheduled</Badge>
                      )}
                    </TableCell>
                    <TableCell>{word.recipient_count}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(word)}
                          disabled={!!word.sent_at}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(word.id)}
                          disabled={!!word.sent_at}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyEntropyManager;
