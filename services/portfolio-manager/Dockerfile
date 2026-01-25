# Multi-stage build for Express/Node.js
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY . .
RUN npm install && npm run build
EXPOSE 8003
CMD ["node", "dist/server.js"]