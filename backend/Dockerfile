FROM node:20-slim AS builder
WORKDIR /app
COPY backend/ ./
RUN npm install
# Use production schema (PostgreSQL) instead of dev schema (SQLite)
RUN mv prisma/schema.production.prisma prisma/schema.prisma
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push --schema=prisma/schema.prisma && node dist/index.js"]
