"use client";

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
  position: { x: number; y: number };
}

interface PropertyMapProps {
  properties: Property[];
}

export function PropertyMap({ properties }: PropertyMapProps) {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Property Locations</CardTitle>
        <CardDescription>Properties in Hamburg, Germany</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Realistic Hamburg Map */}
        <div className="relative h-[280px] bg-muted rounded-lg overflow-hidden">
          {/* Map Background - Stylized Hamburg */}
          <svg 
            viewBox="0 0 400 280" 
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Water - Elbe River and Alster Lake */}
            <defs>
              <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(210, 50%, 85%)" />
                <stop offset="100%" stopColor="hsl(210, 50%, 80%)" />
              </linearGradient>
            </defs>
            
            {/* Base land color */}
            <rect width="100%" height="100%" fill="hsl(40, 20%, 95%)" />
            
            {/* Elbe River */}
            <path 
              d="M0 180 Q50 170, 100 185 T200 175 T300 190 T400 180 L400 220 Q350 210, 300 225 T200 215 T100 220 T0 210 Z" 
              fill="url(#waterGradient)"
            />
            
            {/* Inner Alster */}
            <ellipse cx="200" cy="80" rx="25" ry="20" fill="url(#waterGradient)" />
            
            {/* Outer Alster */}
            <ellipse cx="200" cy="45" rx="45" ry="30" fill="url(#waterGradient)" />
            
            {/* Major Roads */}
            <g stroke="hsl(0, 0%, 92%)" strokeWidth="3" fill="none">
              {/* Ring roads */}
              <path d="M100 80 Q150 60, 200 60 T300 80" />
              <path d="M80 120 Q140 100, 200 100 T320 120" />
              <path d="M60 160 Q130 140, 200 140 T340 160" />
              
              {/* Radial roads */}
              <line x1="200" y1="20" x2="200" y2="280" />
              <line x1="100" y1="50" x2="300" y2="250" />
              <line x1="300" y1="50" x2="100" y2="250" />
              <line x1="50" y1="140" x2="350" y2="140" />
            </g>
            
            {/* Secondary streets - grid pattern */}
            <g stroke="hsl(0, 0%, 95%)" strokeWidth="1" fill="none" opacity="0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <line key={`h-${i}`} x1="0" y1={30 + i * 25} x2="400" y2={30 + i * 25} />
              ))}
              {Array.from({ length: 12 }).map((_, i) => (
                <line key={`v-${i}`} x1={30 + i * 35} y1="0" x2={30 + i * 35} y2="280" />
              ))}
            </g>
            
            {/* District labels */}
            <g className="text-muted-foreground" fill="hsl(var(--muted-foreground))" fontSize="8" fontWeight="500" opacity="0.6">
              <text x="200" y="115" textAnchor="middle">ALTSTADT</text>
              <text x="120" y="90" textAnchor="middle">ST. PAULI</text>
              <text x="280" y="90" textAnchor="middle">ST. GEORG</text>
              <text x="100" y="150" textAnchor="middle">ALTONA</text>
              <text x="300" y="150" textAnchor="middle">HAMMERBROOK</text>
              <text x="150" y="240" textAnchor="middle">WILHELMSBURG</text>
              <text x="280" y="240" textAnchor="middle">VEDDEL</text>
            </g>
          </svg>
          
          {/* Property pins */}
          {properties.map((property) => (
            <div
              key={property.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{ left: `${property.position.x}%`, top: `${property.position.y}%` }}
            >
              <div className="relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-110">
                  <MapPin className="h-4 w-4" />
                </div>
                {property.activeIssues > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
                    {property.activeIssues}
                  </span>
                )}
                {/* Tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-card border border-border rounded-lg shadow-lg p-3 whitespace-nowrap">
                    <p className="text-sm font-medium text-foreground">{property.name}</p>
                    <p className="text-xs text-muted-foreground">{property.address}</p>
                    <Badge className="mt-2" variant={property.activeIssues > 0 ? "default" : "secondary"}>
                      {property.activeIssues} active issue{property.activeIssues !== 1 ? "s" : ""}
                    </Badge>
                  {property.walletBalance !== undefined && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Wallet: ${property.walletBalance.toLocaleString()} · Used: $
                      {(property.walletUsed ?? 0).toLocaleString()} · Remaining: $
                      {(property.walletRemaining ?? 0).toLocaleString()}
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Property List */}
        <div className="mt-4 space-y-2">
          {properties.map((property) => (
            <div
              key={property.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
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
