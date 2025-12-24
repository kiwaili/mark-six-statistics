# Use the official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy the rest of the application code
COPY server.js ./
COPY routes/ ./routes/
COPY services/ ./services/
COPY models/ ./models/
COPY public/ ./public/

# Environment
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 8080

# Cloud Run will set PORT automatically via environment variable
# We set a default here, but Cloud Run will override it
ENV PORT=8080

# Use node directly (not through npm start) for better Cloud Run compatibility
CMD ["node", "server.js"]

