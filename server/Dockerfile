FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run prisma:generate

RUN npm run build

#RUN npm run prisma:migrate

EXPOSE 5000
CMD ["npm", "start"]