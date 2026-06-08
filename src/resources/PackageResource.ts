import type {
  MetadataOptions,
  PackageMetadataResponse,
  PackageName,
  PackageResponse,
  PackageStatsResponse,
  SecurityAdvisoriesResponse,
} from '../domain/Packagist';
import type { RequestFn } from './types';

/**
 * Chainable resource for one Packagist package.
 *
 * @example
 * ```typescript
 * const pkg = await packagist.package('monolog/monolog');
 * const metadata = await packagist.package('monolog/monolog').metadata();
 * const stats = await packagist.package('monolog/monolog').stats();
 * ```
 */
export class PackageResource implements PromiseLike<PackageResponse> {
  /**
   * @param request - Internal request function from the client.
   * @param name - Composer package name in `vendor/package` form.
   * @internal
   */
  constructor(
    private readonly request: RequestFn,
    private readonly name: PackageName,
  ) {}

  /**
   * Allows the resource to be awaited directly.
   *
   * Awaiting a `PackageResource` delegates to {@link PackageResource.get}.
   */
  async then<TResult1 = PackageResponse, TResult2 = never>(
    onfulfilled?: ((value: PackageResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    try {
      const value = await this.get();
      return onfulfilled ? onfulfilled(value) : (value as TResult1);
    } catch (error) {
      if (onrejected) {
        return onrejected(error);
      }
      throw error;
    }
  }

  /**
   * Gets full JSON API package data.
   *
   * `GET /packages/[vendor]/[package].json`
   *
   * @param signal - Optional abort signal.
   * @returns Full package data, including versions, maintainers, downloads, and repository info.
   */
  async get(signal?: AbortSignal): Promise<PackageResponse> {
    return this.request<PackageResponse>(`/packages/${this.name}.json`, undefined, 'api', signal);
  }

  /**
   * Gets Composer v2 metadata from repo.packagist.org.
   *
   * `GET /p2/[vendor]/[package].json`
   *
   * @param options - Metadata selection options.
   * @param signal - Optional abort signal.
   * @returns Composer v2 metadata for tagged releases or dev versions.
   */
  async metadata(
    options: MetadataOptions = {},
    signal?: AbortSignal,
  ): Promise<PackageMetadataResponse> {
    const suffix = options.dev ? '~dev' : '';
    return this.request<PackageMetadataResponse>(
      `/p2/${this.name}${suffix}.json`,
      undefined,
      'repo',
      signal,
    );
  }

  /**
   * Gets download stats for this package.
   *
   * `GET /packages/[vendor]/[package]/stats.json`
   *
   * @param signal - Optional abort signal.
   * @returns Download counts and version list for the package.
   */
  async stats(signal?: AbortSignal): Promise<PackageStatsResponse> {
    return this.request<PackageStatsResponse>(
      `/packages/${this.name}/stats.json`,
      undefined,
      'api',
      signal,
    );
  }

  /**
   * Gets security advisories for this package.
   *
   * `GET /api/security-advisories/?packages[]=[vendor/package]`
   *
   * @param signal - Optional abort signal.
   * @returns Security advisories keyed by this package name.
   */
  async securityAdvisories(signal?: AbortSignal): Promise<SecurityAdvisoriesResponse> {
    return this.request<SecurityAdvisoriesResponse>(
      '/api/security-advisories/',
      { 'packages[]': [this.name] },
      'api',
      signal,
    );
  }
}
