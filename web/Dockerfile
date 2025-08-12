# Use Node.js 18 with Alpine Linux
FROM node:18-alpine

# Install dumb-init and other dependencies
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application (this generates CSS properly)
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port 3000
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]