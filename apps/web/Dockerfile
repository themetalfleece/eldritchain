# Build stage
FROM node:22.14.0-alpine AS builder

# Enable Corepack for Yarn 4
RUN corepack enable

# Set working directory
WORKDIR /app

# Copy root package files
COPY package.json yarn.lock .yarnrc.yml ./

# Copy ALL workspace package.json files (Yarn needs to see the full workspace structure)
COPY packages/common/package.json ./packages/common/
COPY apps/contracts/package.json ./apps/contracts/
COPY apps/web/package.json ./apps/web/
COPY apps/indexer/package.json ./apps/indexer/

# Install dependencies for web and common workspaces only
RUN yarn workspaces focus @eldritchain/web @eldritchain/common

# Copy source code
COPY packages/common ./packages/common
COPY apps/web ./apps/web

# Build common package
RUN yarn workspace @eldritchain/common build

# Set working directory to web app
WORKDIR /app/apps/web

# Accept build arguments for Next.js environment variables
ARG NEXT_PUBLIC_CONTRACT_ADDRESS
ARG NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
ARG NEXT_PUBLIC_NETWORK
ARG NEXT_PUBLIC_INDEXER_API_URL

# Set them as environment variables for the build
ENV NEXT_PUBLIC_CONTRACT_ADDRESS=$NEXT_PUBLIC_CONTRACT_ADDRESS
ENV NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=$NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
ENV NEXT_PUBLIC_NETWORK=$NEXT_PUBLIC_NETWORK
ENV NEXT_PUBLIC_INDEXER_API_URL=$NEXT_PUBLIC_INDEXER_API_URL

# Build Next.js app
RUN yarn build

# Production stage
FROM node:22.14.0-alpine

# Enable Corepack for Yarn 4
RUN corepack enable

WORKDIR /app

# Copy root package files
COPY package.json yarn.lock .yarnrc.yml ./

# Copy ALL workspace package.json files (Yarn needs to see the full workspace structure)
COPY packages/common/package.json ./packages/common/
COPY apps/contracts/package.json ./apps/contracts/
COPY apps/web/package.json ./apps/web/
COPY apps/indexer/package.json ./apps/indexer/

# Install production dependencies for web and common workspaces only
RUN yarn workspaces focus --production @eldritchain/web @eldritchain/common

# Copy built files from builder
COPY --from=builder /app/packages/common/dist ./packages/common/dist
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/next.config.mjs ./apps/web/next.config.mjs
COPY --from=builder /app/apps/web/postcss.config.mjs ./apps/web/postcss.config.mjs

# Expose Next.js port
EXPOSE 3000

# Set working directory to web app
WORKDIR /app/apps/web

# Set production environment
ENV NODE_ENV=production

# Start Next.js server
CMD ["yarn", "start"]

