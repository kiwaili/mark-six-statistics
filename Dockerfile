# Use the official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy the rest of the application code
COPY server.js ./
COPY routes/ ./routes/
COPY services/ ./services/
COPY models/ ./models/
COPY public/ ./public/

# List files for debugging (non-blocking)
RUN ls -la /app || true

# Expose the port the app runs on
EXPOSE 8080

# Cloud Run will set PORT automatically via environment variable
# We set a default here, but Cloud Run will override it
ENV PORT=8080
ENV NODE_ENV=production

# Use node directly (not through npm start) for better Cloud Run compatibility
CMD ["node", "server.js"]

