import { env } from "./env.config";

/**
 * Builds a full URL for the indexer API endpoint.
 * Handles trailing slashes in the base URL to prevent double slashes.
 */
export function getIndexerUrl(path: string): string {
  if (!env.indexerApiUrl) {
    throw new Error("Indexer API URL is not configured");
  }

  const baseUrl = env.indexerApiUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}
