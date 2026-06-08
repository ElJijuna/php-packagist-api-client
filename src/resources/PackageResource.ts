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
 */
export class PackageResource implements PromiseLike<PackageResponse> {
  constructor(
    private readonly request: RequestFn,
    private readonly name: PackageName,
  ) {}

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
   */
  async get(signal?: AbortSignal): Promise<PackageResponse> {
    return this.request<PackageResponse>(`/packages/${this.name}.json`, undefined, 'api', signal);
  }

  /**
   * Gets Composer v2 metadata from repo.packagist.org.
   *
   * `GET /p2/[vendor]/[package].json`
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
