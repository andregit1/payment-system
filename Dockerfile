# Use the Node.js 20 LTS version with Alpine
FROM node:20-alpine


# Create and set the working directory
WORKDIR /app

# Copy package.json and package-lock.json files to the working directory
COPY package*.json ./
COPY prisma ./prisma/

# Install the dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# setup database
RUN npx prisma generate

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]
