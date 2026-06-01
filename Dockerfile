# ==========================================
# Stage 1: Build aplikasi Vite dengan Node
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files dan install
COPY package*.json ./
RUN npm install

# Copy seluruh source code
COPY . .

# Siapkan slot ARG untuk URL Backend nantinya
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Jalankan proses build (menghasilkan folder /dist)
RUN npm run build

# ==========================================
# Stage 2: Serve aplikasi dengan Nginx
# ==========================================
FROM nginx:alpine

# Hapus konfigurasi Nginx default
RUN rm /etc/nginx/conf.d/default.conf

# Copy file nginx.conf custom yang sudah Anda buat
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy folder hasil build dari Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
