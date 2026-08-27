#!/bin/sh
# The Arena agent's GitHub App cannot push files under .github/workflows (no `workflows` scope), so
# the workflow sources live in ci/workflows/. Run this once from the repo root with your own
# credentials to activate them, then commit and push.
set -eu
[ -d ci/workflows ] || { echo "run me from the repo root"; exit 1; }
mkdir -p .github/workflows
for f in ci/workflows/*.yml; do
	cp "$f" ".github/workflows/$(basename "$f")"
	echo "installed .github/workflows/$(basename "$f")"
done
echo "now: git add .github/workflows && git commit -m 'ci: activate GPU OC lab workflows' && git push"
