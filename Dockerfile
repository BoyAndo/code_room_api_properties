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

# Variables de entorno requeridas para producción
ENV PORT=3002 \
    JWT_SECRET="kJ8#mN9$pQ2@wE5!rT7&yU1*iO3^aS6%dF4+gH0-lK9=xC2@vB5!nM8%zQ7*wE3&" \
    JWT_EXPIRES_IN=120h \
    DATABASE_URL="mysql://root:howlin404@uroom.cgt0cmaispf3.us-east-1.rds.amazonaws.com:3306/code_room" \
    MYSQL_USER="root" \
    MYSQL_PASSWORD="" \
    MYSQL_DB="code_room" \
    GOOGLE_MAPS_API_KEY=AIzaSyBQNL9rePdFP6H5sW-iPkLsjjGj_GPYNGg \
    MINIO_ENDPOINT=https://uroom_api_storage.gabogrobier.dev/ \
    MINIO_USER=minioadmin \
    MINIO_PASS=minioadmin123 \
    URL_S3=https://uroom_api_storage.gabogrobier.dev/certificados/ \
    URL_S3_CARNETS=https://uroom_api_storage.gabogrobier.dev/carnets/ \
    URL_S3_UTILITYBILLS=https://uroom_api_storage.gabogrobier.dev/utilitybills/ \
    URL_S3_PROPERTY_IMAGES=https://uroom_api_storage.gabogrobier.dev/properties/

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1

# Start application with tsx (no build needed)
CMD ["npx", "tsx", "src/server.ts"]
