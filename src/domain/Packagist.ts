/** Composer package name in canonical `vendor/package` form. */
export type PackageName = `${string}/${string}`;

/** Filters for `GET /packages/list.json`. */
export interface PackageListOptions {
  /** Restrict list to one vendor/organization. */
  vendor?: string;
  /** Restrict list to one Composer package type. */
  type?: string;
  /** Extra fields to include for every package. */
  fields?: Array<'repository' | 'type' | 'abandoned'>;
}

/** Response returned by package listing endpoints. */
export interface PackageListResponse {
  /** Package names returned when no extra fields are requested. */
  packageNames?: PackageName[];
  /** Package metadata keyed by name when `fields` are requested. */
  packages?: Record<PackageName, PackageListEntry>;
  /** @deprecated Packagist docs show this key, but live API returns `packages`. */
  package?: Record<PackageName, PackageListEntry>;
}

/** Extra package data returned by `listPackages({ fields })`. */
export interface PackageListEntry {
  /** Source repository URL. */
  repository?: string;
  /** Composer package type, such as `library` or `composer-plugin`. */
  type?: string;
  /** Abandoned marker, or replacement package name when Packagist provides one. */
  abandoned?: boolean | string;
}

/** Pagination options for popular packages. */
export interface PopularPackagesOptions {
  /** Page number. */
  page?: number;
  /** Results per page. Packagist supports up to 100. */
  perPage?: number;
}

/** Response returned by `GET /explore/popular.json`. */
export interface PopularPackagesResponse {
  /** Popular package summaries. */
  packages: PackageSummary[];
  /** Total matching packages. */
  total: number;
  /** Absolute URL for next page, if present. */
  next?: string | null;
}

/** Search filters for `GET /search.json`. */
export interface SearchPackagesOptions {
  /** Text query. Sent as Packagist `q`. */
  query?: string;
  /** One tag or multiple tags. Multiple tags are sent as repeated `tags[]`. */
  tags?: string | string[];
  /** Composer package type filter. */
  type?: string;
  /** Page number. */
  page?: number;
  /** Results per page. Sent as Packagist `per_page`. */
  perPage?: number;
}

/** Response returned by `GET /search.json`. */
export interface SearchPackagesResponse {
  /** Search result package summaries. */
  results: PackageSummary[];
  /** Total matches. */
  total: number;
  /** Absolute URL for next page, if present. */
  next?: string | null;
}

/** Compact package summary returned by search and popular endpoints. */
export interface PackageSummary {
  /** Composer package name. */
  name: PackageName;
  /** Package description from composer metadata. */
  description?: string;
  /** Packagist package URL. */
  url: string;
  /** Source repository URL when available. */
  repository?: string;
  /** Download count returned by summary endpoints. */
  downloads?: number;
  /** Packagist favorites plus GitHub stars. */
  favers?: number;
}

/** Full package response returned by Packagist JSON API. */
export interface PackageResponse {
  /** Full package data. */
  package: PackageData;
}

/** Full package data returned by `GET /packages/[vendor]/[package].json`. */
export interface PackageData {
  /** Composer package name. */
  name: PackageName;
  /** Package description. */
  description?: string;
  /** Packagist package creation time. */
  time?: string;
  /** Packagist maintainers. */
  maintainers?: Maintainer[];
  /** Version metadata keyed by version string. */
  versions: Record<string, PackageVersion>;
  /** Composer package type. */
  type?: string;
  /** Source repository URL. */
  repository?: string;
  /** Download stats embedded in full package response. */
  downloads?: DownloadStats;
  /** Packagist favorites plus GitHub stars. */
  favers?: number;
  /** Abandoned marker, or replacement package name when Packagist provides one. */
  abandoned?: boolean | string;
}

/** Packagist maintainer summary. */
export interface Maintainer {
  /** Packagist username. */
  name: string;
  /** Avatar URL when provided by Packagist. */
  avatar_url?: string;
}

/** Composer package version metadata. */
export interface PackageVersion {
  /** Package name. Present on expanded metadata entries. */
  name?: PackageName;
  /** Version description. */
  description?: string;
  /** Version string. */
  version: string;
  /** Normalized Composer version string. */
  version_normalized?: string;
  /** Composer package type. */
  type?: string;
  /** Release time. */
  time?: string;
  /** Runtime dependency constraints. */
  require?: Record<string, string>;
  /** Development dependency constraints. */
  require_dev?: Record<string, string>;
  /** Conflict constraints. */
  conflict?: Record<string, string>;
  /** Replacement constraints. */
  replace?: Record<string, string>;
  /** Provided virtual packages. */
  provide?: Record<string, string>;
  /** Suggested packages. */
  suggest?: Record<string, string>;
  /** SPDX license identifiers. */
  license?: string[];
  /** Package authors. */
  authors?: PackageAuthor[];
  /** Source repository reference. */
  source?: PackageSource;
  /** Distribution archive reference. */
  dist?: PackageDist;
  /** Composer autoload config. */
  autoload?: Record<string, unknown>;
  /** Composer extra config. */
  extra?: Record<string, unknown>;
  /** Executable files exposed by package. */
  bin?: string[];
}

/** Composer package author entry. */
export interface PackageAuthor {
  /** Author name. */
  name?: string;
  /** Author email. */
  email?: string;
  /** Author homepage. */
  homepage?: string;
  /** Author role. */
  role?: string;
}

/** Source repository reference for a package version. */
export interface PackageSource {
  /** Source type, usually `git`. */
  type: string;
  /** Repository URL. */
  url: string;
  /** Commit/tag reference. */
  reference: string;
}

/** Distribution archive reference for a package version. */
export interface PackageDist {
  /** Archive type, usually `zip`. */
  type: string;
  /** Download URL. */
  url: string;
  /** Commit/tag reference. */
  reference?: string;
  /** SHA checksum when provided. */
  shasum?: string;
}

/** Options for Composer v2 metadata endpoint. */
export interface MetadataOptions {
  /** Fetch dev metadata from `~dev.json` instead of tagged releases. */
  dev?: boolean;
}

/** Response returned by Composer v2 metadata endpoint. */
export interface PackageMetadataResponse {
  /** Version metadata arrays keyed by package name. */
  packages: Record<PackageName, PackageVersion[]>;
  /** Minification marker, such as `composer/2.0`. */
  minified?: string;
}

/** Response returned by package stats endpoint. */
export interface PackageStatsResponse {
  /** Aggregate download counts. */
  downloads: DownloadStats;
  /** Versions included in stats payload. */
  versions: string[];
  /** Stats collection start date. */
  date?: string;
  /** Packagist favorites plus GitHub stars when present. */
  favers?: number;
}

/** Aggregate download counts. */
export interface DownloadStats {
  /** Total downloads. */
  total: number;
  /** Downloads in last month. */
  monthly: number;
  /** Downloads in last day. */
  daily: number;
}

/** Options for metadata changes polling. */
export interface MetadataChangesOptions {
  /** Packagist timestamp returned by previous poll. */
  since?: number;
}

/** Response returned by metadata changes endpoint. */
export interface MetadataChangesResponse {
  /** Timestamp to store for future polling. */
  timestamp?: number;
  /** Package update/delete/resync actions. */
  actions?: MetadataChange[];
  /** Error message returned by Packagist for invalid/missing `since`. */
  error?: string;
}

/** One metadata change action. */
export interface MetadataChange {
  /** Change kind. */
  type: 'update' | 'delete' | 'resync';
  /** Package name, dev package name, or `*` for full resync. */
  package: PackageName | `${PackageName}~dev` | '*';
  /** Unix timestamp of the change. */
  time: number;
}

/** Response returned by global statistics endpoint. */
export interface StatisticsResponse {
  /** Global totals. */
  totals: {
    /** Total downloads across Packagist. */
    downloads: number;
  };
}

/** Security advisory query options. */
export interface SecurityAdvisoriesOptions {
  /** Composer package names or package URLs in PURL form. */
  packages?: Array<PackageName | `pkg:composer/${string}/${string}`>;
  /** Unix timestamp for fetching advisory updates. */
  updatedSince?: number;
}

/** Response returned by security advisories endpoint. */
export interface SecurityAdvisoriesResponse {
  /** Advisories keyed by package name. */
  advisories: Record<string, SecurityAdvisory[]>;
}

/** Security advisory entry returned by Packagist. */
export interface SecurityAdvisory {
  /** Unique Packagist advisory ID. */
  advisoryId: string;
  /** Affected package name. */
  packageName: PackageName;
  /** Deprecated remote source ID. Prefer `sources`. */
  remoteId?: string;
  /** Advisory title. */
  title: string;
  /** Advisory or disclosure URL. */
  link?: string;
  /** CVE identifier when available. */
  cve?: string | null;
  /** Composer constraint describing affected versions. */
  affectedVersions: string;
  /** Deprecated source name. Prefer `sources`. */
  source?: string;
  /** Advisory sources. */
  sources?: SecurityAdvisorySource[];
  /** Report date. */
  reportedAt?: string;
  /** Composer repository containing the package. */
  composerRepository?: string;
  /** CVSS severity when available. */
  severity?: string | null;
}

/** Source reference for a security advisory. */
export interface SecurityAdvisorySource {
  /** Source name, such as GitHub or FriendsOfPHP/security-advisories. */
  name: string;
  /** Source-specific advisory ID. */
  remoteId: string;
}

/** Response returned by create/edit package endpoints. */
export interface PackageMutationResponse {
  /** Mutation status returned by Packagist. */
  status: string;
}

/** Response returned by update-package endpoint. */
export interface PackageUpdateResponse extends PackageMutationResponse {
  /** Queue job IDs when Packagist schedules update work. */
  jobs?: string[];
}
