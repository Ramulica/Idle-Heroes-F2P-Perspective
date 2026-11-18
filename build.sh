#!/usr/bin/env bash
set -o errexit
pip install --upgrade pip
pip install --retries 15 --timeout 60 -r requirements.txt

# Prefer committed frontend/dist; rebuild when Node is available (Render/Railway).
if command -v npm >/dev/null 2>&1; then
  (cd frontend && npm ci && npm run build)
fi

python manage.py migrate --noinput
python manage.py seed_data
