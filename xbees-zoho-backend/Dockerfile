# Usa un'immagine leggera
FROM node:22-alpine

# Imposta la directory di lavoro
WORKDIR /app

# Copia i file necessari per le dipendenze
COPY package*.json ./

# Installa le dipendenze (assicurati che package-lock.json sia nel repository!)
RUN npm ci --only=production

# Copia tutto il resto del codice
COPY . .

# Esponi la porta del tuo server
EXPOSE 3002

# Avvia l'applicazione
CMD ["node", "server.js"]
