/**
 * Thrown when Packagist returns a non-2xx response.
 *
 * @example
 * ```typescript
 * try {
 *   await packagist.package('missing/package').get();
 * } catch (error) {
 *   if (error instanceof PackagistApiError) {
 *     console.log(error.status);
 *   }
 * }
 * ```
 */
export class PackagistApiError extends Error {
  /** HTTP status code returned by Packagist. */
  readonly status: number;
  /** HTTP status text returned by Packagist. */
  readonly statusText: string;

  /**
   * @param status - HTTP status code.
   * @param statusText - HTTP status text.
   */
  constructor(status: number, statusText: string) {
    super(`Packagist API error: ${status} ${statusText}`);
    this.name = 'PackagistApiError';
    this.status = status;
    this.statusText = statusText;
  }
}
