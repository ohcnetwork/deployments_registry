"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import Supercluster from "supercluster";
import type { Deployment, ProgramType } from "@/types/deployment";
import { config } from "@/lib/config";
import { PROGRAM_COLORS, createMarkerElement, createClusterMarkerElement } from "@/lib/map-utils";
import { useTheme } from "next-themes";

interface DeploymentMapProps {
  deployments: Deployment[];
  selectedPrograms: Set<ProgramType>;
  searchQuery: string;
  onDeploymentClick?: (deployment: Deployment) => void;
  isGlobeMode: boolean;
  showLabels: boolean;
}

export function DeploymentMap({
  deployments,
  selectedPrograms,
  searchQuery,
  onDeploymentClick,
  isGlobeMode,
  showLabels,
}: DeploymentMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Filter deployments based on selected programs and search query
  const filteredDeployments = deployments.filter((deployment) => {
    const programMatch = selectedPrograms.size === 0 || selectedPrograms.has(deployment.program);
    const searchMatch =
      searchQuery === "" ||
      deployment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deployment.description.toLowerCase().includes(searchQuery.toLowerCase());
    return programMatch && searchMatch;
  });

  // Initialize map
  useEffect(() => {
    setMounted(true);
    if (!mapContainer.current || map.current) return;

    const isDark = resolvedTheme === "dark";
    const mapStyle = isDark
      ? `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${config.maptilerApiKey}`
      : `https://api.maptiler.com/maps/streets-v2/style.json?key=${config.maptilerApiKey}`;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [20, 20], // Center of the world
      zoom: 2,
    } as any);

    // Set initial projection and hide labels after style loads
    map.current.once("style.load", () => {
      if (map.current) {
        try {
          map.current.setProjection(isGlobeMode ? ({ type: "globe" } as any) : { type: "mercator" });
        } catch (error) {
          console.warn("Globe projection not supported", error);
        }

        // Hide labels by default
        const style = map.current.getStyle();
        if (style && style.layers) {
          style.layers.forEach((layer: any) => {
            if (layer.type === "symbol" && layer.layout && layer.layout["text-field"]) {
              map.current!.setLayoutProperty(layer.id, "visibility", showLabels ? "visible" : "none");
            }
          });
        }
      }
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");
    map.current.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      }),
      "top-right"
    );

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update projection when globe mode changes
  useEffect(() => {
    if (!map.current || !mounted) return;

    try {
      map.current.setProjection(isGlobeMode ? ({ type: "globe" } as any) : { type: "mercator" });
    } catch (error) {
      console.warn("Globe projection not supported, falling back to mercator", error);
    }
  }, [isGlobeMode, mounted]);

  // Update map style when theme changes
  useEffect(() => {
    if (!map.current || !mounted) return;

    const isDark = resolvedTheme === "dark";
    const mapStyle = isDark
      ? `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${config.maptilerApiKey}`
      : `https://api.maptiler.com/maps/streets-v2/style.json?key=${config.maptilerApiKey}`;

    map.current.setStyle(mapStyle);

    // Reapply projection and label visibility after style loads
    map.current.once("style.load", () => {
      if (map.current) {
        try {
          map.current.setProjection(isGlobeMode ? ({ type: "globe" } as any) : { type: "mercator" });
        } catch (error) {
          console.warn("Globe projection not supported", error);
        }
        
        // Apply label visibility
        const style = map.current.getStyle();
        if (style && style.layers) {
          style.layers.forEach((layer: any) => {
            if (layer.type === "symbol" && layer.layout && layer.layout["text-field"]) {
              map.current!.setLayoutProperty(layer.id, "visibility", showLabels ? "visible" : "none");
            }
          });
        }
      }
    });
  }, [resolvedTheme, mounted, isGlobeMode, showLabels]);

  // Update label visibility when showLabels changes
  useEffect(() => {
    if (!map.current || !mounted) return;

    const style = map.current.getStyle();
    if (style && style.layers) {
      style.layers.forEach((layer: any) => {
        if (layer.type === "symbol" && layer.layout && layer.layout["text-field"]) {
          try {
            map.current!.setLayoutProperty(layer.id, "visibility", showLabels ? "visible" : "none");
          } catch (error) {
            // Layer might not exist yet
          }
        }
      });
    }
  }, [showLabels, mounted]);

  // Update markers when deployments, filters, or search changes
  useEffect(() => {
    if (!map.current || !mounted) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Create supercluster index
    const cluster = new Supercluster<Deployment>({
      radius: 60,
      maxZoom: 16,
      minPoints: 2,
    });

    // Convert deployments to GeoJSON features
    const features = filteredDeployments.map((deployment) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [deployment.location.longitude, deployment.location.latitude],
      },
      properties: deployment,
    }));

    cluster.load(features);

    const updateMarkers = () => {
      if (!map.current) return;

      const bounds = map.current.getBounds();
      const zoom = map.current.getZoom();

      const clusters = cluster.getClusters(
        [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
        Math.floor(zoom)
      );

      // Clear existing markers
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];

      clusters.forEach((cluster) => {
        const [lng, lat] = cluster.geometry.coordinates;
        const properties = cluster.properties as any;

        if (properties.cluster) {
          // This is a cluster
          const clusterLeaves = properties.point_count || 0;
          const clusterId = properties.cluster_id;

          // For simplicity, use first deployment's color
          const firstDeployment = filteredDeployments[0];
          const color = firstDeployment ? PROGRAM_COLORS[firstDeployment.program] : "#6B7280";

          const el = createClusterMarkerElement(clusterLeaves, color);

          el.addEventListener("click", () => {
            if (map.current && clusterId) {
              const expansionZoom = Math.min(
                (cluster as any).getClusterExpansionZoom?.(clusterId) || zoom + 2,
                20
              );
              map.current.flyTo({
                center: [lng, lat],
                zoom: expansionZoom,
              });
            }
          });

          const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map.current!);
          markers.current.push(marker);
        } else {
          // This is a single deployment
          const deployment = properties as Deployment;
          const el = createMarkerElement(deployment.program);

          el.addEventListener("click", () => {
            onDeploymentClick?.(deployment);
          });

          const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map.current!);
          markers.current.push(marker);
        }
      });
    };

    // Initial marker update
    if (map.current.isStyleLoaded()) {
      updateMarkers();
    } else {
      map.current.once("load", updateMarkers);
    }

    // Update markers on move
    map.current.on("moveend", updateMarkers);
    map.current.on("zoomend", updateMarkers);

    return () => {
      if (map.current) {
        map.current.off("moveend", updateMarkers);
        map.current.off("zoomend", updateMarkers);
      }
    };
  }, [filteredDeployments, mounted, onDeploymentClick]);

  return (
    <div ref={mapContainer} className="h-full w-full" />
  );
}
