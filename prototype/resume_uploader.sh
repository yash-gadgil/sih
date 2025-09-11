#!/usr/bin/env bash

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="${SCRIPT_DIR}/../example_resumes"
URL="http://127.0.0.1:5000/upload-cv"

for i in {1..5}; do
  FILE="${BASE_DIR}/resume_${i}.pdf"
  if [[ -f "$FILE" ]]; then
    echo "Uploading $FILE"
    curl -s -X POST -F "file=@\"$FILE\"" "$URL" | sed 's/.*/Response: &/'
  else
    echo "Skip missing $FILE" >&2
  fi
  sleep 0.2
done
