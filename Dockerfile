# Generated by https://smithery.ai. See: https://smithery.ai/docs/config#dockerfile
FROM node:lts-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./

RUN npm install --ignore-scripts

# Copy all files
COPY . .

# Build the project
RUN npm run build

CMD [ "node", "build/index.js" ]
