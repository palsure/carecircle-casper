# Dockerfile for CareCircle Backend API
FROM node:18-alpine

# Install build dependencies for native modules (better-sqlite3 needs these)
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code (handle both root and apps/api contexts)
COPY src ./src

# Create directory for SQLite database
RUN mkdir -p /app/data

# Expose port (Railway uses PORT env var, defaults to 3005)
EXPOSE 3005

# Set default environment variables
ENV PORT=3005
ENV NODE_ENV=production
ENV DB_FILE=/app/data/carecircle-application.db

# Start the server
CMD ["node", "src/index.js"]
