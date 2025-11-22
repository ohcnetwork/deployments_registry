/**
 * Application configuration loaded from environment variables
 * This enables white-labeling of the application
 *
 * Note: Next.js requires direct references to process.env variables
 * for static analysis at build time. Dynamic keys don't work.
 */

export interface AppConfig {
  maptilerApiKey: string;
  appName: string;
  appDescription: string;
  organizationName: string;
  organizationUrl: string;
  organizationLogo: string;
  enableClusteringByDefault: boolean;
}

export const config: AppConfig = {
  maptilerApiKey: process.env.NEXT_PUBLIC_MAPTILER_API_KEY || "",
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Care Deployments Registry",
  appDescription:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
    "Open Healthcare Network's Global registry of deployments on an interactive map",
  organizationName:
    process.env.NEXT_PUBLIC_ORGANIZATION_NAME || "Open Healthcare Network",
  organizationUrl:
    process.env.NEXT_PUBLIC_ORGANIZATION_URL || "https://ohc.network",
  organizationLogo:
    process.env.NEXT_PUBLIC_ORGANIZATION_LOGO ||
    "/Open_Healthcrae_Network-light-logo.svg",
  enableClusteringByDefault:
    process.env.NEXT_PUBLIC_ENABLE_CLUSTERING_BY_DEFAULT === "true",
};
