# ---------- Build Stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Installer OpenSSL (nécessaire pour Prisma sur Alpine)
RUN apk add --no-cache openssl

# Copier les fichiers package.json pour optimiser le cache
COPY package*.json ./
COPY prisma ./prisma

# Installer les dépendances
RUN npm install

# Copier tout le code du projet
COPY . .

# Générer Prisma client
RUN npx prisma generate

# Build en mode production
RUN npm run build

# ---------- Production Stage ----------
FROM node:20-alpine AS runner
WORKDIR /app

# Installer OpenSSL pour Prisma en prod
RUN apk add --no-cache openssl

# Copier le code buildé depuis le builder
COPY --from=builder /app ./

ENV NODE_ENV=production

EXPOSE 3000

# Lancer Next.js
CMD ["npm", "start"]
