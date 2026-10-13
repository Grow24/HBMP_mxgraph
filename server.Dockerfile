# HBMP backend (Express + Prisma). Use this Dockerfile on the Zeabur "server" service.
FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile
RUN pnpm run build:server

ENV NODE_ENV=production
EXPOSE 8080
ENV PORT=8080

CMD ["pnpm", "run", "start:server"]
