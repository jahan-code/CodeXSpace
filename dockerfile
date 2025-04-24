# Stage 1: Build the React frontend
FROM node:18 AS frontend

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Final image for serving backend + built frontend
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Replace the local build folder with the one from the frontend build
COPY --from=frontend /app/build ./build

EXPOSE 5000

CMD ["node", "server.js"]
