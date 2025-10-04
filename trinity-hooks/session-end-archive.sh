#!/bin/bash
# Trinity Method - Session End Archive Hook
# Automatically archives session when Claude Code stops

PROJECT_NAME="Bwaincell"
TRINITY_HOME="${TRINITY_HOME:-c:/Users/lukaf/Desktop/Dev Work/trinity-method}"
SESSION_DATE=$(date +%Y%m%d)
SESSION_TIME=$(date +%H%M%S)

echo "[TRINITY HOOK]: Session ending - archiving..."

# Create session archive directory
SESSION_ARCHIVE="trinity/sessions/${SESSION_DATE}-${SESSION_TIME}"
mkdir -p "$SESSION_ARCHIVE"

# Archive current work from investigations
if [ -d "trinity/investigations" ] && [ "$(ls -A trinity/investigations 2>/dev/null)" ]; then
  echo "[TRINITY HOOK]: Archiving investigations..."
  cp -r trinity/investigations/* "$SESSION_ARCHIVE/" 2>/dev/null || true
fi

# Archive work orders
if [ -d "trinity/work-orders" ] && [ "$(ls -A trinity/work-orders 2>/dev/null)" ]; then
  echo "[TRINITY HOOK]: Archiving work orders..."
  cp trinity/work-orders/*.md "$SESSION_ARCHIVE/" 2>/dev/null || true
fi

# Create session summary
cat > "$SESSION_ARCHIVE/SESSION-SUMMARY.md" <<EOF
# Session Summary - ${SESSION_DATE} ${SESSION_TIME}

**Project:** Bwaincell
**Framework:** Node.js
**Date:** ${SESSION_DATE}
**Time:** ${SESSION_TIME}
**Trinity Version:** 1.0.1

## Session Archive

This directory contains work completed during this Trinity Method session.

### Contents

- Investigations completed
- Work orders processed
- Patterns discovered
- Issues resolved

### Knowledge Base Status

See trinity/knowledge-base/ for current documentation state.

---

**Archived by:** Trinity Method Session End Hook
**Next Session:** Review trinity/knowledge-base/To-do.md
EOF

# Update sessions index
if [ ! -f "trinity/sessions/INDEX.md" ]; then
  cat > "trinity/sessions/INDEX.md" <<EOF
# Bwaincell - Session Index

**Framework:** Node.js
**Trinity Version:** 1.0.1

## Sessions

EOF
fi

echo "- **${SESSION_DATE}-${SESSION_TIME}**: Session archived" >> trinity/sessions/INDEX.md

echo "[TRINITY HOOK]: ✅ Session archived to ${SESSION_ARCHIVE}"
echo "[TRINITY HOOK]: Review trinity/sessions/INDEX.md for all sessions"
