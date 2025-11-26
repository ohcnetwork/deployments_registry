"use client";

import { DeploymentFilters } from "@/components/filters/deployment-filters";
import { DeploymentMap } from "@/components/map/deployment-map";
import { MapPopup } from "@/components/map/map-popup";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { config } from "@/lib/config";
import { calculateStats, getDeployments } from "@/lib/data";
import type {
  Deployment,
  DeploymentData,
  ProgramType,
} from "@/types/deployment";
import { Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState, useCallback } from "react";

const ALL_PROGRAMS: ProgramType[] = [
  "10bedicu",
  "kerala-care",
  "palliative-ngo",
  "hmis",
];

export default function Home() {
  // Load data once with lazy initialization - this ensures it only loads once
  const [data] = useState<DeploymentData>(() => getDeployments());

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrograms, setSelectedPrograms] = useState<Set<ProgramType>>(
    new Set(ALL_PROGRAMS)
  );
  const [selectedDeployment, setSelectedDeployment] =
    useState<Deployment | null>(null);
  const [highlightedDeploymentId, setHighlightedDeploymentId] = useState<
    string | null
  >(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [enableClustering, setEnableClustering] = useState(() => {
    // Load from localStorage if available, otherwise use config default
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("enableClustering");
      if (saved !== null) {
        return saved === "true";
      }
    }
    return config.enableClusteringByDefault;
  });

  // Debounce search input - only update searchQuery after 400ms of no typing
  // Exception: Clear search immediately when input is empty (0ms delay)
  useEffect(() => {
    // Use shorter delay (0ms) when clearing, longer delay (400ms) when typing
    const delay = searchInput === "" ? 0 : 400;

    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      // Clear selection when search query changes
      if (searchInput !== searchQuery) {
        setSelectedDeployment(null);
        setHighlightedDeploymentId(null);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [searchInput, searchQuery]);

  // Persist clustering state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("enableClustering", String(enableClustering));
    }
  }, [enableClustering]);

  // Memoize stats calculation to avoid recalculating on every render
  const stats = useMemo(() => calculateStats(data), [data]);

  // Memoize filtered deployments to avoid recalculating on every render
  const filteredDeployments = useMemo(() => {
    return data.deployments.filter((deployment) => {
      // Don't filter by highlighted deployment - keep all markers visible
      // The map will handle highlighting the selected one visually

      // If no programs are selected, show nothing
      if (selectedPrograms.size === 0) {
        return false;
      }

      const programMatch = selectedPrograms.has(deployment.program);
      const searchMatch =
        searchQuery === "" ||
        deployment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deployment.location.address?.city
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      return programMatch && searchMatch;
    });
  }, [data, selectedPrograms, searchQuery]);

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

  const handleDeploymentClick = (deployment: Deployment) => {
    setSelectedDeployment(deployment);
    setHighlightedDeploymentId(deployment.id);
    // Close mobile filter sheet when a deployment is selected
    setIsFilterOpen(false);
  };

  const handleClosePopup = useCallback(() => {
    setSelectedDeployment(null);
    setHighlightedDeploymentId(null);
  }, []);

  // Navigation functions for previous/next deployment in filtered list
  const currentDeploymentIndex = useMemo(() => {
    if (!selectedDeployment) return -1;
    return filteredDeployments.findIndex((d) => d.id === selectedDeployment.id);
  }, [selectedDeployment, filteredDeployments]);

  const handlePreviousDeployment = useCallback(() => {
    if (currentDeploymentIndex <= 0) return;
    const prevDeployment = filteredDeployments[currentDeploymentIndex - 1];
    handleDeploymentClick(prevDeployment);
  }, [currentDeploymentIndex, filteredDeployments]);

  const handleNextDeployment = useCallback(() => {
    if (currentDeploymentIndex >= filteredDeployments.length - 1) return;
    const nextDeployment = filteredDeployments[currentDeploymentIndex + 1];
    handleDeploymentClick(nextDeployment);
  }, [currentDeploymentIndex, filteredDeployments]);

  const hasPrevious = currentDeploymentIndex > 0;
  const hasNext = currentDeploymentIndex < filteredDeployments.length - 1;

  // Keyboard navigation for previous/next deployment
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedDeployment) return;
      
      if (e.key === "ArrowLeft" && hasPrevious) {
        e.preventDefault();
        handlePreviousDeployment();
      } else if (e.key === "ArrowRight" && hasNext) {
        e.preventDefault();
        handleNextDeployment();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleClosePopup();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDeployment, hasPrevious, hasNext, handlePreviousDeployment, handleNextDeployment, handleClosePopup]);

  const FilterPanel = (
    <DeploymentFilters
      searchQuery={searchInput}
      onSearchChange={setSearchInput}
      selectedPrograms={selectedPrograms}
      onProgramToggle={handleProgramToggle}
      stats={stats}
      showLabels={showLabels}
      onShowLabelsChange={setShowLabels}
      enableClustering={enableClustering}
      onClusteringChange={setEnableClustering}
      filteredDeployments={filteredDeployments}
      onDeploymentClick={handleDeploymentClick}
      highlightedDeploymentId={highlightedDeploymentId}
    />
  );

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden"
      style={{ height: "calc(var(--vh, 1vh) * 100)" }}
    >
      {/* Header */}
      <header
        className="z-10 border-b bg-background/60 backdrop-blur"
        style={{
          paddingTop: "var(--safe-area-inset-top)",
        }}
      >
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image
              src={config.organizationLogo}
              alt={config.organizationName}
              width={80}
              height={32}
              className="hidden h-8 w-20 dark:block"
            />
            <Image
              src={config.organizationLogo}
              alt={config.organizationName}
              width={80}
              height={32}
              className="h-8 w-20 dark:hidden"
              style={{ filter: "invert(1) brightness(1.5)" }}
            />
            <div className="h-8 w-px bg-border" />
            <h1 className="text-lg font-semibold">{config.appName}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar - slides over the map */}
        <aside
          className={`hidden lg:block absolute left-0 top-0 h-full z-20 overflow-y-auto border-r bg-background shadow-xl transition-transform duration-300 ${
            isSidebarCollapsed ? "-translate-x-full" : "translate-x-0"
          } w-80`}
        >
          {FilterPanel}
        </aside>

        {/* Map Container */}
        <main className="relative flex-1 w-full">
          <DeploymentMap
            deployments={filteredDeployments}
            onDeploymentClick={handleDeploymentClick}
            showLabels={showLabels}
            enableClustering={enableClustering}
            highlightedDeploymentId={highlightedDeploymentId}
          />

          {/* Desktop Sidebar Toggle */}
          <div
            className={`absolute top-4 z-30 hidden lg:block transition-all duration-300 ${
              isSidebarCollapsed ? "left-4" : "left-[336px]"
            }`}
          >
            <Button
              size="icon"
              variant="default"
              className="h-10 w-10 shadow-lg"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              {isSidebarCollapsed ? (
                <Menu className="h-5 w-5" />
              ) : (
                <X className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Mobile Filter Button */}
          <div
            className="absolute left-4 top-4 lg:hidden"
            style={{
              left: "max(1rem, calc(1rem + var(--safe-area-inset-left)))",
            }}
          >
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  variant="default"
                  className="h-10 w-10 shadow-lg"
                >
                  {isFilterOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-80 overflow-y-auto p-4 [&>button]:hidden"
              >
                <SheetTitle className="sr-only">Deployment Filters</SheetTitle>
                {FilterPanel}
              </SheetContent>
            </Sheet>
          </div>

          {/* Deployment Detail Popup */}
          {selectedDeployment && (
            <>
              {/* Overlay to detect outside clicks */}
              <div
                className="absolute inset-0 z-10"
                onClick={handleClosePopup}
              />
              
              {/* Navigation Buttons - Bottom Center */}
              {(hasPrevious || hasNext) && (
                <div
                  className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-3"
                  style={{
                    paddingBottom: "max(1rem, calc(1rem + var(--safe-area-inset-bottom)))",
                  }}
                >
                  {hasPrevious && (
                    <Button
                      size="icon"
                      variant="default"
                      className="h-12 w-12 rounded-full shadow-lg"
                      onClick={handlePreviousDeployment}
                      title="Previous location"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                  )}
                  {hasNext && (
                    <Button
                      size="icon"
                      variant="default"
                      className="h-12 w-12 rounded-full shadow-lg"
                      onClick={handleNextDeployment}
                      title="Next location"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  )}
                </div>
              )}

              {/* Mobile: bottom-positioned with safe area, Desktop: top-right */}
              <div
                className="absolute bottom-0 left-0 right-0 z-20 px-4 sm:bottom-auto sm:left-auto sm:right-4 sm:top-4 sm:max-w-md"
                style={{
                  paddingBottom:
                    "max(4.5rem, calc(4.5rem + var(--safe-area-inset-bottom)))", // Extra space for navigation buttons on mobile
                  paddingLeft:
                    "max(1rem, calc(1rem + var(--safe-area-inset-left)))",
                  paddingRight:
                    "max(1rem, calc(1rem + var(--safe-area-inset-right)))",
                }}
              >
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -right-2 -top-2 z-10 h-8 w-8 rounded-full bg-background shadow-md hover:bg-accent sm:h-6 sm:w-6"
                    onClick={handleClosePopup}
                  >
                    <X className="h-5 w-5 sm:h-4 sm:w-4" />
                  </Button>
                  <MapPopup deployment={selectedDeployment} />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
