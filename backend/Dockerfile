FROM node:20-alpine

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json ./

# Copy workspace packages
COPY packages/ ./packages/
COPY backend/ ./backend/

# Install all workspace dependencies from root
RUN npm ci --workspace=backend --workspace=packages/shared --include-workspace-root

# Generate Prisma client (DATABASE_URL is required by prisma.config.ts but not used during generate)
RUN cd backend && DATABASE_URL="postgresql://x:x@localhost/x" npx prisma generate --schema=prisma/schema.prisma

# Build shared package first
RUN npm run build --workspace=packages/shared

# Build backend
RUN npm run build --workspace=backend

WORKDIR /app/backend

EXPOSE 3000

CMD ["node", "dist/src/main"]
