#!/usr/bin/env bash
# Lightweight startup log aggregator for Windows environments using Git Bash or WSL.
set -e
LOG_FILE="backend_startup_latest.log"
{ echo "=== Backend Startup Snapshot ==="; echo; curl -s http://localhost:3000/api/health || true; echo; ls -la backend; } > "$LOG_FILE" 2>&1
printf "Startup log captured to %s\n" "$LOG_FILE";
