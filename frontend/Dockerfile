FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci || yarn install --frozen-lockfile || pnpm install --frozen-lockfile
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]