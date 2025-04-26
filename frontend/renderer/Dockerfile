# ───────── Build Stage ─────────
FROM node:18-alpine AS builder
WORKDIR /app

# 1. install deps
COPY package.json package-lock.json ./
RUN npm ci

# 2. copy source (index.html, src/, public/, config files…)
COPY . .

# 3. build for production
RUN npm run build


# ─────── Production Stage ───────
FROM nginx:stable-alpine
# remove default site
RUN rm /etc/nginx/conf.d/default.conf

# simple SPA fallback
COPY nginx.conf /etc/nginx/conf.d/

# copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
