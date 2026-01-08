# =============================================================================
# Bwaincell Discord Bot - Multi-Stage Docker Build
# =============================================================================
# This Dockerfile builds the Discord bot + Express API for deployment on Raspberry Pi 4B
# PostgreSQL database in separate container (see docker-compose.yml)
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM --platform=linux/arm64 node:18-alpine AS deps

# Install dependencies for native modules (pg for PostgreSQL)
RUN apk add --no-cache libc6-compat postgresql-client && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM --platform=linux/arm64 node:18-alpine AS builder

# Install build dependencies for native modules (pg, TypeScript compilation)
RUN apk add --no-cache python3 make g++ postgresql-dev && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install ALL dependencies (including devDependencies for TypeScript compilation)
RUN npm ci

# Copy source files for build
COPY src/ ./src/
COPY commands/ ./commands/
COPY database/ ./database/
COPY shared/ ./shared/
COPY utils/ ./utils/
COPY config/ ./config/
COPY types/ ./types/
COPY tsconfig.json ./

# Set build environment
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Clean any pre-existing compiled code to force fresh compilation
RUN rm -rf dist/ *.tsbuildinfo

# Compile TypeScript
RUN npm run build

# Validate compiled code exists
RUN test -f dist/src/bot.js || \
    (echo "ERROR: Compiled bot.js not found in dist/src/" && exit 1)

# -----------------------------------------------------------------------------
# Stage 3: Runner
# -----------------------------------------------------------------------------
FROM --platform=linux/arm64 node:18-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 botuser && \
    adduser --system --uid 1001 botuser

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy compiled bot from builder
COPY --from=builder --chown=botuser:botuser /app/dist ./dist

# Copy package.json for runtime (module-alias needs it)
COPY --chown=botuser:botuser package.json ./

# Create data and logs directories with proper permissions
RUN mkdir -p /app/data /app/logs && \
    chown -R botuser:botuser /app

# Switch to non-root user
USER botuser

# Expose health check port (Express API)
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Health check (Express API health endpoint)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the bot
CMD ["node", "dist/src/bot.js"]
