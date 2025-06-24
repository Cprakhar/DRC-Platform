#!/bin/sh
# Entrypoint for DRC backend: write GCS key from env to file, then start app

if [ -n "$GCS_KEY_JSON" ]; then
  echo "$GCS_KEY_JSON" > /app/gcs-key.json
  echo "[entrypoint] Wrote gcs-key.json from GCS_KEY_JSON env var."
else
  echo "[entrypoint] WARNING: GCS_KEY_JSON env var not set. gcs-key.json will not be created."
fi

exec "$@"
