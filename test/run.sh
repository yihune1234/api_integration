#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "=== Running extraction pipeline tests ==="
node --test --env-file=.env test/extraction-pipeline.test.js