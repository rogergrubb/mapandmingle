# Multi-stage Dockerfile for MapMingle backend with explicit Prisma generation

# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/

# Install dependencies
RUN npm ci --legacy-peer-deps

# Stage 2: Prisma Generation
FROM node:18-alpine AS prisma
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules

# Copy Prisma schema
COPY apps/backend/prisma ./apps/backend/prisma
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/

# Generate Prisma Client explicitly
RUN cd apps/backend && npx prisma generate

# Stage 3: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies and generated Prisma client
COPY --from=prisma /app/node_modules ./node_modules
COPY --from=prisma /app/apps/backend/node_modules ./apps/backend/node_modules

# Copy source code
COPY . .

# Build TypeScript
RUN cd apps/backend && npm run build

# Stage 4: Production
FROM node:18-alpine AS runner
WORKDIR /app

# Copy built application
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/package.json ./

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "run", "--workspace=@mapmingle/backend", "start"]
