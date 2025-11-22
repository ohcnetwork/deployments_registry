import type { DeploymentData } from "@/types/deployment";
import deploymentsJson from "@/public/deployments.json";

// Cache the deployment data to avoid re-parsing JSON on every call
let cachedDeploymentData: DeploymentData | null = null;

/**
 * Load deployment data from static JSON file with caching
 */
export function getDeployments(): DeploymentData {
  // Return cached data if available
  if (cachedDeploymentData) {
    return cachedDeploymentData;
  }

  // Parse and cache the data
  cachedDeploymentData = deploymentsJson as DeploymentData;
  return cachedDeploymentData;
}

/**
 * Calculate statistics from deployment data
 */
export function calculateStats(data: DeploymentData) {
  const byProgram = data.deployments.reduce(
    (acc, deployment) => {
      acc[deployment.program] = (acc[deployment.program] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    total: data.deployments.length,
    byProgram,
  };
}
