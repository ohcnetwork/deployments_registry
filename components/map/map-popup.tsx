"use client";

import { ExternalLink, MapPin, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Deployment } from "@/types/deployment";
import { PROGRAM_LABELS, PROGRAM_COLORS, formatDate } from "@/lib/map-utils";

interface MapPopupProps {
  deployment: Deployment;
  onClose?: () => void;
}

export function MapPopup({ deployment }: MapPopupProps) {
  return (
    <Card className="w-full max-w-md border-2">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg">{deployment.name}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1 text-sm">
              <MapPin className="h-3 w-3" />
              {deployment.location.address
                ? `${deployment.location.address.city}, ${deployment.location.address.country}`
                : `${deployment.location.latitude.toFixed(4)}, ${deployment.location.longitude.toFixed(4)}`}
            </CardDescription>
          </div>
          <Badge
            style={{
              backgroundColor: PROGRAM_COLORS[deployment.program],
              color: "white",
            }}
          >
            {PROGRAM_LABELS[deployment.program]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{deployment.description}</p>
        
        <div className="flex flex-wrap gap-3 text-sm">
          {deployment.dateDeployed && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(deployment.dateDeployed)}</span>
            </div>
          )}
          
          {deployment.organization && (
            <div className="text-muted-foreground">
              <span className="font-medium">Org:</span> {deployment.organization}
            </div>
          )}
        </div>

        {deployment.website && (
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a
              href={deployment.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Visit Website
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
