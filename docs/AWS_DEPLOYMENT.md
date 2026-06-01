# Panduan Deployment AWS EC2 — FECHAT

Dokumen ini menjelaskan langkah demi langkah untuk melakukan deployment image Docker Frontend (`chat-frontend`) dari Docker Hub ke virtual server **AWS EC2 (Elastic Compute Cloud)**.

---

## 1. Persiapan Instance AWS EC2

### Langkah 1: Peluncuran Instance (Launch Instance)
1. Masuk ke **AWS Management Console**.
2. Cari dan pilih layanan **EC2**, lalu klik **Launch Instance**.
3. Konfigurasikan detail instance berikut:
   * **Name**: `fechat-frontend` (atau nama lain pilihan Anda).
   * **Application and OS Images (AMI)**: Pilih **Ubuntu** (versi `Ubuntu Server 22.04 LTS` atau `24.04 LTS`).
   * **Instance Type**: Pilih **`t3.micro`** (gratis jika Anda berada dalam program AWS Free Tier) atau **`t2.micro`**.
   * **Key Pair (login)**: Klik *Create new key pair* jika belum punya. Unduh file `.pem` tersebut (misal: `fechat-key.pem`) dan simpan di folder aman di komputer lokal Anda.

### Langkah 2: Konfigurasi Firewall / Security Group
Pada bagian **Network settings**, buat Security Group baru dan tambahkan aturan masuk (**Inbound Security Group Rules**) berikut:

| Type | Port Range | Source | Deskripsi |
| :--- | :--- | :--- | :--- |
| **SSH** | `22` | `My IP` (Sangat Disarankan) atau `0.0.0.0/0` | Untuk mengakses server melalui terminal Anda. |
| **HTTP** | `80` | `0.0.0.0/0` | Akses web browser standar (HTTP). |
| **HTTPS** | `443` | `0.0.0.0/0` | Akses web browser aman (HTTPS). |

4. Klik **Launch Instance** untuk memulai server. Tunggu beberapa saat hingga status instance menjadi *Running*.
5. Salin **Public IPv4 address** dari instance baru Anda (misal: `54.255.120.45`).

---

## 2. Menghubungkan ke EC2 via SSH

Buka terminal di komputer Anda (atau PowerShell/Git Bash jika di Windows) dan jalankan perintah berikut:

1. Ubah permission file `.pem` Anda (khusus pengguna Linux/macOS):
   ```bash
   chmod 400 /path/to/fechat-key.pem
   ```
2. Hubungkan ke instance EC2 Anda:
   ```bash
   ssh -i "/path/to/fechat-key.pem" ubuntu@IP_PUBLIC_EC2_ANDA
   ```
   *(Ganti `IP_PUBLIC_EC2_ANDA` dengan Public IP dari EC2 yang Anda salin sebelumnya, contoh: `ubuntu@54.255.120.45`)*.

---

## 3. Instalasi Docker & Menjalankan Aplikasi

Setelah berhasil login ke server EC2 melalui SSH, jalankan langkah-langkah berikut untuk menginstal Docker dan menjalankan aplikasi Frontend Anda.

### Cara 1: Menggunakan Script Otomatisasi (Direkomendasikan)
Kami telah menyediakan script otomatisasi di dalam repositori Anda untuk melakukan instalasi dan setup container secara instan.

1. Clone repositori Anda di dalam server EC2:
   ```bash
   git clone https://github.com/diffarydk/chatFE.git
   cd chatFE
   ```
2. Berikan izin eksekusi pada script deployment:
   ```bash
   chmod +x scripts/deploy-ec2.sh
   ```
3. Jalankan script deployment dengan menyertakan nama Docker Hub Anda:
   ```bash
   ./scripts/deploy-ec2.sh USERNAME_DOCKER_HUB_ANDA
   ```
   *(Contoh: `./scripts/deploy-ec2.sh diffarydk`)*.

---

### Cara 2: Instalasi Manual

Jika Anda lebih memilih melakukan setup manual langkah demi langkah:

#### Langkah 1: Instal Docker
Jalankan perintah berikut di terminal EC2 untuk menginstal Docker:
```bash
# Update package lists
sudo apt-get update -y

# Install certificates and curl
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Masukkan user ubuntu ke grup docker agar tidak perlu mengetik 'sudo' setiap menjalankan docker
sudo usermod -aG docker ubuntu
```
*(Setelah menjalankan perintah grup di atas, silakan keluar dari SSH dengan mengetik `exit` lalu login kembali via SSH agar perubahan grup aktif)*.

#### Langkah 2: Unduh dan Jalankan Container Frontend
Jalankan perintah berikut untuk menarik image terbaru dari Docker Hub dan menjalankannya di port `80`:

```bash
# Unduh image terbaru dari Docker Hub
docker pull USERNAME_DOCKER_HUB_ANDA/chat-frontend:latest

# Hentikan dan hapus container lama jika ada yang berjalan di port 80
docker stop chat-frontend || true
docker rm chat-frontend || true

# Jalankan container baru
docker run -d \
  --name chat-frontend \
  -p 80:80 \
  --restart always \
  USERNAME_DOCKER_HUB_ANDA/chat-frontend:latest
```

---

## 4. Konfigurasi Domain & HTTPS (Sangat Direkomendasikan)

Saat ini, aplikasi Anda sudah dapat diakses menggunakan browser melalui alamat **`http://IP_PUBLIC_EC2_ANDA`**. Namun untuk kebutuhan produksi, sangat disarankan menggunakan domain dan sertifikat SSL gratis dari Let's Encrypt.

### Langkah-langkah setup HTTPS via Nginx Reverse Proxy:

1. **Arahkan Domain**: Arahkan nama domain Anda (misalnya `chat.domainanda.com`) ke IP Publik EC2 Anda menggunakan **A Record** di DNS Management penyedia domain Anda (Cloudflare, GoDaddy, dll.).
2. **Ubah Jalur Port Container**: Hentikan container yang berjalan di port `80` dan jalankan di port internal (misal `8080`):
   ```bash
   docker stop chat-frontend && docker rm chat-frontend
   docker run -d --name chat-frontend -p 8080:80 --restart always USERNAME_DOCKER_HUB_ANDA/chat-frontend:latest
   ```
3. **Instal Nginx & Certbot di Host EC2**:
   ```bash
   sudo apt-get install -y nginx certbot python3-certbot-nginx
   ```
4. **Buat Konfigurasi Nginx**:
   Buat file konfigurasi `/etc/nginx/sites-available/chat`:
   ```nginx
   server {
       listen 80;
       server_name chat.domainanda.com; # Ganti dengan domain Anda

       location / {
           proxy_pass http://localhost:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded-for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
5. **Aktifkan Konfigurasi**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/chat /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default || true
   sudo nginx -t && sudo systemctl restart nginx
   ```
6. **Pasang Sertifikat SSL**:
   ```bash
   sudo certbot --nginx -d chat.domainanda.com
   ```
   Ikuti petunjuk di layar (pilih opsi *Redirect* agar HTTP otomatis dialihkan ke HTTPS). 

Sekarang, aplikasi Frontend Anda sudah aman diakses menggunakan protokol **`https://chat.domainanda.com`**!
