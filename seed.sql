INSERT OR REPLACE INTO posts (title, slug, body, area, published_at, featured, read_time, excerpt) VALUES
('Centralized i18n across 40+ micro-frontends', 'centralized-i18n-across-40-plus-micro-frontends',
'## The problem with distributed translations

When you have forty-plus micro-frontends, each bundling its own i18n files, things get messy fast. Translators work against a single source of truth, but by the time those strings reach production they''ve been copied, transformed, and cached in ways nobody fully understands. We had duplicate keys, stale translations shipping weeks after fixes, and bundle sizes that kept creeping up.

## A shared translation runtime

The answer wasn''t a shared library — it was a shared *service*. We extracted translation loading into a shell-level provider that fetches a single JSON manifest at boot, then exposes an injection token every micro-frontend can consume. Each app declares which namespaces it needs; the provider deduplicates and lazy-loads only the delta.

## Tooling around the pipeline

The real win came from the tooling. A GitHub Action validates every PR against the canonical XLIFF files, flags missing keys per locale, and blocks merge until coverage thresholds are met. Translators push to a Phrase project; a webhook triggers a pipeline that compiles, deduplicates, and uploads to S3. The shell picks up new strings on the next deploy — no micro-frontend rebuild required.

## Results

Bundle sizes dropped by roughly 12 percent across the board. Translation lag went from weeks to hours. And onboarding a new micro-frontend now takes one config line instead of a copy-paste ritual.',
'architecture', '2026-05-15T10:00:00.000Z', 1, 8,
'How we built a single translation pipeline that serves dozens of independently deployed Angular micro-frontends without runtime duplication or version drift.'),

('A PR tracker that became a team-wide DevEx tool', 'a-pr-tracker-that-became-a-team-wide-devex-tool',
'## Scratching my own itch

I was tired of context-switching between GitHub tabs to check which of my PRs needed attention. A quick Node script that polled the GitHub API and dumped a markdown table into Slack felt like enough. It wasn''t.

## From script to service

Colleagues asked for access, then for filters, then for historical trends. Within a month the script lived in a proper repo with a Fastify backend, a small Angular frontend, and a PostgreSQL store that kept snapshots every thirty minutes. We tracked time-to-first-review, review-to-merge, and stale-PR counts per team.

## What the data revealed

The dashboard surfaced patterns nobody expected. One squad''s average time-to-first-review was four hours; another''s was two days — and neither knew. Making that visible changed behaviour more than any process document ever had. Leads started using the weekly trend charts in retros.

## Lessons learned

Developer experience tools don''t need a product manager. They need a developer who is annoyed enough to automate something, and a team willing to adopt it. The key is keeping the feedback loop short: ship something small, watch how people use it, iterate.',
'devex', '2026-04-22T10:00:00.000Z', 1, 6,
'What started as a personal script to monitor open PRs turned into an internal dashboard used by three squads to visualize review bottlenecks.'),

('Claude as a coding agent inside our CI loop', 'claude-as-a-coding-agent-inside-our-ci-loop',
'## Why automate the boring parts

Code review is valuable when humans focus on design, logic, and maintainability. It''s wasteful when half the comments are "missing semicolon" or "add a test for the null case." We wanted an agent that handled the mechanical feedback so reviewers could focus on what matters.

## The integration

A GitHub Action triggers on every PR. It checks out the branch, runs the linter, and if there are auto-fixable violations it hands them to Claude with a prompt that says "fix these lint errors, change nothing else." Claude returns a patch; the action applies it and pushes a fixup commit. A second step looks for functions without test coverage and asks Claude to generate minimal unit tests.

## Guardrails matter

We don''t merge AI-generated code without human review. The fixup commits are clearly labelled, and the generated tests run in CI before anyone sees them. If a test fails, the commit is dropped automatically. The goal is to *reduce* review load, not eliminate review.

## Early results

In the first month, the agent auto-fixed roughly sixty percent of lint comments and generated useful test stubs for about forty percent of uncovered functions. Reviewers reported spending less time on mechanical issues and more on architecture discussions.',
'ai', '2026-03-10T10:00:00.000Z', 0, 5,
'We wired Claude into GitHub Actions to auto-fix lint errors and generate missing unit tests on every pull request, cutting review friction in half.'),

('DITA to Web: automating technical documentation', 'dita-to-web-automating-technical-documentation',
'## The legacy problem

The documentation team maintained thousands of pages in DITA XML, published through a clunky desktop tool that produced dated-looking HTML. Engineers avoided the docs because they were slow to load and impossible to search. The writers wanted a modern output without abandoning their structured authoring workflow.

## Choosing the stack

We evaluated several static site generators and settled on Astro for its content-first philosophy and island architecture. A custom Node transform reads DITA maps, resolves conrefs and key references, and emits Markdown files that Astro consumes as content collections. Mermaid diagrams embedded in DITA topics render client-side as interactive SVGs.

## Versioning and PDF

Each product version maps to a Git branch. A dropdown in the site header lets readers switch versions; under the hood it''s just a prefix rewrite handled by CloudFront functions. For PDF export, we run Puppeteer against the built HTML and stitch pages with a custom header/footer template. The whole pipeline runs in GitHub Actions on every merge to a release branch.

## Impact

Page load times dropped from several seconds to under 200 milliseconds. Internal search, powered by Pagefind, returns results in real time. The doc team now ships updates the same day they''re written instead of waiting for a weekly publishing cycle.',
'cases', '2026-02-18T10:00:00.000Z', 0, 7,
'Building a pipeline that transforms DITA XML source files into a fast, searchable static documentation site with versioning and PDF export.'),

('WebRTC video calls with on-device neural nets', 'webrtc-video-calls-with-on-device-neural-nets',
'## The brief

A client needed a telemedicine platform where patient privacy was non-negotiable. Video processing had to stay on the device — no frames could leave the browser except through the encrypted WebRTC peer connection. That ruled out cloud-based background blur and noise suppression.

## Background segmentation

We used TensorFlow.js with the BodyPix model to segment the speaker from the background in real time. Each video frame is drawn to an offscreen canvas, run through the model, and composited with a replacement background before being fed back into the MediaStream track. On a mid-range laptop the pipeline sustains 25 frames per second at 720p.

## Audio processing

For noise suppression we leveraged the Web Audio API''s AudioWorklet with a small RNNoise WASM module. The worklet runs in a dedicated thread so it doesn''t block the main thread or the video pipeline. We wrapped it in a custom MediaStream track processor that plugs transparently into the WebRTC connection.

## Performance tuning

The biggest challenge was keeping GPU memory stable over long calls. We implemented a frame-skip strategy that reduces model inference frequency when the speaker is stationary, and an adaptive resolution scaler that drops to 480p if the device thermal state crosses a threshold. Battery-powered devices saw a forty percent improvement in call duration after these optimisations.

## Lessons

On-device ML in the browser is viable for real-time video, but you have to treat the GPU as a shared resource. Profile early, budget your frame time, and always have a graceful fallback for low-end hardware.',
'cases', '2026-01-05T10:00:00.000Z', 0, 10,
'Implementing real-time background replacement and noise suppression using TensorFlow.js and WebRTC, all running in the browser with no server-side processing.'),

('Raspberry Pi home lab: old laptops as servers', 'raspberry-pi-home-lab-old-laptops-as-servers',
'## Motivation

Cloud services are convenient but expensive for personal projects that run around the clock. I had two old ThinkPads gathering dust and a Raspberry Pi 4 doing nothing. Turning them into a home lab gave me a playground for infrastructure experiments and a place to self-host services I actually use daily.

## Hardware setup

The two ThinkPads run Ubuntu Server headless. One acts as the control plane node; the other is a worker. The Raspberry Pi runs a lightweight agent node for low-priority jobs like RSS feed aggregation and DNS ad-blocking via Pi-hole. Everything connects through a managed switch with VLANs separating lab traffic from household devices.

## Software stack

I chose K3s for Kubernetes because it''s lightweight enough for constrained hardware. Flux handles GitOps deployments — every change goes through a pull request in a private GitHub repo. Longhorn provides distributed storage across the two laptops. For monitoring I run a slim Prometheus and Grafana stack that scrapes metrics from all nodes and the home router.

## What I self-host

The lab runs Miniflux for RSS, Vaultwarden for passwords, a Gitea instance for personal repos, and a Nextcloud instance for file sync. Backups go to a USB drive attached to the Pi and to a weekly encrypted tarball uploaded to Backblaze B2.

## What I''ve learned

Running your own infrastructure teaches you things no tutorial can. When the control plane goes down at midnight because a laptop overheated, you learn to care about health checks, node affinity, and proper alerting. It''s the best way to internalise concepts that feel abstract in managed cloud environments.',
'homelab', '2025-12-20T10:00:00.000Z', 0, 6,
'Turning retired laptops and a couple of Raspberry Pis into a Kubernetes home lab for self-hosted services, backups, and learning infrastructure as code.');

INSERT OR REPLACE INTO pages (title, slug, body, updated_at) VALUES
('About', 'about',
'{"heroName":"Hi, I''m Pavlo.","heroBio":"I''m a frontend engineer in Kyiv who cares more about systems than frameworks. This is where I write about the architecture, tools, and home-lab tinkering behind the work.","heroTagline":"frontend engineer · systems & architecture · kyiv","heroPhoto":"/img5.jpg","tagline":"Lean engineering: simple systems, made on purpose.","bio":"Frontend developer with a focus on architecture and internal tooling. I don''t just build features — I build the systems that help teams scale. Design systems, centralized localization, and micro-frontend structures in multi-repo environments.","photo":"/img3.jpg","location":"kyiv · remote","whatIDo":["Architecture — design systems, localization, micro-frontends","Dev efficiency — AI agents (Claude, Copilot) in coding & testing","Ownership — refactoring legacy, automating pipelines, clean code"],"experience":[{"title":"Frontend Developer · Pragmasoft","startDate":"2023-08","endDate":"","location":"hybrid"}],"education":[{"title":"B.Sc. Computer Engineering · KhNURE","startDate":"2020-09","endDate":"2024-06","location":""}],"tech":["TypeScript","Angular","React","Next.js","Astro","Web Components","Python","AWS","CI/CD","Keycloak"],"cta":"Open to senior roles — Kyiv & remote."}',
'2026-06-23T10:00:00.000Z'),

('Now', 'now',
'## What I''m doing now

*Last updated June 2026.*

### At work

Building and maintaining a micro-frontend platform at Verisk. Current focus areas:

- **Angular and Module Federation** — migrating from a custom shell to Webpack Module Federation for better isolation and independent deployments.
- **AWS and Terraform** — defining infrastructure as code for our staging and production environments. Learning the hard way that state management in Terraform is its own discipline.
- **GitHub Actions** — consolidating a sprawl of CI workflows into reusable composite actions shared across forty-plus repositories.

### Side projects

- **This blog** — built with Astro, deployed on Cloudflare Pages. Writing helps me think through problems and document solutions I''ll forget otherwise.
- **Home lab** — a K3s cluster on retired laptops and a Raspberry Pi. Currently self-hosting Miniflux, Vaultwarden, Gitea, and Nextcloud.

### Learning

- Deepening my understanding of **distributed systems** through Martin Kleppmann''s *Designing Data-Intensive Applications* (second read, still finding new insights).
- Exploring **AI-assisted development workflows** — integrating Claude into CI pipelines, generating test scaffolds, and experimenting with agentic coding patterns.
- Picking up **Rust** on weekends for the systems-level perspective it gives on memory and performance.

### Reading

- *Designing Data-Intensive Applications* by Martin Kleppmann
- *A Philosophy of Software Design* by John Ousterhout
- *The Staff Engineer''s Path* by Tanya Reilly',
'2026-06-15T10:00:00.000Z');
