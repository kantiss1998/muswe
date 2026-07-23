# Log Langkah Konfigurasi Integrasi Biteship & DOKU Payment Gateway

Dokumen ini berisi daftar langkah konfigurasi yang **perlu dilakukan** setelah migrasi database & deployment Supabase Edge Functions.

---

## ✅ Yang Sudah Selesai Dikerjakan

1. **Database Migration**: `supabase db push` — **SELESAI**
   - Schema remote Supabase sudah di-update (DOKU fields + Biteship fields + drop legacy shipping tables).
2. **Deploy Edge Functions**: `supabase functions deploy` — **SELESAI**
   - Project Supabase ID: `xsuujkceybfgdvlfhhmh`
   - `generate-payment`, `doku-webhook`, `check-payment-status` sudah di-deploy.

---

## 📌 Langkah Selanjutnya (Segera Lakukan)

### 2. Set Secrets / Environment Variables di Supabase Edge Functions

Jalankan perintah berikut di Terminal PowerShell / Command Prompt (Ganti nilai credential asli dari Dashboard DOKU & Biteship):

```bash
supabase secrets set DOKU_CLIENT_ID="KODE_CLIENT_ID_DOKU" DOKU_SECRET_KEY="KODE_SECRET_KEY_DOKU" DOKU_MODE="sandbox" BITESHIP_API_KEY="KODE_API_KEY_BITESHIP" BITESHIP_ORIGIN_POSTAL_CODE="40295"
```

> **Catatan:** Jika nanti sudah siap Go-Live (Production), ubah `DOKU_MODE="production"`.

---

### 3. Isi Environment Variables di `.env.local` Aplikasi Next.js

Buka file `d:\Muswee Project\muswe\.env.local` (buat jika belum ada), lalu isi variabel berikut:

```env
# DOKU Payment Gateway
DOKU_CLIENT_ID=KODE_CLIENT_ID_DOKU
DOKU_SECRET_KEY=KODE_SECRET_KEY_DOKU
DOKU_MODE=sandbox

# Biteship Shipping API
BITESHIP_API_KEY=KODE_API_KEY_BITESHIP
BITESHIP_ORIGIN_POSTAL_CODE=40295
```

---

### 4. Daftarkan Notification URL (Webhook) di Dashboard DOKU

Agar DOKU bisa memberi tahu sistem Muswe ketika pembayaran berhasil / gagal:

1. Login ke **DOKU Dashboard / Back Office** (Sandbox / Production).
2. Buka menu **Settings** > **Payment Settings** > **Notification URL / Webhook**.
3. Isi kolom **Notification URL** dengan URL berikut:

   ```
   https://xsuujkceybfgdvlfhhmh.supabase.co/functions/v1/doku-webhook
   ```

4. Simpan pengaturan.

---

## 🔍 Cara Verifikasi & Testing

1. Jalankan aplikasi lokal: `npm run dev` di folder `muswe`.
2. Lakukan checkout barang dengan alamat tujuan mana saja.
3. Pastikan daftar kurir real-time dari Biteship muncul beserta harga ongkirnya.
4. Klik **Bayar Sekarang** -> Sistem akan mengarahkan ke halaman DOKU Checkout.
5. Selesaikan pembayaran test di Sandbox DOKU -> Webhook akan mengupdate pesanan menjadi status `diproses` (`processing`).
