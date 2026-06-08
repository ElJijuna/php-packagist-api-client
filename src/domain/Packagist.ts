export type PackageName = `${string}/${string}`;

export interface PackageListOptions {
  vendor?: string;
  type?: string;
  fields?: Array<'repository' | 'type' | 'abandoned'>;
}

export interface PackageListResponse {
  packageNames?: PackageName[];
  packages?: Record<PackageName, PackageListEntry>;
  /** @deprecated Packagist docs show this key, but live API returns `packages`. */
  package?: Record<PackageName, PackageListEntry>;
}

export interface PackageListEntry {
  repository?: string;
  type?: string;
  abandoned?: boolean | string;
}

export interface PopularPackagesOptions {
  page?: number;
  perPage?: number;
}

export interface PopularPackagesResponse {
  packages: PackageSummary[];
  total: number;
  next?: string | null;
}

export interface SearchPackagesOptions {
  query?: string;
  tags?: string | string[];
  type?: string;
  page?: number;
  perPage?: number;
}

export interface SearchPackagesResponse {
  results: PackageSummary[];
  total: number;
  next?: string | null;
}

export interface PackageSummary {
  name: PackageName;
  description?: string;
  url: string;
  repository?: string;
  downloads?: number;
  favers?: number;
}

export interface PackageResponse {
  package: PackageData;
}

export interface PackageData {
  name: PackageName;
  description?: string;
  time?: string;
  maintainers?: Maintainer[];
  versions: Record<string, PackageVersion>;
  type?: string;
  repository?: string;
  downloads?: DownloadStats;
  favers?: number;
  abandoned?: boolean | string;
}

export interface Maintainer {
  name: string;
  avatar_url?: string;
}

export interface PackageVersion {
  name?: PackageName;
  description?: string;
  version: string;
  version_normalized?: string;
  type?: string;
  time?: string;
  require?: Record<string, string>;
  require_dev?: Record<string, string>;
  conflict?: Record<string, string>;
  replace?: Record<string, string>;
  provide?: Record<string, string>;
  suggest?: Record<string, string>;
  license?: string[];
  authors?: PackageAuthor[];
  source?: PackageSource;
  dist?: PackageDist;
  autoload?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  bin?: string[];
}

export interface PackageAuthor {
  name?: string;
  email?: string;
  homepage?: string;
  role?: string;
}

export interface PackageSource {
  type: string;
  url: string;
  reference: string;
}

export interface PackageDist {
  type: string;
  url: string;
  reference?: string;
  shasum?: string;
}

export interface MetadataOptions {
  dev?: boolean;
}

export interface PackageMetadataResponse {
  packages: Record<PackageName, PackageVersion[]>;
  minified?: string;
}

export interface PackageStatsResponse {
  downloads: DownloadStats;
  versions: string[];
  date?: string;
  favers?: number;
}

export interface DownloadStats {
  total: number;
  monthly: number;
  daily: number;
}

export interface MetadataChangesOptions {
  since?: number;
}

export interface MetadataChangesResponse {
  timestamp?: number;
  actions?: MetadataChange[];
  error?: string;
}

export interface MetadataChange {
  type: 'update' | 'delete' | 'resync';
  package: PackageName | `${PackageName}~dev` | '*';
  time: number;
}

export interface StatisticsResponse {
  totals: {
    downloads: number;
  };
}

export interface SecurityAdvisoriesOptions {
  packages?: Array<PackageName | `pkg:composer/${string}/${string}`>;
  updatedSince?: number;
}

export interface SecurityAdvisoriesResponse {
  advisories: Record<string, SecurityAdvisory[]>;
}

export interface SecurityAdvisory {
  advisoryId: string;
  packageName: PackageName;
  remoteId?: string;
  title: string;
  link?: string;
  cve?: string | null;
  affectedVersions: string;
  source?: string;
  sources?: SecurityAdvisorySource[];
  reportedAt?: string;
  composerRepository?: string;
  severity?: string | null;
}

export interface SecurityAdvisorySource {
  name: string;
  remoteId: string;
}

export interface PackageMutationResponse {
  status: string;
}

export interface PackageUpdateResponse extends PackageMutationResponse {
  jobs?: string[];
}
