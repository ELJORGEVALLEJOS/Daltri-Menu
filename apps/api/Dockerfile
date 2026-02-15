FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci
RUN npx prisma generate

COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY scripts ./scripts
COPY src ./src

RUN npm run build

FROM node:20-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/prisma ./prisma

EXPOSE 4000

CMD ["node", "scripts/start.js"]
