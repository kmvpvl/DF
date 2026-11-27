FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# 1. Копируем корневые файлы и package.json всех воркспейсов для кэширования npm install
COPY package*.json ./
COPY packages/types/package.json ./packages/types/
COPY server/package.json ./server/

# Устанавливаем зависимости всего монорепозитория (или только нужных воркспейсов)
RUN npm ci

# 2. Копируем исходный код общих типов и сервера
COPY packages/types ./packages/types
COPY server ./server

# 3. Сначала компилируем пакет @df/types
RUN npm run build --workspace=@df/types

# 4. Переходим в папку сервера и выполняем генерацию Prisma и сборку
WORKDIR /app/server
RUN npm run prisma:generate
RUN npm run build

EXPOSE 5000
CMD ["npm", "run", "start:prod"]
