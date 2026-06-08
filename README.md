# php-packagist-api-client

TypeScript client for the Packagist REST API.

## Install

```bash
npm install php-packagist-api-client
```

## Usage

```typescript
import { PackagistClient } from 'php-packagist-api-client';

const packagist = new PackagistClient({
  userAgent: 'my-app (mailto:me@example.com)',
});

const search = await packagist.search({ query: 'monolog', perPage: 5 });
const pkg = await packagist.package('monolog/monolog');
const metadata = await packagist.package('monolog/monolog').metadata();
const stats = await packagist.package('monolog/monolog').stats();
const advisories = await packagist.securityAdvisories({
  packages: ['monolog/monolog'],
});
```

## Authenticated endpoints

```typescript
const packagist = new PackagistClient({
  username: 'packagist-user',
  apiToken: process.env.PACKAGIST_TOKEN,
  userAgent: 'release-bot (mailto:me@example.com)',
});

await packagist.updatePackage('https://packagist.org/packages/vendor/package');
```

## API coverage

- `listPackages()` -> `GET /packages/list.json`
- `popular()` -> `GET /explore/popular.json`
- `search()` -> `GET /search.json`
- `package(name).get()` -> `GET /packages/[vendor]/[package].json`
- `package(name).metadata()` -> `GET https://repo.packagist.org/p2/[vendor]/[package].json`
- `package(name).stats()` -> `GET /packages/[vendor]/[package]/stats.json`
- `metadataChanges()` -> `GET /metadata/changes.json`
- `statistics()` -> `GET /statistics.json`
- `securityAdvisories()` -> `GET /api/security-advisories/`
- `createPackage()`, `editPackage()`, `updatePackage()` -> authenticated package mutation endpoints

## Development

```bash
npm test
npm run lint
npm run build
```
