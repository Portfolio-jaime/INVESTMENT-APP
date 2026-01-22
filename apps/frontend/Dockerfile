# Multi-stage build for React SPA
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY . .
RUN npm install && npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]