# Use the official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Cloud Run will set PORT automatically via environment variable
# We set a default here, but Cloud Run will override it
ENV PORT=8080
ENV NODE_ENV=production

# Start the application
CMD ["node", "server.js"]

