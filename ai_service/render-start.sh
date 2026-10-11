
#!/usr/bin/env bash
set -e

exec gunicorn --bind "0.0.0.0:${PORT:-8001}" --workers 1 --threads 1 --timeout 300 "ai_service.app:app"
