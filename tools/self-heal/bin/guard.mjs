#!/usr/bin/env node
// Deterministic guardrails applied to the agent's working-tree changes.
// The agent never decides these; a violation rejects the fix.
//
// usage: guard.mjs <tests|migrations> <config.json> [applied-migrations.txt]
// prints violations, exits 1 if any; prints changed files to stdout on success.
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
// Scratch/kit dirs that live in the workspace but are never part of a fix.
const IGNORED = /^(\.heal|\.self-heal-policy|\.claude-pr)\//;

export function changedFiles() {
  // -z: robust to spaces/renames. Entries: "XY path" (renames add an extra NUL-separated path).
  const out = git('status', '--porcelain=v1', '-z', '--untracked-files=all').split('\0').filter(Boolean);
  const files = [];
  for (let i = 0; i < out.length; i++) {
    const status = out[i].slice(0, 2);
    files.push({ status, path: out[i].slice(3) });
    if (status.startsWith('R') || status.startsWith('C')) i++; // skip rename source
  }
  // SELF_HEAL_BASELINE: paths already dirty before the agent ran (build/test artifacts).
  const baselineFile = process.env.SELF_HEAL_BASELINE;
  const baseline = new Set(
    baselineFile && existsSync(baselineFile) ? readFileSync(baselineFile, 'utf8').split('\0').filter(Boolean) : [],
  );
  return files.filter((f) => !IGNORED.test(f.path) && !baseline.has(f.path));
}

export function addedLines(files) {
  const paths = files.filter((f) => !f.status.includes('D')).map((f) => f.path);
  if (paths.length === 0) return [];
  const untracked = files.filter((f) => f.status === '??').map((f) => f.path);
  if (untracked.length) git('add', '--intent-to-add', '--', ...untracked); // make new files diffable
  try {
    return git('diff', '-U0', '--', ...paths).split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++'));
  } finally {
    if (untracked.length) git('reset', '-q', '--', ...untracked);
  }
}

export function check(mode, cfg, files, added, applied = []) {
  const v = [];
  if (files.length === 0) v.push('agent made no changes');
  const section = cfg[mode];
  const protectedRe = (section.protected_paths ?? []).map((p) => new RegExp(p));
  for (const { path } of files) {
    const hit = protectedRe.find((re) => re.test(path));
    if (hit) v.push(`touched protected path ${path} (${hit})`);
  }
  if (mode === 'tests') {
    const testRe = new RegExp(cfg.tests.test_file_pattern);
    for (const { status, path } of files) {
      if (status.includes('D') && testRe.test(path)) v.push(`deleted test file ${path}`);
    }
    for (const pat of cfg.tests.forbidden_patterns) {
      const re = new RegExp(pat);
      const line = added.find((l) => re.test(l));
      if (line) v.push(`forbidden pattern /${pat}/ in added line: ${line.slice(0, 120)}`);
    }
  }
  if (mode === 'migrations') {
    const dir = cfg.migrations.dir.replace(/\/$/, '');
    for (const { status, path } of files) {
      if (!path.startsWith(`${dir}/`)) v.push(`touched ${path} outside ${dir}/`);
      const name = path.split('/').pop();
      if (applied.includes(name)) v.push(`modified already-applied migration ${name}`);
      if (status.includes('D')) v.push(`deleted migration ${path}`);
    }
  }
  return v;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [mode, cfgFile, appliedFile] = process.argv.slice(2);
  const cfg = JSON.parse(readFileSync(cfgFile, 'utf8'));
  const applied = appliedFile && existsSync(appliedFile)
    ? readFileSync(appliedFile, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean)
    : [];
  const files = changedFiles();
  const violations = check(mode, cfg, files, addedLines(files), applied);
  if (violations.length) {
    for (const x of violations) console.error(`::error::self-heal guard: ${x}`);
    process.exit(1);
  }
  for (const f of files) console.log(f.path);
}
