# Usa una versione specifica per stabilità (node:22-alpine è ottimo)
FROM node:22-alpine AS builder

# Imposta l'ambiente di produzione
ENV NODE_ENV=production

WORKDIR /app

# Copia prima solo i file delle dipendenze
# Questo permette a Docker di usare la cache: se package.json non cambia,
# questa operazione è istantanea.
COPY package*.json ./

# Installa le dipendenze in modo pulito e veloce
# 'npm ci' è il comando standard per produzione (richiede package-lock.json)
RUN npm ci --only=production

# Copia il resto del codice sorgente
COPY . .

# --- Fase finale (per ridurre la dimensione dell'immagine) ---
FROM node:22-alpine

WORKDIR /app

# Copia solo le dipendenze installate e il codice necessario
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Per sicurezza, esegui come utente non-root
USER node

EXPOSE 3002
CMD ["node", "server.js"]
