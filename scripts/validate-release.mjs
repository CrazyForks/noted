import fs from 'node:fs';

const args = new Set(process.argv.slice(2));
const expectedVersionArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith('--version='));
const expectedVersion = expectedVersionArg?.split('=')[1]?.replace(/^v/, '');

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function fail(message) {
  console.error(`release validation failed: ${message}`);
  process.exitCode = 1;
}

function assertEqual(label, actual, expected) {
  if (actual !== expected) {
    fail(`${label} is ${actual}, expected ${expected}`);
  }
}

function extractCargoVersion() {
  const cargo = fs.readFileSync('src-tauri/Cargo.toml', 'utf8');
  const match = cargo.match(/^version\s*=\s*"([^"]+)"/m);
  if (!match) fail('could not find src-tauri/Cargo.toml package version');
  return match?.[1];
}

function validateSourceVersions() {
  if (!expectedVersion) return;

  const packageJson = readJson('package.json');
  const packageLock = readJson('package-lock.json');
  const tauriConfig = readJson('src-tauri/tauri.conf.json');
  const updaterUi = fs.readFileSync('src/updater-ui.js', 'utf8');
  const indexHtml = fs.readFileSync('src/index.html', 'utf8');
  const docsHtml = fs.readFileSync('docs/index.html', 'utf8');

  assertEqual('package.json version', packageJson.version, expectedVersion);
  assertEqual('package-lock root version', packageLock.version, expectedVersion);
  assertEqual('package-lock package version', packageLock.packages?.['']?.version, expectedVersion);
  assertEqual('src-tauri/Cargo.toml version', extractCargoVersion(), expectedVersion);
  assertEqual('src-tauri/tauri.conf.json version', tauriConfig.version, expectedVersion);

  if (!updaterUi.includes("invoke('get_app_version')")) {
    fail('src/updater-ui.js does not read the app version from Tauri');
  }
  if (!indexHtml.includes(`id="update-version">v${expectedVersion}</span>`)) {
    fail('src/index.html displayed update version does not match release version');
  }
  if (!docsHtml.includes(`"softwareVersion": "${expectedVersion}"`)) {
    fail('docs/index.html softwareVersion does not match release version');
  }
}

function decodeSignature(signature) {
  try {
    return Buffer.from(signature, 'base64').toString('utf8');
  } catch {
    return '';
  }
}

function validateLatestManifest() {
  if (!fs.existsSync('latest.json')) return;

  const latest = readJson('latest.json');
  if (!latest.version) {
    fail('latest.json is missing version');
    return;
  }

  for (const [platform, metadata] of Object.entries(latest.platforms ?? {})) {
    if (!metadata.url?.includes(`/v${latest.version}/`)) {
      fail(`latest.json ${platform} URL does not point at v${latest.version}`);
    }
    if (!metadata.url?.includes(latest.version)) {
      fail(`latest.json ${platform} URL filename does not include ${latest.version}`);
    }

    const decodedSignature = decodeSignature(metadata.signature ?? '');
    const signedFilename = decodedSignature.match(/file:([^\n]+)/)?.[1] ?? '';
    if (!signedFilename) {
      fail(`latest.json ${platform} signature does not include a signed filename`);
      continue;
    }
    if (!signedFilename.includes(latest.version)) {
      fail(
        `latest.json ${platform} signature signs ${signedFilename}, expected version ${latest.version}`,
      );
    }
  }
}

validateSourceVersions();
if (!args.has('--skip-latest')) validateLatestManifest();
