# Frontend Dockerfile - Multi-stage build
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Set memory optimization environment variables
ENV NODE_OPTIONS="--max_old_space_size=4096"
ENV GENERATE_SOURCEMAP=false
ENV CI=false

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci --only=production=false --silent

# Copy source code
COPY . .

# Build the application with memory optimizations
RUN npm run build:docker

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]