/**
 * Join base URL and path safely using URL constructor
 * This is the ONLY place URL building happens in the entire codebase
 * @param base - base URL (e.g., "http://localhost:3001")
 * @param path - relative path (e.g., "/users" or "users")
 * @returns full URL string
 */
export function joinUrl(base: string, path: string): string {
  // Normalize: strip trailing slash from base, ensure leading slash on path
  const cleanBase = base.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(cleanPath, cleanBase + '/').toString();
}
