FROM oven/bun:1.1.45-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN bun install
COPY . .
RUN bun run build
# RUN bun prune --production

FROM oven/bun:1.1.45-alpine

WORKDIR /app
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .
EXPOSE 3000
ENV NODE_ENV=production

CMD [ "node", "build" ]
