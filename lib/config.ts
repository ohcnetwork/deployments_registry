/**
 * Application configuration loaded from environment variables
 * This enables white-labeling of the application
 */

export interface AppConfig {
  maptilerApiKey: string;
  appName: string;
  appDescription: string;
  organizationName: string;
  organizationUrl: string;
}

function getEnvVar(key: string, defaultValue: string): string {
  if (typeof window === "undefined") {
    // Server-side
    return process.env[key] || defaultValue;
  }
  // Client-side - Next.js injects NEXT_PUBLIC_ vars at build time
  return process.env[key] || defaultValue;
}

export const config: AppConfig = {
  maptilerApiKey:
    getEnvVar("NEXT_PUBLIC_MAPTILER_API_KEY", "rodPTx1wphnt4LwxwOyQ"),
  appName: getEnvVar("NEXT_PUBLIC_APP_NAME", "Deployments Registry"),
  appDescription: getEnvVar(
    "NEXT_PUBLIC_APP_DESCRIPTION",
    "Global registry of deployments on an interactive map"
  ),
  organizationName: getEnvVar(
    "NEXT_PUBLIC_ORGANIZATION_NAME",
    "Your Organization"
  ),
  organizationUrl: getEnvVar(
    "NEXT_PUBLIC_ORGANIZATION_URL",
    "https://example.com"
  ),
};
