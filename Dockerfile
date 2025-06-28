# Development
FROM node:lts-alpine AS development
WORKDIR /app

COPY package*.json ./
RUN npm install
EXPOSE 3000 3001 9229

COPY . .
CMD ["npm", "run", "server:docker:debug"]

# Production
FROM node:lts-alpine AS production
WORKDIR /app

COPY package*.json ./
RUN npm install
EXPOSE 3000 3001

COPY . .
RUN npm run build-client
RUN npm run build-server
CMD ["node", "dist/backend/server/index.js"]