# Fase 1: Build
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Forza l'uso del registro ufficiale NPM
RUN npm config set registry https://registry.npmjs.org/

# Copia i file di dipendenza
COPY package*.json ./

# Installa tutte le dipendenze (incluse devDependencies necessarie per Vite)
RUN npm ci

# Copia il resto dei file
COPY . .

# Esegui la build di Vite
RUN npm run build

# Fase 2: Immagine leggera per la produzione
FROM node:22-bookworm-slim
WORKDIR /app

# Installa solo serve per servire i file statici
RUN npm install -g serve

# Copia solo la cartella di build dal builder
COPY --from=builder /app/dist ./dist

EXPOSE 4173
CMD ["serve", "dist", "-p", "4173", "--cors"]
