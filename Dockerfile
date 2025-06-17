FROM node:lts-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build-client
RUN npm run build-server
CMD ["node", "dist/backend/server/index.js"]
EXPOSE 3000 3001