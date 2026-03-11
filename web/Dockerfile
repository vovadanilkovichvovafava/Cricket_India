### Stage 1: Build ###
FROM node:20-alpine AS build

WORKDIR /app

# Install deps first (cache layer)
COPY package.json package-lock.json ./
RUN npm ci

# Build the app
COPY . .
RUN npm run build

### Stage 2: Serve with Nginx ###
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy config injection script into nginx entrypoint.d hooks
# (nginx's default entrypoint auto-runs scripts in /docker-entrypoint.d/)
COPY docker-entrypoint.sh /docker-entrypoint.d/40-inject-config.sh
RUN chmod +x /docker-entrypoint.d/40-inject-config.sh

EXPOSE 3000

# Use default nginx entrypoint (runs /docker-entrypoint.d/*.sh then starts nginx)
CMD ["nginx", "-g", "daemon off;"]
