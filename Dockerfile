# 1단계 - 빌드
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL
ARG VITE_NAVER_MAP_CLIENT_ID
ARG VITE_SUPPORT_EMAIL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_NAVER_MAP_CLIENT_ID=$VITE_NAVER_MAP_CLIENT_ID
ENV VITE_SUPPORT_EMAIL=$VITE_SUPPORT_EMAIL
RUN npm run build

# 2단계 - 서빙
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# healthcheck용 curl 설치
RUN apk add --no-cache curl

EXPOSE 80
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:80 || exit 1