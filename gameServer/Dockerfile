# Development
FROM node:lts-alpine AS development
WORKDIR /app

COPY package*.json ./
RUN npm install
EXPOSE 3002 3003 9230

COPY . .
CMD ["npm", "run", "gameService:watch"]

# Production
FROM node:lts-alpine AS production
WORKDIR /app

COPY package*.json ./
RUN npm install
EXPOSE 3002 3003

COPY . .
RUN npm run build-client
RUN npm run build-server
CMD ["node", "dist/gameService/server/index.js"]