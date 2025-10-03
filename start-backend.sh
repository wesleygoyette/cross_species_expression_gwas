#!/bin/bash
set -e

cd "$(dirname "$0")/backend"

./venv/bin/python manage.py runserver