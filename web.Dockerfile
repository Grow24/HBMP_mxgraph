# HBMP frontend (Next.js). Use this Dockerfile on the Zeabur "web" service.
# Do not reuse the server Dockerfile here.
FROM node:20-bookworm-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile

ARG NEXT_PUBLIC_SERVER_URL=https://mxgraph-reactflow.zeabur.app
ARG SERVER_URL=https://mxgraph-reactflow.zeabur.app
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
ENV SERVER_URL=$SERVER_URL
ENV NODE_ENV=production

RUN pnpm run build:web

EXPOSE 8080
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

CMD ["pnpm", "run", "start:web"]
