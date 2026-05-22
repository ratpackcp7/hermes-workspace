#!/usr/bin/env bash
# Nightly auto-commit for hermes-workspace
set -euo pipefail

cd "/home/chris/projects/hermes-workspace"

# Exit early if nothing to commit
if git diff --quiet HEAD && [ -z "$(git status --porcelain)" ]; then
    echo "$(date): No changes to commit"
    exit 0
fi

git add -A
git commit -m "nightly: auto-commit $(date +%Y-%m-%d)"
# Push to current branch — works for cp7-custom fork
# Push to cp7 remote (ratpackcp7/hermes-workspace fork)
git push cp7 HEAD:cp7-custom
echo "$(date): Committed and pushed"