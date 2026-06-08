import { PackageResource, PackagistClient } from '../index';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockResponse<T>(data: T): void {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve(data),
  });
}

describe('PackageResource', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('exposes package subresources', () => {
    const resource = new PackagistClient().package('monolog/monolog');
    expect(resource).toBeInstanceOf(PackageResource);
    expect(typeof resource.get).toBe('function');
    expect(typeof resource.metadata).toBe('function');
    expect(typeof resource.stats).toBe('function');
    expect(typeof resource.securityAdvisories).toBe('function');
  });

  it('fetches advisories for one package', async () => {
    mockResponse({ advisories: { 'monolog/monolog': [] } });
    await new PackagistClient().package('monolog/monolog').securityAdvisories();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://packagist.org/api/security-advisories/?packages%5B%5D=monolog%2Fmonolog',
      expect.any(Object),
    );
  });
});
