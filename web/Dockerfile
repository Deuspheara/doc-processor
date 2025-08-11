# Use Node.js 18 with Alpine Linux for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose port 3000
EXPOSE 3000

# Set environment variables
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Default command (can be overridden by docker-compose)
CMD ["npm", "run", "build", "&&", "npm", "start"]