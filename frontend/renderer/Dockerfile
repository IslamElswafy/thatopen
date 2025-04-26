# ────────────────
# 1️⃣ Build stage
# ────────────────
FROM node:18-alpine AS builder

# Set working dir
WORKDIR /app

# Copy package manifests & lockfile
COPY package.json package-lock.json ./

# Only install production deps (faster & smaller build)
# if you need devDependencies during build (eg. for TypeScript), use `npm ci` instead.
RUN npm ci  

# Copy the rest of the sources
COPY tsconfig*.json vite.config.ts ./
COPY public ./public
COPY src ./src

# Build the app
RUN npm run build


# ──────────────────────
# 2️⃣ Production stage
# ──────────────────────
FROM nginx:stable-alpine

# Remove default nginx site
RUN rm /etc/nginx/conf.d/default.conf

# Copy our own nginx config (see below)  
COPY nginx.conf /etc/nginx/conf.d/

# Copy built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
