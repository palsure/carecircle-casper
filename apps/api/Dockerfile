# Dockerfile for CareCircle Backend API
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use install since no package-lock.json)
RUN npm install --production

# Copy source code
COPY src/ ./src/

# Create directory for SQLite database
RUN mkdir -p /app/data

# Expose port
EXPOSE 8080

# Set environment variable for port (Cloud Run uses PORT=8080)
ENV PORT=8080
ENV NODE_ENV=production

# Start the server
CMD ["node", "src/index.js"]
