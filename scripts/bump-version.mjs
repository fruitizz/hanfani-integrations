#!/usr/bin/env node
/**
 * Automatic semantic versioning based on conventional commits.
 *
 * Analyzes recent commits (feat: → minor, fix: → patch, BREAKING CHANGE: → major)
 * and updates package.json accordingly.
 *
 * Usage: pnpm version:bump
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dir, '..')

/** @typedef {{ major: number, minor: number, patch: number }} Version */

/** @param {string} v */
function parseVersion(v) {
  const [major = 0, minor = 0, patch = 0] = v.split('.').map((x) => parseInt(x, 10))
  return { major, minor, patch }
}

/** @param {Version} v */
function formatVersion(v) {
  return `${v.major}.${v.minor}.${v.patch}`
}

/**
 * @param {Version} v
 * @param {'major' | 'minor' | 'patch'} type
 */
function bump(v, type) {
  if (type === 'major') return { major: v.major + 1, minor: 0, patch: 0 }
  if (type === 'minor') return { major: v.major, minor: v.minor + 1, patch: 0 }
  return { major: v.major, minor: v.minor, patch: v.patch + 1 }
}

/**
 * @param {string} [since]
 * @returns {'major' | 'minor' | 'patch' | null}
 */
function analyzeCommits(since) {
  try {
    const cmd = since ? `git log ${since}..HEAD --oneline` : 'git log --oneline'
    const output = execSync(cmd, { encoding: 'utf8', cwd: rootDir }).trim()
    if (!output) return null

    let hasMajor = false
    let hasMinor = false
    let hasPatch = false

    for (const line of output.split('\n')) {
      if (!line) continue
      const subject = line.replace(/^[a-f0-9]+\s+/, '')

      if (subject.includes('BREAKING CHANGE:') || /!:/.test(subject)) {
        hasMajor = true
      } else if (subject.startsWith('feat')) {
        hasMinor = true
      } else if (subject.startsWith('fix')) {
        hasPatch = true
      }
    }

    if (hasMajor) return 'major'
    if (hasMinor) return 'minor'
    if (hasPatch) return 'patch'
    return null
  } catch {
    return null
  }
}

function getCurrentVersion() {
  const pkgPath = path.join(rootDir, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  return /** @type {string} */ (pkg.version)
}

/** @param {string} v */
function getTagForVersion(v) {
  return `v${v}`
}

/** @param {string} tag */
function tagExists(tag) {
  try {
    execSync(`git rev-parse --verify ${tag}^{commit}`, {
      encoding: 'utf8',
      cwd: rootDir,
      stdio: ['ignore', 'ignore', 'ignore'],
    })
    return true
  } catch {
    return false
  }
}

/** @param {string} version */
function updatePackageJson(version) {
  const pkgPath = path.join(rootDir, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  pkg.version = version
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
}

/** @param {string} version */
function updateVersionFile(version) {
  const versionPath = path.join(rootDir, 'src', 'version.ts')
  if (!existsSync(versionPath)) return false
  writeFileSync(versionPath, `export const VERSION = "${version}";\n`, 'utf8')
  return true
}

function main() {
  const current = getCurrentVersion()
  const currentVersion = parseVersion(current)
  const lastTag = getTagForVersion(current)

  // Prefer commits since the last tag. Only fall back to all commits when
  // bootstrapping a repo that has no matching tag yet.
  const bumpType = tagExists(lastTag) ? analyzeCommits(lastTag) : analyzeCommits()

  if (!bumpType) {
    console.log(`✓ No changes to version. Current: ${current}`)
    return
  }

  const nextVersion = bump(currentVersion, bumpType)
  const nextVersionStr = formatVersion(nextVersion)

  console.log(`📌 Bumping version: ${current} → ${nextVersionStr} (${bumpType})`)

  updatePackageJson(nextVersionStr)
  const updatedVersionFile = updateVersionFile(nextVersionStr)

  console.log(
    updatedVersionFile
      ? '✓ Updated package.json and src/version.ts'
      : '✓ Updated package.json',
  )
  console.log(`✓ Commit this as: git commit -m "chore: bump version to ${nextVersionStr}"`)
}

try {
  main()
} catch (err) {
  console.error('Error:', err instanceof Error ? err.message : err)
  process.exit(1)
}
