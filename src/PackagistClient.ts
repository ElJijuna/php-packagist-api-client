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
  url: string;
  method: 'GET' | 'POST' | 'PUT';
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
  statusCode?: number;
  error?: Error;
}

export interface PackagistClientEvents {
  request: (event: RequestEvent) => void;
}

export interface PackagistClientOptions {
  apiUrl?: string;
  repoUrl?: string;
  username?: string;
  apiToken?: string;
  userAgent?: string;
}

/**
 * Main entry point for Packagist API.
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

  on<K extends keyof PackagistClientEvents>(event: K, callback: PackagistClientEvents[K]): this {
    const callbacks = this.listeners.get(event) ?? [];
    callbacks.push(callback);
    this.listeners.set(event, callbacks);
    return this;
  }

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
    if (this.userAgent) headers['User-Agent'] = this.userAgent;
    if (hasJsonBody) headers['Content-Type'] = 'application/json';
    if (this.username && this.apiToken) {
      headers.Authorization = `Bearer ${this.username}:${this.apiToken}`;
    }
    return headers;
  }
}

function buildUrl(url: string, params?: Record<string, QueryValue | undefined>): string {
  const parsed = new URL(url);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined) continue;
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      parsed.searchParams.append(key, String(item));
    }
  }
  return parsed.toString();
}
