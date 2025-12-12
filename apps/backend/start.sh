#!/bin/sh
set -e

echo "Running Prisma DB push..."
npx prisma db push --accept-data-loss --skip-generate || echo "DB push warning (non-fatal)"

echo "Starting server..."
exec node dist/index.js
