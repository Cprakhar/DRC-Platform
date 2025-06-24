# Dockerfile for DRC Platform Backend (Node.js + TypeScript)
FROM node:24.2.0-alpine3.22

WORKDIR /app

# Install dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove devDependencies for smaller image
RUN npm prune --production

# Add entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port (default 4000)
EXPOSE 4000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "run", "start"]
