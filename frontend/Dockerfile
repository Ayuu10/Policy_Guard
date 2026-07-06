# Stage 1: Build static assets
FROM node:20-alpine AS build

WORKDIR /app

# Copy package configurations
COPY package.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy all source files
COPY . .

# Run build
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build files from previous stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
