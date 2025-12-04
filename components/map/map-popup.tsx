"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{deployment.name}</CardTitle>
        <CardDescription>
          <MapPin className="size-3 shrink-0 inline mr-2" />
          {deployment.location.address
            ? `${deployment.location.address.city}, ${deployment.location.address.state}, ${deployment.location.address.country}`
            : `${deployment.location.latitude.toFixed(
                4
              )}, ${deployment.location.longitude.toFixed(4)}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-sm text-muted-foreground line-clamp-3 md:line-clamp-none">
          {deployment.description}
        </p>
      </CardContent>
      <CardFooter className="sm:flex-row flex-col gap-2">
        <div className="flex gap-2">
          {deployment.dateDeployed && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3 shrink-0" />
              <span>{formatDate(deployment.dateDeployed)}</span>
            </div>
          )}
          {deployment.website && (
            <Button variant="ghost" size="sm" asChild>
              <a href={deployment.website} target="_blank">
                <ExternalLink />
              </a>
            </Button>
          )}
        </div>
        <div className="flex gap-2">
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
      </CardFooter>
    </Card>
  );
}
