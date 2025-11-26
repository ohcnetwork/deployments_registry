"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PROGRAM_COLORS, PROGRAM_LABELS, formatDate } from "@/lib/map-utils";
import type { Deployment } from "@/types/deployment";
import { Calendar, ExternalLink, MapPin } from "lucide-react";
import { Button } from "../ui/button";

interface MapPopupProps {
  deployment: Deployment;
  onClose?: () => void;
}

export function MapPopup({ deployment }: MapPopupProps) {
  return (
    <Card className="w-full max-w-md min-w-60 border-2 py-4 gap-2">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg">
              {deployment.name}{" "}
              {deployment.website && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={deployment.website} target="_blank">
                    <ExternalLink />
                  </a>
                </Button>
              )}
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1 text-sm">
              <MapPin className="size-3 shrink-0" />
              {deployment.location.address
                ? `${deployment.location.address.city}, ${deployment.location.address.country}`
                : `${deployment.location.latitude.toFixed(
                    4
                  )}, ${deployment.location.longitude.toFixed(4)}`}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2">
            <Badge
              style={{
                backgroundColor: PROGRAM_COLORS[deployment.program],
                color: "white",
              }}
            >
              {PROGRAM_LABELS[deployment.program]}
            </Badge>
            <Badge className="capitalize">{deployment.status || "unknown"}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-sm text-muted-foreground line-clamp-3 md:line-clamp-none">
          {deployment.description}
        </p>

        <div className="flex flex-wrap gap-3 text-sm">
          {deployment.dateDeployed && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(deployment.dateDeployed)}</span>
            </div>
          )}

          {deployment.organization && (
            <div className="text-muted-foreground">
              <span className="font-medium">Org:</span>{" "}
              {deployment.organization}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
