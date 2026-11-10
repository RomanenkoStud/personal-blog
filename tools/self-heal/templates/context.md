# <repo> — context for self-heal agents

<!-- 10–30 lines an unattended fixer needs. Read from the default branch. -->
- Architecture in one paragraph: runtime, framework, where the main modules live.
- Tests: framework, location/naming, shared fakes/fixtures to reuse.
- Conventions tests encode (naming, layering, error handling).
- Invariants a test must never be "updated" away from (security, privacy, data integrity).
- Things never to change: generated files, schema files, vendored code.
