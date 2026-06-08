import { PackagistApiError, PackagistClient } from './index';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockResponse<T>(data: T, status = 200): void {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : status === 404 ? 'Not Found' : 'Error',
    json: () => Promise.resolve(data),
  });
}

describe('PackagistClient', () => {
  let packagist: PackagistClient;

  beforeEach(() => {
    mockFetch.mockClear();
    packagist = new PackagistClient();
  });

  it('lists package names', async () => {
    mockResponse({ packageNames: ['composer/composer'] });
    const result = await packagist.listPackages({ vendor: 'composer' });
    expect(result.packageNames).toEqual(['composer/composer']);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://packagist.org/packages/list.json?vendor=composer',
      expect.any(Object),
    );
  });

  it('requests package fields with repeated fields[] query params', async () => {
    mockResponse({ packages: { 'composer/composer': { type: 'library' } } });
    await packagist.listPackages({ fields: ['type', 'repository'] });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('fields%5B%5D=type');
    expect(url).toContain('fields%5B%5D=repository');
  });

  it('searches by name, tag, type, and pagination', async () => {
    mockResponse({ results: [], total: 0 });
    await packagist.search({
      query: 'monolog',
      tags: ['psr-3', 'logs'],
      type: 'library',
      page: 2,
      perPage: 5,
    });
    const url = new URL(mockFetch.mock.calls[0][0] as string);
    expect(`${url.origin}${url.pathname}`).toBe('https://packagist.org/search.json');
    expect(url.searchParams.get('q')).toBe('monolog');
    expect(url.searchParams.getAll('tags[]')).toEqual(['psr-3', 'logs']);
    expect(url.searchParams.get('type')).toBe('library');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('per_page')).toBe('5');
  });

  it('rejects empty search filters before fetch', async () => {
    await expect(packagist.search({ query: ' ' })).rejects.toThrow(
      'Packagist search requires query, tags, or type',
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('gets popular packages', async () => {
    mockResponse({ packages: [], total: 0, next: null });
    await packagist.popular({ perPage: 100, page: 3 });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://packagist.org/explore/popular.json?per_page=100&page=3',
      expect.any(Object),
    );
  });

  it('gets package data through awaitable resource', async () => {
    mockResponse({ package: { name: 'monolog/monolog', versions: {} } });
    const result = await packagist.package('monolog/monolog');
    expect(result.package.name).toBe('monolog/monolog');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://packagist.org/packages/monolog/monolog.json',
      expect.any(Object),
    );
  });

  it('gets Composer v2 metadata from repo.packagist.org', async () => {
    mockResponse({ packages: { 'monolog/monolog': [] }, minified: 'composer/2.0' });
    await packagist.package('monolog/monolog').metadata({ dev: true });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://repo.packagist.org/p2/monolog/monolog~dev.json',
      expect.any(Object),
    );
  });

  it('gets stats for a package', async () => {
    mockResponse({ downloads: { total: 1, monthly: 1, daily: 1 }, versions: ['1.0.0'] });
    await packagist.package('monolog/monolog').stats();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://packagist.org/packages/monolog/monolog/stats.json',
      expect.any(Object),
    );
  });

  it('queries security advisories by repeated packages[] params', async () => {
    mockResponse({ advisories: { 'monolog/monolog': [] } });
    await packagist.securityAdvisories({ packages: ['monolog/monolog', 'composer/composer'] });
    const url = new URL(mockFetch.mock.calls[0][0] as string);
    expect(url.searchParams.getAll('packages[]')).toEqual(['monolog/monolog', 'composer/composer']);
  });

  it('sends User-Agent and Bearer token on authenticated requests', async () => {
    const client = new PackagistClient({
      username: 'pilmee',
      apiToken: 'secret',
      userAgent: 'php-packagist-api-client-test (mailto:test@example.com)',
    });
    mockResponse({ status: 'success', jobs: ['job'] });
    await client.updatePackage('https://packagist.org/packages/monolog/monolog');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://packagist.org/api/update-package',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer pilmee:secret',
          'Content-Type': 'application/json',
          'User-Agent': 'php-packagist-api-client-test (mailto:test@example.com)',
        }),
        body: JSON.stringify({ repository: 'https://packagist.org/packages/monolog/monolog' }),
      }),
    );
  });

  it('throws PackagistApiError on non-2xx responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: jest.fn(),
    });
    await expect(packagist.package('missing/package').get()).rejects.toThrow(PackagistApiError);
  });
});
