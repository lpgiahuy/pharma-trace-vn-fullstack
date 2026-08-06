FROM node:18-alpine

# Install build dependencies required for compiling native modules like bcrypt
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package configuration files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the backend source code
COPY . .

# Expose the application port
EXPOSE 3002

# Command to start the server
CMD ["npm", "start"]
