#!/usr/bin/env node
// Deterministic decisions for the PR healing pipeline (workflows/self-heal.yml).
// No LLM is involved in any of these: they decide WHICH healer runs, WHETHER it may run,
// and WHAT happens to its fix. The agent's own output can only narrow those choices.
//
//   heal.mjs route  <config.json>                        (env NEEDS = toJSON(needs))
//   heal.mjs budget <config.json> <route> <head-sha> <commit-messages.txt> <comments.json>
//   heal.mjs policy <config.json>                        (env PR_INFO = {draft, headRef, files})
//   heal.mjs decide <config.json> <route> <heal-dir>      (env GUARD_OK, REVIEW_UNTAMPERED, CEILING, AUTOFIXED)
//   heal.mjs proposal <config.json> <comments.json> [run] (for /heal apply|reject)
//   heal.mjs ledger <config.json> <comments.json>         (feedback counts per route)
//
// route/decide print key=value lines for $GITHUB_OUTPUT (decide also writes <heal-dir>/decision.json);
// policy/budget/proposal/ledger print JSON.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

export const MARKER = 'self-heal:run';
export const FIXABLE = ['code-regression', 'stale-test'];
export const RUN_ACTIONS = ['auto', 'propose', 'diagnose', 'no-repro'];
const RANK = { low: 1, medium: 2, high: 3 };

/** Map failed CI jobs to the single route to heal this run. */
export function route(cfg, needs) {
  const failed = Object.entries(needs ?? {})
    .filter(([, n]) => n?.result === 'failure')
    .map(([job]) => job);
  const byJob = new Map();
  for (const [name, r] of Object.entries(cfg.routes)) {
    if (r.enabled === false) continue;
    for (const job of r.jobs ?? []) byJob.set(job, name);
  }
  const routes = [...new Set(failed.map((j) => byJob.get(j)).filter(Boolean))];
  const order = (n) => {
    const i = cfg.heal.priority.indexOf(n);
    return i === -1 ? Infinity : i;
  };
  routes.sort((a, b) => order(a) - order(b));
  return {
    route: routes[0] ?? '',
    deferred: routes.slice(1),
    unmapped: failed.filter((j) => !byJob.has(j)),
  };
}

/** Hidden marker every self-heal PR comment carries; the budget counts these. */
export const marker = (fields) =>
  `<!-- ${MARKER} ${Object.entries(fields).map(([k, v]) => `${k}=${v}`).join(' ')} -->`;

export function parseMarkers(comments, botLogin = 'github-actions[bot]') {
  const re = new RegExp(`<!-- ${MARKER} ([^>]*?) -->`, 'g');
  return comments
    .filter((c) => c?.user?.login === botLogin) // only the bot's own comments are trusted
    .map((c) => {
      // The workflow appends the marker AFTER any agent-written text, so only the last one counts.
      const m = [...(c.body ?? '').matchAll(re)].at(-1);
      if (!m) return null;
      return { id: c.id, ...Object.fromEntries(m[1].split(/\s+/).map((kv) => kv.split('='))) };
    })
    .filter(Boolean);
}

/** May an agent run for this route on this head? */
export function budget(cfg, routeName, head, commitMessages, comments) {
  const pushes = (commitMessages.match(/^Self-Heal: (?!migrations\b)\S+/gm) ?? []).length;
  // Only markers a healing run posts count as runs; command feedback (applied/rejected/reverted) doesn't.
  const runs = parseMarkers(comments).filter((m) => RUN_ACTIONS.includes(m.action));
  if (pushes >= cfg.heal.max_attempts)
    return { go: false, notify: true, pushes, reason: `${pushes} fix commit(s) already on this branch — needs a human` };
  if (runs.length >= cfg.heal.max_runs)
    return { go: false, notify: false, pushes, reason: `${runs.length} self-heal runs already on this PR (max_runs)` };
  if (runs.some((r) => r.head === head && r.route === routeName))
    return { go: false, notify: false, pushes, reason: `already handled ${routeName} at ${head.slice(0, 7)} (re-run)` };
  // A human reverted a fix of this route on this branch: never auto-commit that route again here.
  const reverted = new RegExp(`^Self-Heal-Revert: ${routeName}$`, 'm').test(commitMessages);
  return reverted
    ? { go: true, notify: false, pushes, ceiling: 'propose', reason: `a ${routeName} fix was reverted on this branch` }
    : { go: true, notify: false, pushes, ceiling: 'auto', reason: '' };
}

const readJson = (f) => {
  try {
    return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;
  } catch {
    return null;
  }
};

const ACTIONS = ['diagnose', 'propose', 'auto'];
const lower = (a, b) => ACTIONS[Math.min(ACTIONS.indexOf(a), ACTIONS.indexOf(b))];

/**
 * PR-level policy (Nx: draft handling, protected branches, "never fix" patterns).
 * Returns whether to run at all and the highest outcome this PR may get.
 */
export function policy(cfg, { draft = false, headRef = '', files = [] } = {}) {
  const h = cfg.heal;
  const hit = (pats, s) => (pats ?? []).find((p) => new RegExp(p).test(s));
  const branch = hit(h.protected_branches, headRef);
  if (branch) return { go: false, ceiling: 'diagnose', reason: `head branch ${headRef} is protected (${branch})` };
  if (draft && h.drafts === 'skip') return { go: false, ceiling: 'diagnose', reason: 'draft PR (heal.drafts: skip)' };
  const reasons = [];
  let ceiling = 'auto';
  if (draft && h.drafts === 'diagnose') {
    ceiling = 'diagnose';
    reasons.push('draft PR (heal.drafts: diagnose)');
  }
  const touched = files.map((f) => [f, hit(h.diagnose_only_paths, f)]).find(([, p]) => p);
  if (touched) {
    ceiling = 'diagnose';
    reasons.push(`PR touches ${touched[0]} (${touched[1]}), diagnose only`);
  }
  return { go: true, ceiling, reason: reasons.join('; ') };
}

/**
 * What happens to the fix: auto (commit), propose (comment + /heal apply) or diagnose.
 * Config and PR policy set the ceiling; the agents' outputs can only lower it.
 * `autofix: true` means the route's deterministic autofix commands made it green, no agent.
 */
export function decide(cfg, routeName, { result, verdict, guardOk, reviewUntampered, ceiling = 'auto', autofix = false, fixerFailed = false }) {
  const r = cfg.routes[routeName];
  // ceiling may be a list ("auto,propose"): PR policy and budget each set one; the lowest wins.
  ceiling = String(ceiling).split(',').filter((c) => ACTIONS.includes(c)).reduce(lower, 'auto');
  const cap = (d) => {
    const action = lower(d.action, ceiling);
    return action === d.action ? d : { action, reasons: [...d.reasons, `PR policy caps this at ${ceiling}`] };
  };
  if (autofix) {
    if (!guardOk) return { action: 'diagnose', reasons: ['autofix output failed the guard or re-verification'] };
    if (r.apply === 'diagnose') return { action: 'diagnose', reasons: ['route is diagnose-only'] };
    return cap({ action: r.autofix_apply, reasons: [`deterministic autofix (autofix_apply: ${r.autofix_apply})`] });
  }
  const reasons = [];
  if (!result) {
    const why = !r.skill ? 'route has no agent and autofix did not help'
      : fixerFailed ? 'the fixer agent failed to start or crashed — see the run log'
      : 'fixer produced no result.json';
    return { action: 'diagnose', reasons: [why] };
  }
  if (result.fixed !== true || !FIXABLE.includes(result.classification))
    return { action: 'diagnose', reasons: [`classified ${result.classification ?? 'unknown'}, no fix offered`] };
  if (!guardOk) return { action: 'diagnose', reasons: ['guardrail or re-verification failed'] };
  if (r.review.enabled) {
    if (!reviewUntampered) return { action: 'diagnose', reasons: ['reviewer modified the working tree'] };
    if (verdict?.verdict !== 'approve')
      return { action: 'diagnose', reasons: ['independent review rejected the fix', ...(verdict?.reasons ?? [])] };
  }
  if (r.apply === 'diagnose') return { action: 'diagnose', reasons: ['route is diagnose-only'] };
  if (r.apply !== 'auto') return cap({ action: 'propose', reasons: ['route requires a human to apply'] });

  const min = RANK[r.auto_apply.min_confidence] ?? RANK.high;
  if (!r.review.enabled) reasons.push('auto-apply requires the independent review');
  if (!r.auto_apply.classifications.includes(result.classification))
    reasons.push(`${result.classification} is not auto-applied on this route`);
  if ((RANK[result.confidence] ?? 0) < min) reasons.push(`fixer confidence ${result.confidence ?? 'none'}`);
  if (r.review.enabled && (RANK[verdict?.confidence] ?? 0) < min)
    reasons.push(`judge confidence ${verdict?.confidence ?? 'none'}`);
  return cap(reasons.length ? { action: 'propose', reasons } : { action: 'auto', reasons: ['all auto-apply rules matched'] });
}

/**
 * Proposal a `/heal apply|reject` refers to: the latest bot `propose` marker (or the one for
 * `run`), with its later fate (`rejected`/`applied` markers carrying the same run).
 */
export function proposal(comments, run = '') {
  const markers = parseMarkers(comments);
  const props = markers.filter((m) => m.action === 'propose' && (!run || m.run === String(run)));
  const p = props.at(-1);
  if (!p) return null;
  const fate = markers.filter((m) => m.run === p.run && ['rejected', 'applied'].includes(m.action)).at(-1);
  const valid = /^[a-z0-9_-]+$/.test(p.route ?? '') && /^\d+$/.test(p.run ?? '') && /^[0-9a-f]{40}$/.test(p.head ?? '');
  return { route: p.route, run: p.run, head: p.head, status: fate?.action ?? 'open', valid };
}

/** Feedback ledger from markers: per route, how proposals and fixes ended. */
export function ledger(comments) {
  const t = {};
  for (const m of parseMarkers(comments)) {
    const r = (t[m.route] ??= {});
    r[m.action] = (r[m.action] ?? 0) + 1;
  }
  return t;
}

const out = (o) => {
  for (const [k, v] of Object.entries(o)) process.stdout.write(`${k}=${Array.isArray(v) ? v.join(',') : v}\n`);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, cfgFile, ...rest] = process.argv.slice(2);
  const cfg = JSON.parse(readFileSync(cfgFile, 'utf8'));
  if (cmd === 'route') {
    out(route(cfg, JSON.parse(process.env.NEEDS || '{}')));
  } else if (cmd === 'budget') {
    const [routeName, head, commitsFile, commentsFile] = rest;
    const comments = JSON.parse(readFileSync(commentsFile, 'utf8')).flat(); // gh api --paginate --slurp
    process.stdout.write(JSON.stringify(budget(cfg, routeName, head, readFileSync(commitsFile, 'utf8'), comments)));
  } else if (cmd === 'policy') {
    const pr = JSON.parse(process.env.PR_INFO || '{}');
    process.stdout.write(JSON.stringify(policy(cfg, pr)));
  } else if (cmd === 'decide') {
    const [routeName, dir] = rest;
    const d = decide(cfg, routeName, {
      result: readJson(`${dir}/result.json`),
      verdict: readJson(`${dir}/verdict.json`),
      guardOk: process.env.GUARD_OK === 'true',
      reviewUntampered: process.env.REVIEW_UNTAMPERED === 'true',
      ceiling: process.env.CEILING || 'auto',
      autofix: process.env.AUTOFIXED === 'true',
      fixerFailed: process.env.FIXER_FAILED === 'true',
    });
    writeFileSync(`${dir}/decision.json`, JSON.stringify(d, null, 2));
    out({ action: d.action });
  } else if (cmd === 'proposal') {
    const [commentsFile, run = ''] = rest;
    process.stdout.write(JSON.stringify(proposal(JSON.parse(readFileSync(commentsFile, 'utf8')).flat(), run)));
  } else if (cmd === 'ledger') {
    const [commentsFile] = rest;
    process.stdout.write(JSON.stringify(ledger(JSON.parse(readFileSync(commentsFile, 'utf8')).flat())));
  } else {
    console.error(`unknown command ${cmd}`);
    process.exit(2);
  }
}
