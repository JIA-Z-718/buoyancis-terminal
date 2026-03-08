import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CampaignMetadataProps {
  recipientCount: number;
  sentAt: string | null;
}

const CampaignMetadata = ({ recipientCount, sentAt }: CampaignMetadataProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="text-muted-foreground">Recipients</Label>
        <Input
          value={recipientCount}
          disabled
          className="bg-muted"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-muted-foreground">Sent At</Label>
        <Input
          value={sentAt ? new Date(sentAt).toLocaleString() : ""}
          disabled
          className="bg-muted"
        />
      </div>
    </div>
  );
};

export default CampaignMetadata;
