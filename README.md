# php-packagist-api-client

<p align="center">
  <img src="https://packagist.org/img/logo-small.png" alt="Packagist logo" width="160" />
</p>

[![CI](https://github.com/ElJijuna/php-packagist-api-client/actions/workflows/ci.yml/badge.svg)](https://github.com/ElJijuna/php-packagist-api-client/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/php-packagist-api-client)](https://www.npmjs.com/package/php-packagist-api-client)
[![npm downloads/week](https://img.shields.io/npm/dw/php-packagist-api-client)](https://www.npmjs.com/package/php-packagist-api-client)
[![npm downloads/month](https://img.shields.io/npm/dm/php-packagist-api-client)](https://www.npmjs.com/package/php-packagist-api-client)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/php-packagist-api-client)](https://bundlephobia.com/package/php-packagist-api-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/node/v/php-packagist-api-client)](https://nodejs.org/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://semver.org)

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
