#!/usr/bin/env node
// Merge kit defaults with a repo overlay and emit the resolved config as JSON,
// plus a few derived values ("computed") the workflows consume directly.
//
// usage: load-config.mjs <defaults.yml> [overlay.yml] > config.json
// YAML is parsed with `yq` (preinstalled on GitHub runners) or js-yaml as fallback.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const SAFETY_FLOOR = ['tests.protected_paths', 'tests.forbidden_patterns', 'migrations.protected_paths'];

export function parseYaml(file) {
  try {
    return JSON.parse(execFileSync('yq', ['-o=json', '.', file], { encoding: 'utf8' })) ?? {};
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    const yaml = createRequire(`${process.cwd()}/`)('js-yaml');
    return yaml.load(readFileSync(file, 'utf8')) ?? {};
  }
}

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

export function deepMerge(base, over) {
  if (!isObj(base) || !isObj(over)) return over === undefined ? base : over;
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = deepMerge(base[k], v);
  return out;
}

const get = (o, path) => path.split('.').reduce((a, k) => a?.[k], o);
const set = (o, path, v) => {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((a, k) => (a[k] ??= {}), o)[last] = v;
};

export function resolve(defaults, overlay = {}) {
  const cfg = deepMerge(defaults, overlay);
  for (const path of SAFETY_FLOOR) {
    set(cfg, path, [...new Set([...(get(defaults, path) ?? []), ...(get(overlay, path) ?? [])])]);
  }
  const tools = (extra) => [...new Set([...cfg.agent.base_tools, 'Edit', 'Write', ...extra])].join(',');
  const reviewTools = [...new Set([...cfg.agent.base_tools, 'Write'])].join(',');
  cfg.computed = {
    plugins: cfg.agent.plugins.join('\n'),
    marketplaces: cfg.agent.marketplaces.join('\n'),
    tests_tools: tools(cfg.tests.allowed_tools),
    migrations_tools: tools(cfg.migrations.allowed_tools),
    review_tools: reviewTools,
  };
  return cfg;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [defaultsFile, overlayFile] = process.argv.slice(2);
  const overlay = overlayFile && existsSync(overlayFile) ? parseYaml(overlayFile) : {};
  process.stdout.write(JSON.stringify(resolve(parseYaml(defaultsFile), overlay)));
}
