# Development
FROM node:lts-alpine AS development
WORKDIR /app

COPY package*.json ./
RUN npm install
EXPOSE 3001 9229

COPY . .

# In dev environments, we could go through the process of imitating a CA and adding that to our computer, configuring DNS entries for a cert
# But the following environment variable is simpler for local development. Just don't do this in production
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

RUN npm run build-client
CMD ["npm", "run", "lobbyService:watch"]

# Production
FROM node:lts-alpine AS production
WORKDIR /app

COPY package*.json ./
RUN npm install
EXPOSE 3001

COPY . .
RUN npm run build-client
RUN npm run build-lobby
CMD ["node", "dist/lobbyService/server/index.js"]