# ─── Build Stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copy root workspace configurations and lockfiles
COPY package.json package-lock.json ./

# Copy workspaces packages configuration files
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install dependencies across all workspaces
RUN npm ci

# Copy source code files
COPY shared/ ./shared/
COPY backend/ ./backend/

# Build shared library first (backend depends on it)
RUN npm run build --workspace=shared

# Generate Prisma Client relative to the workspace environment
WORKDIR /app/backend
RUN npx prisma generate

# Build the backend application
RUN npm run build

# ─── Production Stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

# Copy only the compiled distributions, configuration files, and node_modules
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma

# Correct permissions for the non-root runner user (Hugging Face runs as user ID 1000, which is pre-created as 'node' in node-alpine)
RUN chown -R node:node /app

USER node

# Set production environment flags
ENV NODE_ENV=production
# Hugging Face Spaces exposes port 7860 by default
ENV PORT=7860
EXPOSE 7860

# Boot the Express REST API and automate database schema synchronization
CMD ["sh", "-c", "npx prisma db push --schema=backend/prisma/schema.prisma && node backend/dist/index.js"]
