FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json .
# COPY pnpm-lock.yaml .

RUN corepack enable
RUN pnpm install

COPY . .

RUN pnpm run build
RUN pnpm prune --prod

FROM node:20-alpine AS deployer

WORKDIR /app

COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY --from=builder /app/package.json .

EXPOSE 3000

ENV NODE_ENV=production

CMD [ "node", "build" ]
