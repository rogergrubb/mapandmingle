# Build stage
FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y openssl libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma client with verbose output
RUN echo "=== Generating Prisma client ===" && npx prisma generate && echo "=== Prisma generate complete ==="

# Copy source code
COPY . .

# List source files for debugging
RUN echo "=== Source files ===" && ls -la src/routes/

# Build TypeScript with verbose output
RUN echo "=== Starting TypeScript build ===" && npm run build 2>&1 || (echo "=== BUILD FAILED ===" && exit 1)

RUN echo "=== Build output ===" && ls -la dist/ && ls -la dist/routes/

# Production stage
FROM node:20-slim AS production

RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm install --omit=dev

# Generate Prisma client
RUN npx prisma generate

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy startup script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 8080

# Run startup script
CMD ["./start.sh"]
