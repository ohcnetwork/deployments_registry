"use client";

import { Search, Moon, Sun, Globe, Map } from "lucide-react";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { ProgramType, DeploymentStats } from "@/types/deployment";
import { PROGRAM_COLORS, PROGRAM_LABELS } from "@/lib/map-utils";

interface DeploymentFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedPrograms: Set<ProgramType>;
  onProgramToggle: (program: ProgramType) => void;
  stats: DeploymentStats;
  isGlobeMode: boolean;
  onGlobeModeChange: (isGlobe: boolean) => void;
  showLabels: boolean;
  onShowLabelsChange: (show: boolean) => void;
}

const PROGRAMS: ProgramType[] = ["10bedicu", "kerala-care", "palliative-ngo", "hmis"];

export function DeploymentFilters({
  searchQuery,
  onSearchChange,
  selectedPrograms,
  onProgramToggle,
  stats,
  isGlobeMode,
  onGlobeModeChange,
  showLabels,
  onShowLabelsChange,
}: DeploymentFiltersProps) {
  const { theme, setTheme } = useTheme();

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Filters</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onGlobeModeChange(!isGlobeMode)}
              className="h-8 w-8"
              title={isGlobeMode ? "Switch to Flat Map" : "Switch to Globe"}
            >
              {isGlobeMode ? <Map className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
              <span className="sr-only">Toggle map mode</span>
            </Button>
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
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search deployments..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Separator />

        {/* Program Filters */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Programs</h3>
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
        </div>

        <Separator />

        {/* Map Options */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Map Options</h3>
          <div className="flex items-center justify-between rounded-md border p-3">
            <label htmlFor="show-labels" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Show Labels
            </label>
            <Checkbox
              id="show-labels"
              checked={showLabels}
              onCheckedChange={onShowLabelsChange}
            />
          </div>
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
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Statistics</h3>
          <div className="text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Deployments:</span>
              <span className="font-medium">{stats.total}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
