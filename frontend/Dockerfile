FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ARG NUXT_NEWSLETTER_WEBHOOK_URL

RUN npm run build

FROM node:22-alpine AS runner
LABEL org.opencontainers.image.source="https://github.com/WayBetterDigital/dom-pl"
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nuxtuser -u 1001
COPY --from=builder --chown=nuxtuser:nodejs /app/.output ./.output
USER nuxtuser
EXPOSE 3000
CMD [ "node", ".output/server/index.mjs" ]