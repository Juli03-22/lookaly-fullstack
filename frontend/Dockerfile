FROM node:20-alpine

WORKDIR /app

# Instalar deps primero (caching)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copiar código fuente
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
