# ========================================
# Stage 1: Dependencies
# ========================================
FROM node:20-alpine AS deps

# Install libc6-compat for Node.js native modules
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with legacy peer deps flag
RUN npm ci --legacy-peer-deps

# ========================================
# Stage 2: Builder
# ========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (Sharp, etc.)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# ========================================
# Stage 3: Production Runner
# ========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime dependencies for image processing
RUN apk add --no-cache \
    vips \
    curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

# Copy node_modules from builder
COPY --from=builder --chown=expressjs:nodejs /app/node_modules ./node_modules

# Copy source code
COPY --chown=expressjs:nodejs . .

# Copy generated Prisma client
COPY --from=builder --chown=expressjs:nodejs /app/src/generated ./src/generated

# Copy Spanish OCR data for Tesseract
COPY --chown=expressjs:nodejs spa.traineddata ./spa.traineddata

# Create uploads directory
RUN mkdir -p /tmp/uploads && chown -R expressjs:nodejs /tmp/uploads

# Switch to non-root user
USER expressjs

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1

# Start application with tsx (no build needed)
CMD ["npx", "tsx", "src/server.ts"]
