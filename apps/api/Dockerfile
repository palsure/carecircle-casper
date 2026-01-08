# Dockerfile for CareCircle Backend API
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (better-sqlite3 needs build tools)
RUN npm install

# Copy source code
COPY src/ ./src/

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
