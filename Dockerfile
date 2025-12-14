FROM node:18-slim

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (only production)
RUN npm install --only=production

# Copy server source code and other files
COPY . .

# Expose the API port
EXPOSE 3001

# Start the server
CMD [ "node", "server/index.js" ]
