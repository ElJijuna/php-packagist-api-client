/**
 * Thrown when Packagist returns a non-2xx response.
 */
export class PackagistApiError extends Error {
  readonly status: number;
  readonly statusText: string;

  constructor(status: number, statusText: string) {
    super(`Packagist API error: ${status} ${statusText}`);
    this.name = 'PackagistApiError';
    this.status = status;
    this.statusText = statusText;
  }
}
