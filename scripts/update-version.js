#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

const versionFile = join(__dirname, '..', 'version.json');
const packageFile = join(__dirname, '..', 'package.json');
const buildNotesFile = join(__dirname, '..', 'build-notes.md');
const metadataRepoPaths = ['version.json', 'package.json', 'build-notes.md'];
const protectedMetadata = new Set(metadataRepoPaths);
const canonicalPackageName = 'dungeon-ecosystem-prototype';

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

function restoreFile(filePath, content) {
  if (content === null) {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
    return;
  }

  writeFileSync(filePath, content);
}

function restoreVersionFiles(versionContent, packageContent, buildNotesContent) {
  restoreFile(versionFile, versionContent);
  restoreFile(packageFile, packageContent);
  restoreFile(buildNotesFile, buildNotesContent);
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

function listGitPaths(args) {
  const output = execFileSync('git', args, { encoding: 'utf8' }).trim();
  if (!output) {
    return [];
  }

  return output
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\\/g, '/'))
    .filter(Boolean);
}

function containsProtectedMetadata(paths) {
  return paths.filter((filePath) => protectedMetadata.has(filePath));
}

function failWithMessage(message) {
  console.error(message);
  process.exit(1);
}

function resetMetadataIndex() {
  execFileSync('git', ['reset', '-q', 'HEAD', '--', ...metadataRepoPaths], { stdio: 'ignore' });
}

const originalVersionContent = readFileSync(versionFile, 'utf8');
const originalPackageContent = readFileSync(packageFile, 'utf8');
const originalBuildNotesContent = readOptionalFile(buildNotesFile);
const versionData = JSON.parse(originalVersionContent);

const stagedBeforeBump = listGitPaths(['diff', '--name-only', '--cached']);
const unstagedBeforeBump = listGitPaths(['diff', '--name-only']);

if (stagedBeforeBump.length === 0) {
  failWithMessage(
    'No staged files found. Stage only your own changes first: git add <file1> <file2> ...',
  );
}

const stagedProtectedFiles = containsProtectedMetadata(stagedBeforeBump);
if (stagedProtectedFiles.length > 0) {
  failWithMessage(
    `Do not stage metadata files manually before bump: ${stagedProtectedFiles.join(', ')}`,
  );
}

const unstagedProtectedFiles = containsProtectedMetadata(unstagedBeforeBump);
if (unstagedProtectedFiles.length > 0) {
  failWithMessage(
    `Do not modify metadata files manually before bump: ${unstagedProtectedFiles.join(', ')}`,
  );
}

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
packageData.name = canonicalPackageName;
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
  execFileSync('git', ['add', '--', ...metadataRepoPaths], { stdio: 'inherit' });
  execFileSync('git', ['commit', '-m', commitMessage], { stdio: 'inherit' });

  console.log(`✓ Version bumped to ${newVersion}`);
  console.log(`✓ Commit created: ${commitMessage}`);
} catch (error) {
  try {
    resetMetadataIndex();
  } catch {
    // Best effort cleanup; continue with file restoration.
  }

  restoreVersionFiles(originalVersionContent, originalPackageContent, originalBuildNotesContent);

  if (error.message) {
    console.error(error.message);
  }
  console.error('Version bump failed before commit. Restored version metadata files.');
  process.exit(error.status ?? 1);
}
