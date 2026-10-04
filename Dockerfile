# syntax=docker/dockerfile:1
# AdvocateID: Next.js app in src/webapp. Build context is the repository root.

FROM node:22-alpine AS deps
WORKDIR /app
COPY src/webapp/package.json src/webapp/package-lock.json ./
RUN npm ci

FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY src/webapp/package.json src/webapp/package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY src/webapp/ ./
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
RUN addgroup -S app && adduser -S app -G app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
# Source is kept so `npm run db:migrate`, `db:seed` and `job:nightly` run from the same image
COPY --from=build /app/app ./app
COPY --from=build /app/components ./components
COPY --from=build /app/db ./db
COPY --from=build /app/jobs ./jobs
COPY --from=build /app/lib ./lib
COPY --from=build /app/messages ./messages
COPY --from=build /app/repo ./repo
COPY --from=build /app/proxy.ts /app/package.json /app/tsconfig.json /app/next.config.mjs ./
RUN mkdir -p /app/uploads && chown -R app:app /app
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["npm", "start"]
