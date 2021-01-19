#!/bin/bash

# We use this file to translate environmental variables to .env files used by the application

set -e

node ./docker-entrypoint.js > ./config.js

if [ ! -e "/app/server.js" ]; then
  cp -rf /usr/src/app/* /app
fi
cd /app

exec "$@"
