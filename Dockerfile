# Use the official Node.js 14 image as a base
FROM node:18.20.3

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Copy the rest of the application code
COPY . .

# Install dependencies
RUN npm install 

# Expose the port your app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]
