#!/bin/bash
# === Cursor Post-Edit Hook with Phase Branch ===

PHASE_FILE="phase.txt"
if [ -f "$PHASE_FILE" ]; then
  PHASE=$(cat "$PHASE_FILE" | tr -d '\n\r')
else
  PHASE="unlabeled"
fi

BRANCH="phase_${PHASE}"

# Ensure branch exists and switch to it (non-disruptive)
git fetch origin
git checkout -B "$BRANCH"

echo "🪶 Running post-edit Git backup for $PHASE ..."
./scripts/auto_commit.sh
