# Development
FROM node:lts-alpine AS development
WORKDIR /app

COPY package*.json ./
RUN npm install
EXPOSE 5173

COPY . .
CMD ["npm", "run", "client:docker"]