// Install the Linux x64 glibc native binaries (rollup, sharp, ...) that the lockfile marks
// optional but npm ci skips when the lockfile was generated on another platform.
const { execSync } = require('child_process');
const { mkdirSync } = require('fs');
const lock = require(`${process.cwd()}/package-lock.json`);

const pkgs = Object.entries(lock.packages)
  .filter(([k, v]) => v.optional && v.os?.includes('linux') && v.cpu?.includes('x64') &&
                      (k.includes('gnu') || k.includes('@img/sharp')))
  .map(([k, v]) => [k.replace('node_modules/', ''), v.version]);

for (const [name, version] of pkgs) {
  const tarball = execSync(`npm view ${JSON.stringify(`${name}@${version}`)} dist.tarball`).toString().trim();
  mkdirSync(`node_modules/${name}`, { recursive: true });
  execSync(`curl -fsSL ${JSON.stringify(tarball)} | tar -xz --strip-components=1 -C ${JSON.stringify(`node_modules/${name}`)}`);
  console.log('Installed:', name, version);
}
