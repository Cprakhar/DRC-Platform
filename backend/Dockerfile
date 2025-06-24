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

# Install curl for debugging (optional, remove for production)
RUN apk add --no-cache curl

# Expose port (default 4000)
EXPOSE 4000

CMD ["npm", "run", "start"]
