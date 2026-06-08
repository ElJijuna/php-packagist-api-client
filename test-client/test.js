import { PackagistClient } from '../dist/index.js';

const packagist = new PackagistClient({
  userAgent: 'php-packagist-api-client test-client (mailto:pilmee@gmail.com)',
});

async function test() {
  // --- Package listings ---

  const allComposer = await packagist.listPackages({ vendor: 'composer' });
  console.log('Composer packages:', allComposer.packageNames.length);
  console.log('First package:', allComposer.packageNames[0]);

  const libraries = await packagist.listPackages({
    vendor: 'composer',
    fields: ['type', 'repository'],
  });
  const firstLibrary = Object.entries(libraries.packages)[0];
  console.log('First package with fields:', firstLibrary[0], firstLibrary[1]);

  // --- Popular packages ---

  const popular = await packagist.popular({ perPage: 5 });
  console.log('Popular total:', popular.total);
  popular.packages.forEach((pkg) =>
    console.log(` - ${pkg.name}: ${pkg.downloads} downloads, ${pkg.favers} favers`),
  );

  // --- Search ---

  const search = await packagist.search({ query: 'monolog', perPage: 3 });
  console.log('Search results:');
  search.results.forEach((pkg) => console.log(' -', pkg.name, pkg.description));

  const taggedSearch = await packagist.search({ query: 'monolog', tags: 'psr-3', perPage: 3 });
  console.log('Tagged search total:', taggedSearch.total);

  const typedSearch = await packagist.search({ type: 'composer-plugin', perPage: 3 });
  console.log('Composer plugin search total:', typedSearch.total);

  // --- PackageResource ---

  const pkg = await packagist.package('monolog/monolog');
  console.log('Package:', pkg.package.name);
  console.log('Type:', pkg.package.type);
  console.log('Maintainers:', pkg.package.maintainers.map((m) => m.name).join(', '));
  console.log('Downloads total:', pkg.package.downloads.total);

  const metadata = await packagist.package('monolog/monolog').metadata();
  console.log('Metadata format:', metadata.minified);
  console.log('Tagged releases:', metadata.packages['monolog/monolog'].length);

  const devMetadata = await packagist.package('monolog/monolog').metadata({ dev: true });
  console.log('Dev releases:', devMetadata.packages['monolog/monolog'].length);

  const stats = await packagist.package('monolog/monolog').stats();
  console.log('Stats total:', stats.downloads.total);
  console.log('Stats monthly:', stats.downloads.monthly);
  console.log('Versions in stats:', stats.versions.length);

  const packageAdvisories = await packagist.package('monolog/monolog').securityAdvisories();
  console.log('Package advisories:', packageAdvisories.advisories['monolog/monolog'].length);

  // --- Client helpers ---

  const advisories = await packagist.securityAdvisories({
    packages: ['monolog/monolog', 'composer/composer'],
  });
  Object.entries(advisories.advisories).forEach(([name, items]) =>
    console.log(`Advisories ${name}: ${items.length}`),
  );

  const statsGlobal = await packagist.statistics();
  console.log('Global downloads:', statsGlobal.totals.downloads);

  const since = Math.floor((Date.now() / 1000 - 600) * 10000);
  const changes = await packagist.metadataChanges({ since });
  console.log('Recent changes:', changes.actions?.length ?? 0);

  // --- Authenticated endpoints ---

  // const authedPackagist = new PackagistClient({
  //   username: 'packagist-user',
  //   apiToken: process.env.PACKAGIST_TOKEN,
  //   userAgent: 'php-packagist-api-client test-client (mailto:pilmee@gmail.com)',
  // });
  //
  // const update = await authedPackagist.updatePackage(
  //   'https://packagist.org/packages/vendor/package',
  // );
  // console.log('Update status:', update.status, update.jobs);
}

try {
  await test();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
