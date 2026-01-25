# Multi-stage build for React web application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY webpack.config.js ./
COPY webpack.renderer.config.js ./

# Install dependencies
RUN npm ci && \
    npm cache clean --force

# Copy source code
COPY src ./src
COPY public ./public

# Build the renderer (web version)
RUN npm run build:renderer

# Production stage - serve with nginx
FROM nginx:alpine

# Copy built assets to nginx
COPY --from=builder /app/dist/renderer /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
