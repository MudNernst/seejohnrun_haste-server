#!/bin/bash

# We use this file to translate environmental variables to .env files used by the application

set -e

node ./docker-entrypoint.js > ./config.js

if [ ! -e "/app/server.js" ]; then
  cp -r /usr/src/app/. /app
  cd /app
  echo "npm installation executing"
  npm install
  echo "npm installation finished"
fi
cd /app

exec "$@"
