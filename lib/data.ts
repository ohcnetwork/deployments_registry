import type { DeploymentData } from "@/types/deployment";
import deploymentsJson from "@/public/deployments.json";

/**
 * Load deployment data from static JSON file
 */
export function getDeployments(): DeploymentData {
  return deploymentsJson as DeploymentData;
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
