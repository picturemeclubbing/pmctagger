#!/bin/bash
# === Auto Git Commit Script with Phase Tagging ===

PHASE_FILE="phase.txt"
if [ -f "$PHASE_FILE" ]; then
  PHASE=$(cat "$PHASE_FILE" | tr -d '\n\r')
elif [ ! -z "$PHASE" ]; then
  PHASE="$PHASE"
else
  PHASE="unlabeled"
fi

BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "main")
MESSAGE="Auto commit for $PHASE on $(date '+%Y-%m-%d %H:%M:%S')"

# Append to version log
{
  echo "-------------------------------------------------"
  echo "## [$PHASE] - $MESSAGE"
  git diff --name-only
  echo "-------------------------------------------------"
} >> version_log.md

# Add, commit, tag, and push
git add .
git commit -m "[$PHASE] $MESSAGE"
git tag -f "$PHASE-$(date '+%Y%m%d%H%M%S')"
git push origin "$BRANCH" --follow-tags

echo "✅ Auto Git Commit Complete ($PHASE on $BRANCH)"
