# syntax=docker/dockerfile:1

ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-bookworm-slim

ENV NODE_ENV=production
WORKDIR /usr/src/app

# Instala dependencias de producción
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Copia el código
COPY . .

# Crea carpeta de datos y copia la base por defecto
RUN mkdir -p /data

# Configura el path de la base
ENV DB_PATH=/data/data.sqlite
# Variables opcionales para backups a S3
# ENV AWS_REGION=us-east-1
# ENV S3_BUCKET=tu-bucket
# ENV S3_KEY=backups/data.sqlite
# ENV S3_BACKUP_INTERVAL_MS=600000

EXPOSE 3000
CMD ["npm", "start"]