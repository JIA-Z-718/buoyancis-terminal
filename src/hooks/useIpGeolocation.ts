import { useState, useEffect, useCallback } from "react";

interface GeoLocation {
  country: string;
  countryCode: string;
  region: string;
  city: string;
}

interface GeoCache {
  [ip: string]: GeoLocation | null;
}

// Simple in-memory cache for geolocation results
const geoCache: GeoCache = {};

export const useIpGeolocation = (ips: string[]) => {
  const [locations, setLocations] = useState<GeoCache>({});
  const [isLoading, setIsLoading] = useState(false);

  const lookupIp = useCallback(async (ip: string): Promise<GeoLocation | null> => {
    // Check cache first
    if (ip in geoCache) {
      return geoCache[ip];
    }

    try {
      // Using ip-api.com (free, 45 requests/minute without key)
      const response = await fetch(`https://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city`);
      const data = await response.json();

      if (data.status === "success") {
        const location: GeoLocation = {
          country: data.country,
          countryCode: data.countryCode,
          region: data.regionName,
          city: data.city,
        };
        geoCache[ip] = location;
        return location;
      }
      
      geoCache[ip] = null;
      return null;
    } catch (error) {
      console.error(`Failed to lookup IP ${ip}:`, error);
      geoCache[ip] = null;
      return null;
    }
  }, []);

  useEffect(() => {
    const uniqueIps = [...new Set(ips.filter(Boolean))];
    if (uniqueIps.length === 0) return;

    // Filter out already cached IPs
    const uncachedIps = uniqueIps.filter((ip) => !(ip in geoCache));
    
    // Return cached results immediately
    const cachedResults: GeoCache = {};
    uniqueIps.forEach((ip) => {
      if (ip in geoCache) {
        cachedResults[ip] = geoCache[ip];
      }
    });
    
    if (Object.keys(cachedResults).length > 0) {
      setLocations((prev) => ({ ...prev, ...cachedResults }));
    }

    if (uncachedIps.length === 0) return;

    setIsLoading(true);

    // Batch lookups with rate limiting (max 5 concurrent)
    const batchLookup = async () => {
      const batchSize = 5;
      const results: GeoCache = {};

      for (let i = 0; i < uncachedIps.length; i += batchSize) {
        const batch = uncachedIps.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(lookupIp));
        
        batch.forEach((ip, index) => {
          results[ip] = batchResults[index];
        });

        // Small delay between batches to respect rate limits
        if (i + batchSize < uncachedIps.length) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      setLocations((prev) => ({ ...prev, ...results }));
      setIsLoading(false);
    };

    batchLookup();
  }, [ips, lookupIp]);

  return { locations, isLoading };
};

// Country flag emoji from country code
export const getCountryFlag = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return "🌍";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};
