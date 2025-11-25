import type { ProgramType } from "@/types/deployment";

/**
 * Color scheme for different program types
 * Using vibrant colors that work well on maps
 */
export const PROGRAM_COLORS: Record<ProgramType, string> = {
  "10bedicu": "#3B82F6", // Blue
  "kerala-care": "#10B981", // Green
  "palliative-ngo": "#A855F7", // Purple
  hmis: "#F59E0B", // Orange
};

/**
 * Get display name for program type
 */
export const PROGRAM_LABELS: Record<ProgramType, string> = {
  "10bedicu": "10 Bed ICU",
  "kerala-care": "Kerala Care",
  "palliative-ngo": "Palliative NGO",
  hmis: "HMIS",
};

/**
 * Create a marker element for the map
 */
export function createMarkerElement(
  program: ProgramType,
  isCluster = false
): HTMLDivElement {
  const el = document.createElement("div");
  el.className = isCluster ? "cluster-marker" : "deployment-marker";
  el.style.width = isCluster ? "30px" : "16px";
  el.style.height = isCluster ? "30px" : "16px";
  el.style.borderRadius = "50%";
  el.style.backgroundColor = PROGRAM_COLORS[program];
  el.style.border = "1px solid white";
  el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
  el.style.cursor = "pointer";
  // Removed transition to prevent visual "popping" during map movement

  return el;
}

/**
 * Create a cluster marker element
 */
export function createClusterMarkerElement(
  count: number,
  color: string
): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "cluster-marker";
  el.style.width = "40px";
  el.style.height = "40px";
  el.style.borderRadius = "50%";
  el.style.backgroundColor = color;
  el.style.border = "2px solid white";
  el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
  el.style.cursor = "pointer";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.color = "white";
  el.style.fontWeight = "bold";
  el.style.fontSize = "12px";
  // Removed transition to prevent visual "popping" during map movement

  el.textContent = count.toString();

  return el;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
