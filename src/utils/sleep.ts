/**
 * Promise-based sleep utility
 * @param ms - milliseconds to delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
