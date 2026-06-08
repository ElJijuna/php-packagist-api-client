import type {
  MetadataChangesOptions,
  MetadataChangesResponse,
  PackageListOptions,
  PackageListResponse,
  PackageMutationResponse,
  PackageName,
  PackageUpdateResponse,
  PopularPackagesOptions,
  PopularPackagesResponse,
  SearchPackagesOptions,
  SearchPackagesResponse,
  SecurityAdvisoriesOptions,
  SecurityAdvisoriesResponse,
  StatisticsResponse,
} from './domain/Packagist';
import { PackagistApiError } from './errors/PackagistApiError';
import { PackageResource } from './resources/PackageResource';
import type { QueryValue } from './resources/types';

const DEFAULT_API_URL = 'https://packagist.org';
const DEFAULT_REPO_URL = 'https://repo.packagist.org';

export interface RequestEvent {
  /** Full URL requested, including query string. */
  url: string;
  /** HTTP method used for the request. */
  method: 'GET' | 'POST' | 'PUT';
  /** Timestamp captured immediately before `fetch` runs. */
  startedAt: Date;
  /** Timestamp captured after success or failure. */
  finishedAt: Date;
  /** Request duration in milliseconds. */
  durationMs: number;
  /** HTTP status code, if Packagist returned a response. */
  statusCode?: number;
  /** Error thrown by fetch or by Packagist non-2xx handling. */
  error?: Error;
}

/** Event callbacks supported by {@link PackagistClient}. */
export interface PackagistClientEvents {
  /** Emitted once per HTTP request, including failed requests. */
  request: (event: RequestEvent) => void;
}

/** Constructor options for {@link PackagistClient}. */
export interface PackagistClientOptions {
  /** Base URL for Packagist JSON API. Defaults to `https://packagist.org`. */
  apiUrl?: string;
  /** Base URL for Composer v2 metadata. Defaults to `https://repo.packagist.org`. */
  repoUrl?: string;
  /** Packagist username for authenticated endpoints. */
  username?: string;
  /** Packagist API token paired with `username`. */
  apiToken?: string;
  /** User-Agent sent with all requests. Packagist recommends including contact email. */
  userAgent?: string;
}

/**
 * Main entry point for the Packagist API.
 *
 * @example
 * ```typescript
 * import { PackagistClient } from 'php-packagist-api-client';
 *
 * const packagist = new PackagistClient({
 *   userAgent: 'my-app (mailto:me@example.com)',
 * });
 *
 * const pkg = await packagist.package('monolog/monolog');
 * const search = await packagist.search({ query: 'logger', perPage: 5 });
 * ```
 */
export class PackagistClient {
  private readonly apiUrl: string;
  private readonly repoUrl: string;
  private readonly username?: string;
  private readonly apiToken?: string;
  private readonly userAgent?: string;
  private readonly listeners: Map<
    keyof PackagistClientEvents,
    PackagistClientEvents[keyof PackagistClientEvents][]
  > = new Map();

  constructor(options: PackagistClientOptions = {}) {
    this.apiUrl = (options.apiUrl ?? DEFAULT_API_URL).replace(/\/$/, '');
    this.repoUrl = (options.repoUrl ?? DEFAULT_REPO_URL).replace(/\/$/, '');
    this.username = options.username;
    this.apiToken = options.apiToken;
    this.userAgent = options.userAgent;
  }

  /**
   * Subscribes to client request events.
   *
   * @param event - Event name to subscribe to.
   * @param callback - Function invoked after each request succeeds or fails.
   * @returns The current client for chaining.
   */
  on<K extends keyof PackagistClientEvents>(event: K, callback: PackagistClientEvents[K]): this {
    const callbacks = this.listeners.get(event) ?? [];
    callbacks.push(callback);
    this.listeners.set(event, callbacks);
    return this;
  }

  /**
   * Creates an awaitable resource for one Packagist package.
   *
   * The returned resource can be awaited directly, or used to access package
   * metadata, stats, and advisories.
   *
   * @param name - Composer package name in `vendor/package` form.
   * @returns Chainable package resource.
   */
  package(name: PackageName): PackageResource {
    return new PackageResource(
      <T>(
        path: string,
        params?: Record<string, QueryValue | undefined>,
        baseUrl?: string,
        signal?: AbortSignal,
      ) => this.request<T>('GET', path, params, undefined, baseUrl, signal),
      name,
    );
  }

  /**
   * Lists package names from Packagist.
   *
   * Wraps `GET /packages/list.json`. Supports filtering by vendor or package
   * type, and can request extra fields such as repository URL, package type,
   * and abandoned status.
   *
   * @param options - Optional vendor/type filters and extra fields.
   * @param signal - Optional abort signal.
   * @returns Package names, or package metadata when fields are requested.
   */
  async listPackages(
    options: PackageListOptions = {},
    signal?: AbortSignal,
  ): Promise<PackageListResponse> {
    return this.request<PackageListResponse>(
      'GET',
      '/packages/list.json',
      {
        vendor: options.vendor,
        type: options.type,
        'fields[]': options.fields,
      },
      undefined,
      'api',
      signal,
    );
  }

  /**
   * Lists popular packages ranked by recent downloads.
   *
   * Wraps `GET /explore/popular.json`.
   *
   * @param options - Pagination options.
   * @param signal - Optional abort signal.
   * @returns Popular package summaries and pagination metadata.
   */
  async popular(
    options: PopularPackagesOptions = {},
    signal?: AbortSignal,
  ): Promise<PopularPackagesResponse> {
    return this.request<PopularPackagesResponse>(
      'GET',
      '/explore/popular.json',
      { per_page: options.perPage, page: options.page },
      undefined,
      'api',
      signal,
    );
  }

  /**
   * Searches packages by query, tag, type, or combined filters.
   *
   * Wraps `GET /search.json`. At least one of `query`, `tags`, or `type`
   * must be provided.
   *
   * @param options - Search filters and pagination options.
   * @param signal - Optional abort signal.
   * @returns Search results from Packagist.
   */
  async search(
    options: SearchPackagesOptions,
    signal?: AbortSignal,
  ): Promise<SearchPackagesResponse> {
    const hasQuery = options.query?.trim();
    const tags = Array.isArray(options.tags) ? options.tags : options.tags ? [options.tags] : [];
    const hasType = options.type?.trim();
    if (!hasQuery && tags.length === 0 && !hasType) {
      throw new TypeError('Packagist search requires query, tags, or type');
    }

    return this.request<SearchPackagesResponse>(
      'GET',
      '/search.json',
      {
        q: hasQuery,
        'tags[]': tags.length > 1 ? tags : undefined,
        tags: tags.length === 1 ? tags[0] : undefined,
        type: hasType,
        page: options.page,
        per_page: options.perPage,
      },
      undefined,
      'api',
      signal,
    );
  }

  /**
   * Polls Packagist metadata changes.
   *
   * Wraps `GET /metadata/changes.json`. Pass a stored timestamp in `since` to
   * fetch package updates/deletes since that point.
   *
   * @param options - Timestamp filter.
   * @param signal - Optional abort signal.
   * @returns Metadata change actions or initialization timestamp/error payload.
   */
  async metadataChanges(
    options: MetadataChangesOptions = {},
    signal?: AbortSignal,
  ): Promise<MetadataChangesResponse> {
    return this.request<MetadataChangesResponse>(
      'GET',
      '/metadata/changes.json',
      { since: options.since },
      undefined,
      'api',
      signal,
    );
  }

  /**
   * Gets global Packagist statistics.
   *
   * Wraps `GET /statistics.json`.
   *
   * @param signal - Optional abort signal.
   * @returns Total download statistics.
   */
  async statistics(signal?: AbortSignal): Promise<StatisticsResponse> {
    return this.request<StatisticsResponse>(
      'GET',
      '/statistics.json',
      undefined,
      undefined,
      'api',
      signal,
    );
  }

  /**
   * Lists security advisories for packages or updates since a timestamp.
   *
   * Wraps `GET /api/security-advisories/`.
   *
   * @param options - Package names/PURLs or `updatedSince` timestamp.
   * @param signal - Optional abort signal.
   * @returns Advisories keyed by package name.
   */
  async securityAdvisories(
    options: SecurityAdvisoriesOptions,
    signal?: AbortSignal,
  ): Promise<SecurityAdvisoriesResponse> {
    if (!options.packages?.length && options.updatedSince === undefined) {
      throw new TypeError('Packagist security advisories require packages or updatedSince');
    }

    return this.request<SecurityAdvisoriesResponse>(
      'GET',
      '/api/security-advisories/',
      {
        'packages[]': options.packages,
        updatedSince: options.updatedSince,
      },
      undefined,
      'api',
      signal,
    );
  }

  /**
   * Creates a Packagist package from a repository URL.
   *
   * Requires authentication with the MAIN token.
   *
   * @param repository - Source repository URL.
   * @param signal - Optional abort signal.
   * @returns Mutation status.
   */
  async createPackage(repository: string, signal?: AbortSignal): Promise<PackageMutationResponse> {
    return this.request<PackageMutationResponse>(
      'POST',
      '/api/create-package',
      undefined,
      { repository },
      'api',
      signal,
    );
  }

  /**
   * Edits the repository URL for an existing package.
   *
   * Requires authentication with the MAIN token.
   *
   * @param name - Package name in `vendor/package` form.
   * @param repository - New source repository URL.
   * @param signal - Optional abort signal.
   * @returns Mutation status.
   */
  async editPackage(
    name: PackageName,
    repository: string,
    signal?: AbortSignal,
  ): Promise<PackageMutationResponse> {
    return this.request<PackageMutationResponse>(
      'PUT',
      `/api/packages/${name}`,
      undefined,
      { repository },
      'api',
      signal,
    );
  }

  /**
   * Triggers Packagist update for a repository or package URL.
   *
   * Requires authentication with a SAFE or MAIN token.
   *
   * @param repository - Repository URL or Packagist package URL.
   * @param signal - Optional abort signal.
   * @returns Update status and queued job IDs when provided by Packagist.
   */
  async updatePackage(repository: string, signal?: AbortSignal): Promise<PackageUpdateResponse> {
    return this.request<PackageUpdateResponse>(
      'POST',
      '/api/update-package',
      undefined,
      { repository },
      'api',
      signal,
    );
  }

  private emit<K extends keyof PackagistClientEvents>(
    event: K,
    payload: Parameters<PackagistClientEvents[K]>[0],
  ): void {
    const callbacks = this.listeners.get(event) ?? [];
    for (const callback of callbacks) {
      (callback as (event: typeof payload) => void)(payload);
    }
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    params?: Record<string, QueryValue | undefined>,
    body?: unknown,
    baseUrl = 'api',
    signal?: AbortSignal,
  ): Promise<T> {
    const base = baseUrl === 'repo' ? this.repoUrl : this.apiUrl;
    const url = buildUrl(`${base}${path}`, params);
    const startedAt = new Date();
    let statusCode: number | undefined;

    try {
      const response = await fetch(url, {
        method,
        headers: this.headers(body !== undefined),
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      });
      statusCode = response.status;
      if (!response.ok) {
        throw new PackagistApiError(response.status, response.statusText);
      }
      const data = (await response.json()) as T;
      this.emit('request', {
        url,
        method,
        startedAt,
        finishedAt: new Date(),
        durationMs: Date.now() - startedAt.getTime(),
        statusCode,
      });
      return data;
    } catch (error) {
      const finishedAt = new Date();
      this.emit('request', {
        url,
        method,
        startedAt,
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        statusCode,
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }

  private headers(hasJsonBody: boolean): Record<string, string> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.userAgent) {
      headers['User-Agent'] = this.userAgent;
    }
    if (hasJsonBody) {
      headers['Content-Type'] = 'application/json';
    }
    if (this.username && this.apiToken) {
      headers.Authorization = `Bearer ${this.username}:${this.apiToken}`;
    }
    return headers;
  }
}

function buildUrl(url: string, params?: Record<string, QueryValue | undefined>): string {
  const parsed = new URL(url);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined) {
      continue;
    }
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      parsed.searchParams.append(key, String(item));
    }
  }
  return parsed.toString();
}
