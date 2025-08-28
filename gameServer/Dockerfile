# Development
FROM node:lts-alpine AS development
WORKDIR /app

COPY package*.json ./
COPY patches ./patches
RUN npm install
EXPOSE 3002 3003 9230

COPY . .

# In dev environments, we could go through the process of imitating a CA and adding that to our computer, configuring DNS entries for a cert
# But the following environment variable is simpler for local development. Just don't do this in production
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
ENV NODE_ENV=development

CMD ["npm", "run", "gameService:watch"]

# Production
FROM node:lts-alpine AS production
WORKDIR /app

COPY package*.json ./
COPY patches ./patches
RUN npm install
EXPOSE 3002 3003

COPY . .
ENV NODE_ENV=production
RUN npm run build-game
CMD ["node", "dist/gameService/gameServer/index.js"]