# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Build for production (API calls go through Nginx, so no proxy needed)
RUN npm run build

# Stage 2: Serve via Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config for React Router (SPA fallback)
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
