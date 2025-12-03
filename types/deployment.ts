/**
 * TypeScript types for deployment data
 */

export type ProgramType = "10bedicu" | "keralacare" | "palliative-ngo" | "hmis";

export interface Address {
  street?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: Address;
}

export interface Deployment {
  id: string;
  name: string;
  description: string;
  program: ProgramType;
  location: Location;
  dateDeployed?: string; // ISO 8601 date string
  website?: string;
  status?: "active" | "planning" | "deployed";
  organization?: string;
}

export interface DeploymentData {
  version: string;
  lastUpdated: string;
  deployments: Deployment[];
}

export interface DeploymentStats {
  total: number;
  byProgram: Record<ProgramType, number>;
}
