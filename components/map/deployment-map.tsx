"use client";

import { config } from "@/lib/config";
import {
  PROGRAM_COLORS,
  createClusterMarkerElement,
  createMarkerElement,
} from "@/lib/map-utils";
import type { Deployment } from "@/types/deployment";
import maplibregl from "maplibre-gl";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import Supercluster from "supercluster";

interface DeploymentMapProps {
  deployments: Deployment[];
  onDeploymentClick?: (deployment: Deployment) => void;
  showLabels: boolean;
  enableClustering: boolean;
  highlightedDeploymentId?: string | null;
}

// Calculate center of India for the animation
const INDIA_CENTER: [number, number] = [78.9629, 20.5937];

export function DeploymentMap({
  deployments,
  onDeploymentClick,
  showLabels,
  enableClustering,
  highlightedDeploymentId,
}: DeploymentMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const markerElementsMap = useRef<Map<string, HTMLElement>>(new Map());
  const { resolvedTheme } = useTheme();
  const [introAnimationComplete, setIntroAnimationComplete] = useState(false);
  const [showMarkers, setShowMarkers] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const isInitialMount = useRef(true);
  const isUpdatingMarkers = useRef(false);
  const markerTimeouts = useRef<NodeJS.Timeout[]>([]);
  const currentDeploymentsKey = useRef<string>("");
  const previousHighlightedId = useRef<string | null>(null);
  const isIntroAnimating = useRef(false);

  // Create a stable key to reliably detect deployment changes
  const deploymentsKey = deployments
    .map((d) => d.id)
    .sort()
    .join(",");

  // Intro animation sequence
  const startIntroAnimation = () => {
    if (!map.current) return;

    isIntroAnimating.current = true;
    const startTime = Date.now();
    const spinDuration = 3000; // 2.5 seconds for smoother animation
    const startZoom = 1.5;
    // Adjust zoom based on screen size - more zoomed out on mobile
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const endZoom = isMobile ? 3.8 : 4.5;

    // Start at a longitude that will rotate 360° and end at India's longitude
    // India longitude: 78.96, so we start 360° before that
    const startLng = INDIA_CENTER[0] - 360;
    const startLat = INDIA_CENTER[1]; // Keep latitude consistent

    const rotateAndZoom = () => {
      if (!map.current) return;

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / spinDuration, 1); // 0 to 1

      // Ultra-smooth quintic ease-in-out for buttery motion
      // This provides gentler acceleration and deceleration than cubic
      const easeProgress =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      // Zoom calculation with smooth easing
      const currentZoom = startZoom + (endZoom - startZoom) * easeProgress;

      // Position calculation - smooth rotation from start to India
      // Use the same easing for rotation to keep everything synchronized
      const currentLng = startLng + 360 * easeProgress;
      const currentLat = startLat;

      // Update map with smooth rendering options
      map.current.jumpTo({
        center: [currentLng, currentLat],
        zoom: currentZoom,
      });

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(rotateAndZoom);
      } else {
        // Animation complete - we're already at India!
        // Ensure final position is exact
        map.current.jumpTo({
          center: INDIA_CENTER,
          zoom: endZoom,
        });
        isIntroAnimating.current = false;
        // Wait a bit longer to ensure rotation is fully complete before showing markers
        setTimeout(() => {
          setShowMarkers(true);
          // Note: introAnimationComplete will be set after the last marker finishes animating
        }, 500);
      }
    };

    rotateAndZoom();
  };

  // Initialize map with intro animation
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const isDark = resolvedTheme === "dark";
    const mapStyle = isDark
      ? `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${config.maptilerApiKey}`
      : `https://api.maptiler.com/maps/streets-v2/style.json?key=${config.maptilerApiKey}`;

    // Always start with globe view for animation
    // Start 360° before India's longitude so we can spin and land perfectly on India
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [INDIA_CENTER[0] - 360, INDIA_CENTER[1]], // Start at India's latitude, 360° before its longitude
      zoom: 1.5,
    } as maplibregl.MapOptions);

    // Set initial projection and hide labels after style loads
    map.current.once("style.load", () => {
      if (map.current) {
        try {
          // Always start with globe for intro animation
          map.current.setProjection({
            type: "globe",
          } as maplibregl.ProjectionSpecification);
        } catch (_error) {
          console.warn("Globe projection not supported");
        }

        // Hide labels by default
        const style = map.current.getStyle();
        if (style?.layers) {
          style.layers.forEach((layer) => {
            if (
              layer.type === "symbol" &&
              layer.layout &&
              "text-field" in layer.layout
            ) {
              map.current!.setLayoutProperty(
                layer.id,
                "visibility",
                showLabels ? "visible" : "none"
              );
            }
          });
        }

        // Set the initial position FIRST before starting animation
        // This ensures the map is fully positioned before we begin animating
        map.current!.jumpTo({
          center: [INDIA_CENTER[0] - 360, INDIA_CENTER[1]],
          zoom: 1.5,
        });

        // Give the map a moment to settle at the starting position
        setTimeout(() => {
          startIntroAnimation();
        }, 1);
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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update map style when theme changes
  useEffect(() => {
    if (!map.current) return;

    // Skip on initial mount - let initialization handle it
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const isDark = resolvedTheme === "dark";
    const mapStyle = isDark
      ? `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${config.maptilerApiKey}`
      : `https://api.maptiler.com/maps/streets-v2/style.json?key=${config.maptilerApiKey}`;

    map.current.setStyle(mapStyle);

    // Reapply projection and label visibility after style loads
    map.current.once("style.load", () => {
      if (map.current) {
        try {
          map.current.setProjection({
            type: "globe",
          } as maplibregl.ProjectionSpecification);
        } catch (_error) {
          console.warn("Globe projection not supported");
        }

        // Apply label visibility
        const style = map.current.getStyle();
        if (style?.layers) {
          style.layers.forEach((layer) => {
            if (
              layer.type === "symbol" &&
              layer.layout &&
              "text-field" in layer.layout
            ) {
              map.current!.setLayoutProperty(
                layer.id,
                "visibility",
                showLabels ? "visible" : "none"
              );
            }
          });
        }
      }
    });
  }, [resolvedTheme, introAnimationComplete, showLabels]);

  // Update label visibility when showLabels changes
  useEffect(() => {
    if (!map.current || !introAnimationComplete) return;

    const style = map.current.getStyle();
    if (style?.layers) {
      style.layers.forEach((layer) => {
        if (
          layer.type === "symbol" &&
          layer.layout &&
          "text-field" in layer.layout
        ) {
          try {
            map.current!.setLayoutProperty(
              layer.id,
              "visibility",
              showLabels ? "visible" : "none"
            );
          } catch (_error) {
            // Layer might not exist yet
          }
        }
      });
    }
  }, [showLabels, introAnimationComplete]);

  // Update markers when deployments, filters, or search changes
  useEffect(() => {
    if (
      !map.current ||
      !showMarkers ||
      isUpdatingMarkers.current ||
      isIntroAnimating.current
    )
      return;

    // Set flag to prevent concurrent updates
    isUpdatingMarkers.current = true;

    // Cancel any ongoing marker creation from previous render
    markerTimeouts.current.forEach((timeout) => clearTimeout(timeout));
    markerTimeouts.current = [];

    // Update the current deployments key
    currentDeploymentsKey.current = deploymentsKey;

    // Clear existing markers AND the elements map for highlighting
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];
    markerElementsMap.current.clear();

    // Create supercluster index only if clustering is enabled AND intro animation is complete
    // During intro, we want to show all individual markers for the animation effect
    const cluster = enableClustering && introAnimationComplete
      ? new Supercluster<Deployment>({
          radius: 60,
          maxZoom: 16,
          minPoints: 2,
        })
      : null;

    // Convert deployments to GeoJSON features
    const features = deployments.map((deployment) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [
          deployment.location.longitude,
          deployment.location.latitude,
        ],
      },
      properties: deployment,
    }));

    if (cluster) {
      cluster.load(features);
    }

    const updateMarkers = () => {
      if (!map.current) return;

      const bounds = map.current.getBounds();
      const zoom = map.current.getZoom();

      // Get clusters or individual points based on enableClustering and intro state
      // During intro animation, always show individual markers for animation effect
      const clusters =
        enableClustering && cluster && introAnimationComplete
          ? cluster.getClusters(
              [
                bounds.getWest(),
                bounds.getSouth(),
                bounds.getEast(),
                bounds.getNorth(),
              ],
              Math.floor(zoom)
            )
          : features; // If clustering disabled or intro not complete, show all features

      // Clear existing markers
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];

      // Track marker data for batch creation and animation
      const markerData: Array<{
        element: HTMLElement;
        lngLat: [number, number];
      }> = [];

      clusters.forEach((clusterPoint) => {
        const [lng, lat] = clusterPoint.geometry.coordinates;
        const properties = clusterPoint.properties;

        if (
          properties &&
          typeof properties === "object" &&
          "cluster" in properties
        ) {
          // This is a cluster
          const clusterLeaves =
            (properties as { point_count?: number }).point_count || 0;
          const clusterId = (properties as { cluster_id?: number }).cluster_id;

          // For simplicity, use first deployment's color
          const firstDeployment = deployments[0];
          const color = firstDeployment
            ? PROGRAM_COLORS[firstDeployment.program]
            : "#6B7280";

          const el = createClusterMarkerElement(clusterLeaves, color);

          el.addEventListener("click", () => {
            if (map.current && clusterId && cluster) {
              const expansionZoom = Math.min(
                cluster.getClusterExpansionZoom?.(clusterId) || zoom + 2,
                20
              );
              map.current.flyTo({
                center: [lng, lat],
                zoom: expansionZoom,
              });
            }
            if (!introAnimationComplete) {
              setIntroAnimationComplete(true);
            }
          });

          // If intro animation is not complete, add to animation queue
          if (!introAnimationComplete) {
            markerData.push({ element: el, lngLat: [lng, lat] });
          } else {
            // Intro complete, add marker directly
            const marker = new maplibregl.Marker({ element: el })
              .setLngLat([lng, lat])
              .addTo(map.current!);
            markers.current.push(marker);
          }
        } else {
          // This is a single deployment
          const deployment = properties as Deployment;
          const el = createMarkerElement(deployment.program);

          // Store the element in the map for later highlighting
          markerElementsMap.current.set(deployment.id, el);

          el.addEventListener("click", () => {
            onDeploymentClick?.(deployment);
            if (!introAnimationComplete) {
              setIntroAnimationComplete(true);
            }
          });

          // If intro animation is not complete, add to animation queue
          if (!introAnimationComplete) {
            markerData.push({ element: el, lngLat: [lng, lat] });
          } else {
            // Intro complete, add marker directly
            const marker = new maplibregl.Marker({ element: el })
              .setLngLat([lng, lat])
              .addTo(map.current!);
            markers.current.push(marker);
          }
        }
      });

      // Animate markers one by one for intro
      if (!introAnimationComplete && markerData.length > 0) {
        const renderKey = currentDeploymentsKey.current;
        markerData.forEach((data, index) => {
          const timeout = setTimeout(() => {
            // Check if this render is still valid (deployments haven't changed)
            if (currentDeploymentsKey.current !== renderKey) {
              return; // Abort - deployments changed
            }

            // Set initial state BEFORE adding to map
            data.element.style.opacity = "0";
            data.element.style.transform = "scale(0)";
            data.element.style.transition =
              "all 1.2s cubic-bezier(0.22, 1, 0.36, 1)";
            data.element.style.willChange = "transform, opacity";
            data.element.style.transformOrigin = "center center";

            // Add to map with styles already applied
            const marker = new maplibregl.Marker({ element: data.element })
              .setLngLat(data.lngLat)
              .addTo(map.current!);
            markers.current.push(marker);

            // Previously we auto-completed intro after last marker. Now we wait for user interaction.
            // Intro will finish when user clicks any marker or cluster.
          }, index * 30); // 30ms between each marker for smoother cascade
          markerTimeouts.current.push(timeout);
        });
      } else if (!introAnimationComplete && markerData.length === 0) {
        // No markers to animate, set intro complete immediately
        setTimeout(() => {
          setIntroAnimationComplete(true);
        }, 1500);
      }
    };

    // Initial marker update
    if (map.current.isStyleLoaded()) {
      updateMarkers();
      isUpdatingMarkers.current = false;
    } else {
      map.current.once("load", () => {
        updateMarkers();
        isUpdatingMarkers.current = false;
      });
    }

    // Only update markers on move/zoom if clustering is enabled
    // When clustering is disabled, markers stay fixed and don't need updates
    if (enableClustering) {
      const handleMapUpdate = () => {
        if (
          introAnimationComplete &&
          !isUpdatingMarkers.current &&
          !isIntroAnimating.current
        ) {
          isUpdatingMarkers.current = true;
          updateMarkers();
          isUpdatingMarkers.current = false;
        }
      };

      map.current.on("moveend", handleMapUpdate);
      map.current.on("zoomend", handleMapUpdate);

      return () => {
        isUpdatingMarkers.current = false;
        if (map.current) {
          map.current.off("moveend", handleMapUpdate);
          map.current.off("zoomend", handleMapUpdate);
        }
      };
    }

    return () => {
      isUpdatingMarkers.current = false;
      // Clear any pending marker creation timeouts
      markerTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      markerTimeouts.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deploymentsKey, showMarkers, introAnimationComplete, enableClustering]);

  // Handle highlighting without re-rendering markers
  useEffect(() => {
    if (!introAnimationComplete) return;

    // Reset all marker styles to normal circles
    markerElementsMap.current.forEach((element) => {
      // Remove pin if it exists
      const pinSvg = element.querySelector(".map-pin-overlay");
      if (pinSvg) {
        pinSvg.remove();
      }
      element.style.transform = "scale(1)";
      element.style.zIndex = "0";
      element.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
      element.style.transition = "transform 0.8s ease, box-shadow 0.5s ease";
    });

    // Highlight the selected marker with map pin icon overlay
    if (highlightedDeploymentId) {
      const element = markerElementsMap.current.get(highlightedDeploymentId);
      if (element) {
        // Get the marker color
        const markerColor = element.style.backgroundColor;

        // Create SVG pin overlay
        const pinSvg = document.createElement("div");
        pinSvg.className = "map-pin-overlay";
        pinSvg.innerHTML = `
          <svg width="40" height="40" viewBox="0 -1 45 50" style="position: absolute; left: -11px; top: -28px; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.3));">
            <path d="M20 0C12.3 0 6 6.3 6 14c0 10.5 14 28 14 28s14-17.5 14-28c0-7.7-6.3-14-14-14zm0 19c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z" 
                  fill="${markerColor}" 
                  stroke="white" 
                  stroke-width="2"/>
            <circle cx="20" cy="14" r="4" fill="white" opacity="0.9"/>
          </svg>
        `;

        element.appendChild(pinSvg);
        element.style.transform = "scale(1.2)";
        element.style.zIndex = "100";
        element.style.transition = "all 0.7s ease";
      }
    }
  }, [highlightedDeploymentId, introAnimationComplete]);

  // Zoom to highlighted deployment or zoom out when deselected
  useEffect(() => {
    if (!map.current || !introAnimationComplete) return;

    if (highlightedDeploymentId) {
      // Zoom in to selected deployment
      const deployment = deployments.find(
        (d) => d.id === highlightedDeploymentId
      );
      if (deployment) {
        map.current.flyTo({
          center: [deployment.location.longitude, deployment.location.latitude],
          zoom: 10,
          duration: 1500,
          essential: true,
        });
      }
      previousHighlightedId.current = highlightedDeploymentId;
    } else if (previousHighlightedId.current !== null) {
      // Only zoom out if we're actively deselecting (had a highlighted deployment before)
      // This prevents the double animation on initial load
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      map.current.flyTo({
        center: INDIA_CENTER,
        zoom: isMobile ? 3.8 : 4.5,
        duration: 1500,
        essential: true,
        easing: (t) => Math.min(1, 100 * t),
      });
      previousHighlightedId.current = null;
    }
  }, [highlightedDeploymentId, deployments, introAnimationComplete]);

  // If user selects a location from outside (sheet) before intro completes, finish intro immediately
  useEffect(() => {
    if (!introAnimationComplete && highlightedDeploymentId) {
      setIntroAnimationComplete(true);
    }
  }, [highlightedDeploymentId, introAnimationComplete]);

  return <div ref={mapContainer} className="h-full w-full" />;
}
