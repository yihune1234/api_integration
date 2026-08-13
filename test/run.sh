#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "=== Running full regression test suite (phases 1-6) ==="
node --test --env-file=.env --test-concurrency=1 --test-force-exit \
  test/extraction-pipeline.test.js \
  test/phase5-rate-limit-usage.test.js \
  test/phase5-extract-rate-limit-e2e.test.js \
  test/phase6-admin-security.test.js