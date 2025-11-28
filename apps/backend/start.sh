#!/bin/bash
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting server..."
exec npm start
