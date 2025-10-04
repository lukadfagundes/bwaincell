# Use Node.js LTS version
FROM node:18-alpine

# Install build dependencies for sqlite3
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

# Create data directory for SQLite
RUN mkdir -p /app/data

# Set environment to production
ENV NODE_ENV=production

# Start the bot
CMD ["npm", "start"]
