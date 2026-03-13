#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

const versionFile = join(__dirname, '..', 'version.json');
const packageFile = join(__dirname, '..', 'package.json');
const buildNotesFile = join(__dirname, '..', 'build-notes.md');

function getCurrentWeekCode() {
  const date = new Date();
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const week = Math.ceil(((date - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${year}w${String(week).padStart(2, '0')}`;
}

function readOptionalFile(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : null;
}

function writeVersionFiles(versionContent, packageContent, buildNotesContent) {
  writeFileSync(versionFile, versionContent);
  writeFileSync(packageFile, packageContent);
  writeFileSync(buildNotesFile, buildNotesContent);
}

function sanitizeDescription(value) {
  return value?.replace(/\s+/g, ' ').trim() || 'Updates';
}

function getFallbackDescription() {
  try {
    return sanitizeDescription(
      execFileSync('git', ['log', '-1', '--pretty=%s'], { encoding: 'utf8' }),
    );
  } catch {
    return 'Updates';
  }
}

function runBuildVerification() {
  if (process.platform === 'win32') {
    execFileSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm run build'], {
      stdio: 'inherit',
    });
    return;
  }

  execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
}

const originalVersionContent = readFileSync(versionFile, 'utf8');
const originalPackageContent = readFileSync(packageFile, 'utf8');
const originalBuildNotesContent = readOptionalFile(buildNotesFile);
const versionData = JSON.parse(originalVersionContent);

const args = process.argv.slice(2);
const isMinor = args.includes('--minor');
const descIdx = args.indexOf('--desc');
const description = sanitizeDescription(descIdx !== -1 ? args[descIdx + 1] : getFallbackDescription());

const currentWeek = getCurrentWeekCode();
const weekChanged = versionData.weekCode !== currentWeek;

let newWeek = versionData.weekCode;
let newMinor = versionData.minor;
let newBuild = versionData.build;

if (weekChanged) {
  newWeek = currentWeek;
  newMinor = 0;
  newBuild = 1;
} else if (isMinor) {
  newMinor++;
  newBuild = 1;
} else {
  newBuild++;
}

const newVersion = `${newWeek}-${newMinor}.${newBuild}`;
const commitMessage = `${newVersion}: ${description}`;

versionData.weekCode = newWeek;
versionData.minor = newMinor;
versionData.build = newBuild;
versionData.currentVersion = newVersion;

const packageData = JSON.parse(originalPackageContent);
packageData.version = newVersion;

const noteEntry = `- ${newVersion} — ${description}\n`;
let buildNotes = originalBuildNotesContent ?? '';
if (!buildNotes.includes('# Build Notes')) {
  buildNotes = '# Build Notes\n\n' + buildNotes;
}

const nextVersionContent = JSON.stringify(versionData, null, 2) + '\n';
const nextPackageContent = JSON.stringify(packageData, null, 2) + '\n';
const nextBuildNotesContent = buildNotes + noteEntry;

try {
  writeVersionFiles(nextVersionContent, nextPackageContent, nextBuildNotesContent);

  runBuildVerification();
  execFileSync('git', ['add', '-A'], { stdio: 'inherit' });
  execFileSync('git', ['commit', '-m', commitMessage], { stdio: 'inherit' });

  console.log(`✓ Version bumped to ${newVersion}`);
  console.log(`✓ Commit created: ${commitMessage}`);
} catch (error) {
  writeVersionFiles(
    originalVersionContent,
    originalPackageContent,
    originalBuildNotesContent ?? '# Build Notes\n',
  );

  try {
    execFileSync('git', ['add', versionFile, packageFile, buildNotesFile], { stdio: 'ignore' });
  } catch {
    // Ignore cleanup failures and preserve the original error path.
  }

  if (error.message) {
    console.error(error.message);
  }
  console.error('Version bump failed before commit. Restored version metadata files.');
  process.exit(error.status ?? 1);
}
