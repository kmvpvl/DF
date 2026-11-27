# Этап 1: Сборка типов и фронтенда
FROM node:22-alpine AS build

WORKDIR /app

# 1. Копируем корневые файлы и package.json воркспейсов для кэширования слоев
COPY package*.json ./
COPY packages/types/package.json ./packages/types/
COPY client/package.json ./client/

# Устанавливаем зависимости
RUN npm ci --workspace=client --workspace=@df/types --include-workspace-root

# 2. Копируем исходники типов и клиента
COPY packages/types ./packages/types
COPY client ./client

# 3. Сначала компилируем общий пакет типов
RUN npm run build --workspace=@df/types

# 4. Переходим в папку клиента и собираем Vite
WORKDIR /app/client
RUN npm run build

# Этап 2: Финальный образ для раздачи статики
FROM node:22-alpine

WORKDIR /app

RUN npm install -g serve

# Забираем собранную статику из папки /app/client/dist
COPY --from=build /app/client/dist /app/dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
