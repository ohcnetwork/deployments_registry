"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { PROGRAM_COLORS, PROGRAM_LABELS } from "@/lib/map-utils";
import type {
  Deployment,
  DeploymentStats,
  ProgramType,
} from "@/types/deployment";
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

interface DeploymentFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedPrograms: Set<ProgramType>;
  onProgramToggle: (program: ProgramType) => void;
  stats: DeploymentStats;
  showLabels: boolean;
  onShowLabelsChange: (show: boolean) => void;
  enableClustering: boolean;
  onClusteringChange: (enabled: boolean) => void;
  filteredDeployments: Deployment[];
  onDeploymentClick?: (deployment: Deployment) => void;
  highlightedDeploymentId?: string | null;
}

const PROGRAMS: ProgramType[] = [
  "10bedicu",
  "kerala-care",
  "palliative-ngo",
  "hmis",
];

export function DeploymentFilters({
  searchQuery,
  onSearchChange,
  selectedPrograms,
  onProgramToggle,
  stats,
  showLabels,
  onShowLabelsChange,
  enableClustering,
  onClusteringChange,
  filteredDeployments,
  onDeploymentClick,
  highlightedDeploymentId,
}: DeploymentFiltersProps) {
  const { theme, setTheme } = useTheme();
  const [isProgramsExpanded, setIsProgramsExpanded] = useState(false);
  const [isMapOptionsExpanded, setIsMapOptionsExpanded] = useState(false);
  const [isLocationsExpanded, setIsLocationsExpanded] = useState(true);

  return (
    <div className="h-full min-h-0">
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold">Filters</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-8 w-8"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
      <div className="space-y-4 p-2">
        {/* Deployments List */}
        <div className="space-y-3">
          <button
            onClick={() => setIsLocationsExpanded(!isLocationsExpanded)}
            className="flex w-full items-center justify-between text-sm font-medium hover:opacity-70 transition-opacity"
          >
            <span>Locations ({filteredDeployments.length})</span>
            {isLocationsExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {isLocationsExpanded && (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="max-h-[300px] space-y-1 overflow-y-auto pr-1">
                {filteredDeployments.map((deployment) => (
                  <button
                    key={deployment.id}
                    onClick={() => onDeploymentClick?.(deployment)}
                    className={`w-full rounded-md border p-3 text-left transition-colors hover:bg-accent hover:border-primary ${
                      highlightedDeploymentId === deployment.id
                        ? "bg-accent border-primary ring-2 ring-primary"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="mt-1 h-3 w-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor: PROGRAM_COLORS[deployment.program],
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium">
                            {deployment.name}
                          </h4>
                          <Badge
                            variant="secondary"
                            className="text-[10px] shrink-0"
                          >
                            {PROGRAM_LABELS[deployment.program]}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">
                            {deployment.location.address
                              ? `${deployment.location.address.city}, ${deployment.location.address.country}`
                              : `${deployment.location.latitude.toFixed(
                                  2
                                )}, ${deployment.location.longitude.toFixed(
                                  2
                                )}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredDeployments.length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No deployments found
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* Program Filters */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsProgramsExpanded(!isProgramsExpanded)}
              className="flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
            >
              <span>Programs</span>
              {isProgramsExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {selectedPrograms.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => PROGRAMS.forEach((p) => onProgramToggle(p))}
                className="h-auto px-2 py-1 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
          {isProgramsExpanded && (
            <div className="space-y-2">
              {PROGRAMS.map((program) => {
                const count = stats.byProgram[program] || 0;
                const isSelected = selectedPrograms.has(program);

                return (
                  <div
                    key={program}
                    className="flex items-center space-x-2 rounded-md border p-2 transition-colors hover:bg-accent"
                  >
                    <Checkbox
                      id={program}
                      checked={isSelected}
                      onCheckedChange={() => onProgramToggle(program)}
                    />
                    <label
                      htmlFor={program}
                      className="flex flex-1 cursor-pointer items-center justify-between text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      <span className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: PROGRAM_COLORS[program] }}
                        />
                        {PROGRAM_LABELS[program]}
                      </span>
                      <Badge variant="secondary" className="ml-2">
                        {count}
                      </Badge>
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Separator />

        {/* Map Options */}
        <div className="space-y-3">
          <button
            onClick={() => setIsMapOptionsExpanded(!isMapOptionsExpanded)}
            className="flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
          >
            <span>Map Options</span>
            {isMapOptionsExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {isMapOptionsExpanded && (
            <>
              <div className="flex items-center justify-between rounded-md border p-3">
                <label
                  htmlFor="show-labels"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Show Labels
                </label>
                <Switch
                  id="show-labels"
                  checked={showLabels}
                  onCheckedChange={onShowLabelsChange}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <label
                  htmlFor="enable-clustering"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Cluster Markers
                </label>
                <Switch
                  id="enable-clustering"
                  checked={enableClustering}
                  onCheckedChange={onClusteringChange}
                />
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* Legend */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Legend</h3>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-white shadow-md" />
              <span>Single deployment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-400 text-[10px] font-bold text-white shadow-md">
                5
              </div>
              <span>Cluster (click to zoom)</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Stats */}
        <div className="space-y-2 pb-6">
          <h3 className="text-sm font-medium">Statistics</h3>
          <div className="text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Deployments:</span>
              <span className="font-medium">{stats.total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
