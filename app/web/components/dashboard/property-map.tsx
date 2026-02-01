"use client";

import { useMemo, useState } from "react";
import { GoogleMap, InfoWindow, Marker, useJsApiLoader } from "@react-google-maps/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

interface Property {
  id: string;
  name: string;
  address: string;
  activeIssues: number;
  walletBalance?: number;
  walletUsed?: number;
  walletRemaining?: number;
  latitude?: number | null;
  longitude?: number | null;
}

interface PropertyMapProps {
  properties: Property[];
}

export function PropertyMap({ properties }: PropertyMapProps) {
  const valid = properties.filter(
    (property) => property.latitude != null && property.longitude != null
  );
  const center = useMemo(
    () =>
      valid.length > 0
        ? ({ lat: valid[0].latitude as number, lng: valid[0].longitude as number })
        : ({ lat: 37.7749, lng: -122.4194 }),
    [valid]
  );
  const mapContainerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
  const [selected, setSelected] = useState<Property | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
  });

  return (
    <Card className="bg-card/90 border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="text-foreground">Property Locations</CardTitle>
        <CardDescription className="text-xs">Properties from the database</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-[280px] rounded-lg overflow-hidden">
          {!apiKey && (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to enable the map.
            </div>
          )}
          {apiKey && loadError && (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              Google Maps failed to load.
            </div>
          )}
          {apiKey && isLoaded && (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={12}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                scrollwheel: false,
              }}
            >
              {valid.map((property) => (
                <Marker
                  key={property.id}
                  position={{
                    lat: property.latitude as number,
                    lng: property.longitude as number,
                  }}
                  onClick={() => setSelected(property)}
                />
              ))}
              {selected && selected.latitude != null && selected.longitude != null && (
                <InfoWindow
                  position={{ lat: selected.latitude, lng: selected.longitude }}
                  onCloseClick={() => setSelected(null)}
                >
                  <div className="text-sm">
                    <div className="font-medium">{selected.name}</div>
                    <div className="text-xs text-muted-foreground">{selected.address}</div>
                    <div className="mt-2">
                      <Badge variant={selected.activeIssues > 0 ? "default" : "secondary"}>
                        {selected.activeIssues} active issue
                        {selected.activeIssues !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    {selected.walletBalance !== undefined && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Wallet: ${selected.walletBalance.toLocaleString()} · Used: $
                        {(selected.walletUsed ?? 0).toLocaleString()} · Remaining: $
                        {(selected.walletRemaining ?? 0).toLocaleString()}
                      </div>
                    )}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </div>
        
        {/* Property List */}
        <div className="mt-4 space-y-2">
          {properties.map((property) => (
            <div
              key={property.id}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-2 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{property.name}</p>
                  <p className="text-xs text-muted-foreground">{property.address}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={property.activeIssues > 0 ? "default" : "secondary"}>
                  {property.activeIssues} issue{property.activeIssues !== 1 ? "s" : ""}
                </Badge>
                {property.walletBalance !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    ${property.walletRemaining?.toLocaleString() ?? 0} remaining
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
