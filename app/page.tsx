"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { DeploymentMap } from "@/components/map/deployment-map";
import { DeploymentFilters } from "@/components/filters/deployment-filters";
import { MapPopup } from "@/components/map/map-popup";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getDeployments, calculateStats } from "@/lib/data";
import { config } from "@/lib/config";
import type { Deployment, ProgramType } from "@/types/deployment";

const ALL_PROGRAMS: ProgramType[] = ["10bedicu", "kerala-care", "palliative-ngo", "hmis"];

export default function Home() {
  const data = getDeployments();
  const stats = calculateStats(data);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrograms, setSelectedPrograms] = useState<Set<ProgramType>>(
    new Set(ALL_PROGRAMS)
  );
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isGlobeMode, setIsGlobeMode] = useState(true);
  const [showLabels, setShowLabels] = useState(false);

  const handleProgramToggle = (program: ProgramType) => {
    setSelectedPrograms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(program)) {
        newSet.delete(program);
      } else {
        newSet.add(program);
      }
      return newSet;
    });
  };

  const FilterPanel = (
    <DeploymentFilters
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      selectedPrograms={selectedPrograms}
      onProgramToggle={handleProgramToggle}
      stats={stats}
      isGlobeMode={isGlobeMode}
      onGlobeModeChange={setIsGlobeMode}
      showLabels={showLabels}
      onShowLabelsChange={setShowLabels}
    />
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{config.appName}</h1>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={config.organizationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {config.organizationName}
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden overflow-y-auto border-r bg-background p-4 transition-all duration-300 lg:block ${
            isSidebarCollapsed ? "w-0 p-0 opacity-0" : "w-80"
          }`}
        >
          {FilterPanel}
        </aside>

        {/* Map Container */}
        <main className="relative flex-1">
          <DeploymentMap
            deployments={data.deployments}
            selectedPrograms={selectedPrograms}
            searchQuery={searchQuery}
            onDeploymentClick={setSelectedDeployment}
            isGlobeMode={isGlobeMode}
            showLabels={showLabels}
          />

          {/* Desktop Sidebar Toggle */}
          <div className="absolute left-4 top-4 hidden lg:block">
            <Button
              size="icon"
              variant="default"
              className="h-10 w-10 shadow-lg"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              {isSidebarCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Filter Button */}
          <div className="absolute left-4 top-4 lg:hidden">
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="default" className="h-10 w-10 shadow-lg">
                  {isFilterOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto p-4">
                {FilterPanel}
              </SheetContent>
            </Sheet>
          </div>

          {/* Deployment Detail Popup */}
          {selectedDeployment && (
            <div className="absolute bottom-4 left-1/2 z-10 w-full max-w-md -translate-x-1/2 px-4 lg:bottom-8">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-background shadow-md"
                  onClick={() => setSelectedDeployment(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <MapPopup deployment={selectedDeployment} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
