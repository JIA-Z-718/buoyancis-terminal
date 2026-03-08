import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Globe, Plus, Trash2, Search, MapPin, Shield, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";

interface GeoRestriction {
  id: string;
  country_code: string;
  country_name: string;
  region: string | null;
  is_blocked: boolean;
  reason: string | null;
  created_at: string;
  created_by: string | null;
}

// Common countries list for quick selection
const COMMON_COUNTRIES = [
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AR", name: "Argentina" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "BD", name: "Bangladesh" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BR", name: "Brazil" },
  { code: "BG", name: "Bulgaria" },
  { code: "CA", name: "Canada" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "HR", name: "Croatia" },
  { code: "CU", name: "Cuba" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "EG", name: "Egypt" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" },
  { code: "HK", name: "Hong Kong" },
  { code: "HU", name: "Hungary" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KP", name: "North Korea" },
  { code: "KR", name: "South Korea" },
  { code: "KW", name: "Kuwait" },
  { code: "LY", name: "Libya" },
  { code: "MY", name: "Malaysia" },
  { code: "MX", name: "Mexico" },
  { code: "MA", name: "Morocco" },
  { code: "MM", name: "Myanmar" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NG", name: "Nigeria" },
  { code: "NO", name: "Norway" },
  { code: "PK", name: "Pakistan" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SG", name: "Singapore" },
  { code: "ZA", name: "South Africa" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SD", name: "Sudan" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "SY", name: "Syria" },
  { code: "TW", name: "Taiwan" },
  { code: "TH", name: "Thailand" },
  { code: "TR", name: "Turkey" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" },
  { code: "ZW", name: "Zimbabwe" },
];

// Country flag emoji from country code
const getCountryFlag = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return "🌍";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const GeoRestrictionsManager = () => {
  const [restrictions, setRestrictions] = useState<GeoRestriction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [customCountryCode, setCustomCountryCode] = useState("");
  const [customCountryName, setCustomCountryName] = useState("");
  const [region, setRegion] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRestrictions = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("geo_restrictions")
      .select("*")
      .order("country_name", { ascending: true });

    if (error) {
      console.error("Error fetching geo restrictions:", error);
      toast({
        title: "Error",
        description: "Failed to load geographic restrictions",
        variant: "destructive",
      });
    } else {
      setRestrictions(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRestrictions();
  }, []);

  const handleAddRestriction = async () => {
    let countryCode = "";
    let countryName = "";

    if (selectedCountry === "custom") {
      if (!customCountryCode.trim() || !customCountryName.trim()) {
        setError("Both country code and name are required for custom entries");
        return;
      }
      if (!/^[A-Z]{2}$/i.test(customCountryCode.trim())) {
        setError("Country code must be exactly 2 letters (ISO 3166-1 alpha-2)");
        return;
      }
      countryCode = customCountryCode.trim().toUpperCase();
      countryName = customCountryName.trim();
    } else if (selectedCountry) {
      const country = COMMON_COUNTRIES.find((c) => c.code === selectedCountry);
      if (!country) {
        setError("Please select a valid country");
        return;
      }
      countryCode = country.code;
      countryName = country.name;
    } else {
      setError("Please select a country");
      return;
    }

    // Check for duplicates
    const isDuplicate = restrictions.some(
      (r) => r.country_code === countryCode && (r.region || "") === (region.trim() || "")
    );
    if (isDuplicate) {
      setError("This country/region is already in the list");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const { data: userData } = await supabase.auth.getUser();

    const { error: insertError } = await supabase.from("geo_restrictions").insert({
      country_code: countryCode,
      country_name: countryName,
      region: region.trim() || null,
      reason: reason.trim() || null,
      is_blocked: true,
      created_by: userData?.user?.id || null,
    });

    if (insertError) {
      console.error("Error adding geo restriction:", insertError);
      toast({
        title: "Error",
        description: insertError.code === "23505" 
          ? "This country/region is already blocked" 
          : "Failed to add geographic restriction",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Restriction added",
        description: `${countryName}${region ? ` (${region})` : ""} has been added to the blocklist`,
      });
      setSelectedCountry("");
      setCustomCountryCode("");
      setCustomCountryName("");
      setRegion("");
      setReason("");
      setIsAddDialogOpen(false);
      fetchRestrictions();
    }

    setIsSubmitting(false);
  };

  const handleToggleRestriction = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from("geo_restrictions")
      .update({ is_blocked: !currentState })
      .eq("id", id);

    if (error) {
      console.error("Error toggling geo restriction:", error);
      toast({
        title: "Error",
        description: "Failed to update restriction status",
        variant: "destructive",
      });
    } else {
      setRestrictions((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_blocked: !currentState } : r))
      );
    }
  };

  const handleRemoveRestriction = async (id: string, countryName: string) => {
    const { error } = await supabase.from("geo_restrictions").delete().eq("id", id);

    if (error) {
      console.error("Error removing geo restriction:", error);
      toast({
        title: "Error",
        description: "Failed to remove restriction",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Restriction removed",
        description: `${countryName} has been removed from the blocklist`,
      });
      setRestrictions((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const filteredRestrictions = useMemo(() => {
    return restrictions.filter(
      (r) =>
        r.country_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.country_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.region && r.region.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [restrictions, searchQuery]);

  const blockedCount = restrictions.filter((r) => r.is_blocked).length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Geographic Restrictions
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
              <Globe className="w-5 h-5" />
              Geographic Restrictions
            </CardTitle>
            <CardDescription>
              Block signups from specific countries or regions based on IP geolocation
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Block Country
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Geographic Restriction</DialogTitle>
                <DialogDescription>
                  Block signups from a specific country or region. Users from blocked locations will be silently rejected.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Country</label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {COMMON_COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <span className="flex items-center gap-2">
                            <span>{getCountryFlag(country.code)}</span>
                            <span>{country.name}</span>
                            <span className="text-muted-foreground">({country.code})</span>
                          </span>
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>Custom country...</span>
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedCountry === "custom" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Country Code</label>
                      <Input
                        placeholder="e.g., XX"
                        value={customCountryCode}
                        onChange={(e) => setCustomCountryCode(e.target.value.toUpperCase())}
                        maxLength={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Country Name</label>
                      <Input
                        placeholder="e.g., Example Country"
                        value={customCountryName}
                        onChange={(e) => setCustomCountryName(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Region (optional)</label>
                  <Input
                    placeholder="e.g., California, Bavaria, etc."
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to block the entire country
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason (optional)</label>
                  <Textarea
                    placeholder="Why is this location being blocked?"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddRestriction} disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Restriction"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by country or region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{restrictions.length} restriction{restrictions.length !== 1 ? "s" : ""}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            {blockedCount} actively blocking
          </span>
          {searchQuery && <span>• {filteredRestrictions.length} matching</span>}
        </div>

        {/* Table */}
        {filteredRestrictions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? (
              <p>No restrictions match your search</p>
            ) : (
              <div className="space-y-2">
                <Globe className="w-12 h-12 mx-auto opacity-50" />
                <p>No geographic restrictions configured</p>
                <p className="text-xs">Add countries to block signups from specific locations</p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRestrictions.map((restriction) => (
                  <TableRow key={restriction.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCountryFlag(restriction.country_code)}</span>
                        <div>
                          <div className="font-medium">{restriction.country_name}</div>
                          <div className="text-xs text-muted-foreground">{restriction.country_code}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {restriction.region ? (
                        <Badge variant="outline">{restriction.region}</Badge>
                      ) : (
                        <span className="text-muted-foreground">All regions</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {restriction.reason || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(parseISO(restriction.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={restriction.is_blocked}
                        onCheckedChange={() => handleToggleRestriction(restriction.id, restriction.is_blocked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveRestriction(restriction.id, restriction.country_name)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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

export default GeoRestrictionsManager;
