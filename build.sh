#!/usr/bin/env bash
set -o errexit
pip install --upgrade pip
pip install --retries 15 --timeout 60 -r requirements.txt
python manage.py migrate --noinput
python manage.py seed_data
