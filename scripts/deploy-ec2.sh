#!/bin/bash

# ==============================================================================
# Script Otomatisasi Deployment Frontend ke AWS EC2
# ==============================================================================
# Penggunaan: ./deploy-ec2.sh <username_docker_hub> [port]
# Contoh: ./deploy-ec2.sh diffarydk 80
# ==============================================================================

# Hentikan script jika ada error
set -e

DOCKER_USERNAME=$1
PORT=${2:-80}
CONTAINER_NAME="chat-frontend"

# Cek argumen pertama (Username Docker Hub)
if [ -z "$DOCKER_USERNAME" ]; then
    echo "❌ Error: Username Docker Hub harus dimasukkan!"
    echo "Format penggunaan: $0 <username_docker_hub> [port]"
    echo "Contoh: $0 diffarydk 80"
    exit 1
fi

IMAGE_NAME="$DOCKER_USERNAME/chat-frontend:latest"

echo "--------------------------------------------------"
echo "🚀 Memulai Otomatisasi Deployment Frontend"
echo "📦 Image Docker: $IMAGE_NAME"
echo "🔌 Port Publik : $PORT"
echo "--------------------------------------------------"

# 1. Cek apakah Docker sudah terinstal di server
if ! [ -x "$(command -v docker)" ]; then
    echo "⚙️ Docker belum ditemukan. Memulai proses instalasi..."
    
    # Update package lists
    sudo apt-get update -y
    
    # Install dependencies
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    
    # Tambah GPG key resmi Docker
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Tambahkan repository ke apt sources
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Jalankan install Docker
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Daftarkan user sistem ke grup docker agar tidak perlu command 'sudo'
    sudo usermod -aG docker $USER
    
    echo "✅ Docker berhasil diinstal."
    echo "💡 Catatan: Agar izin akses Docker grup berjalan maksimal, Anda mungkin perlu relogin SSH nanti."
else
    echo "✅ Docker sudah terinstal di sistem."
fi

# 2. Unduh Image Terbaru dari Docker Hub
echo "📥 Menarik (pull) image terbaru dari Docker Hub..."
sudo docker pull $IMAGE_NAME

# 3. Bersihkan Container Lama jika Ada
if [ "$(sudo docker ps -a -q -f name=$CONTAINER_NAME)" ]; then
    echo "🧹 Menghentikan dan menghapus container lama ($CONTAINER_NAME)..."
    sudo docker stop $CONTAINER_NAME || true
    sudo docker rm $CONTAINER_NAME || true
fi

# 4. Jalankan Container Baru
echo "🚀 Menjalankan container baru..."
sudo docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:80 \
  --restart always \
  $IMAGE_NAME

echo "--------------------------------------------------"
echo "🎉 DEPLOYMENT BERHASIL!"
echo "🌐 Aplikasi Anda sekarang aktif di http://\$(curl -s ifconfig.me):$PORT"
echo "--------------------------------------------------"
