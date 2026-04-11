FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run prisma:generate

RUN npm run build

EXPOSE 5000
CMD ["npm", "start:prod"]