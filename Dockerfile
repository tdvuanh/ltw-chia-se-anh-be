# syntax=docker/dockerfile:1

###############################################
# Build stage: compile TypeScript + Prisma client
###############################################
FROM node:22-bookworm AS build
WORKDIR /app

# Công cụ build cho native module (bcrypt)
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Cài dependencies (tận dụng cache layer)
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

# Sinh Prisma Client + biên dịch TypeScript
COPY . .
RUN npx prisma generate
RUN npm run build

###############################################
# Runtime stage: image gọn để chạy production
###############################################
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Tini xử lý tín hiệu (PID 1) cho graceful shutdown
RUN apt-get update \
  && apt-get install -y --no-install-recommends tini \
  && rm -rf /var/lib/apt/lists/*

# Copy artefacts từ build stage (gồm cả Prisma Client đã generate)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/package.json ./
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["./docker-entrypoint.sh"]
