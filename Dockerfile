# Этап 1: Сборка (Builder)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Этап 2: Продакшен (Runner)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Копируем только нужные файлы для работы
COPY package*.json ./
# Устанавливаем только prod-зависимости (без dev)
RUN npm ci --omit=dev

# Копируем скомпилированный код из билдера
COPY --from=builder /app/build ./build
# Копируем локализации
COPY locales ./locales

# Запускаем скомпилированный JS (без tsx для экономии памяти)
CMD ["node", "build/src/main.js"]